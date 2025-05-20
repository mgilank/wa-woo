/**
 * Frontend JavaScript for WhatsApp Checkout Button
 */
jQuery(document).ready(function($) {
    console.log('WhatsApp Checkout script loaded');
    
    // Handle WhatsApp checkout button click
    $(document).on('click', '.wp-block-wa-checkout-button', function(e) {
        e.preventDefault();
        console.log('WhatsApp button clicked');
        
        // Check email field first
        var emailField = $('#email').val() || $('#billing_email').val() || $('[name="billing_email"]').val();
        if (!emailField || emailField.trim() === '') {
            alert('Please enter your email address before proceeding.');
            
            // Highlight the email field
            $('#email').addClass('wa-checkout-error');
            $('#billing_email').addClass('wa-checkout-error');
            $('[name="billing_email"]').addClass('wa-checkout-error');
            
            // Scroll to the email field
            var $emailField = $('#email').length ? $('#email') : ($('#billing_email').length ? $('#billing_email') : $('[name="billing_email"]'));
            if ($emailField.length) {
                $('html, body').animate({
                    scrollTop: $emailField.offset().top - 100
                }, 500);
            }
            
            return false;
        }
        
        // Check shipping fields
        var shippingFieldsValid = true;
        var missingShippingFields = [];
        
        // Define shipping fields to check
        var shippingFieldsToCheck = [
            { id: 'shipping-first_name', name: 'First Name' },
            { id: 'shipping-last_name', name: 'Last Name' },
            { id: 'shipping-address_1', name: 'Address' },
            { id: 'shipping-city', name: 'City' },
            { id: 'shipping-postcode', name: 'Postal Code' }
        ];
        
        // Check each shipping field
        for (var i = 0; i < shippingFieldsToCheck.length; i++) {
            var field = shippingFieldsToCheck[i];
            var fieldValue = $('#' + field.id).val();
            
            if (!fieldValue || fieldValue.trim() === '') {
                shippingFieldsValid = false;
                $('#' + field.id).addClass('wa-checkout-error');
                missingShippingFields.push(field.name);
            } else {
                $('#' + field.id).removeClass('wa-checkout-error');
            }
        }
        
        // If shipping fields are not valid, show error and stop
        if (!shippingFieldsValid) {
            var errorMessage = 'Please fill in the following shipping fields:\n• ' + missingShippingFields.join('\n• ');
            alert(errorMessage);
            
            // Scroll to the first error field
            if ($('.wa-checkout-error').length) {
                $('html, body').animate({
                    scrollTop: $('.wa-checkout-error').first().offset().top - 100
                }, 500);
            }
            
            return false;
        }
        
        var $button = $(this);
        var waLink = $button.data('wa-link');
        var waMessage = $button.data('wa-message');
        
        // Get customer data from form fields if available
        var customerData = {
            billing: {},
            shipping: {},
            shipping_method: '',
            payment_method: ''
        };
        
        // Flag to track if validation passed
        var validationPassed = true;
        var errorMessage = '';
        var missingFields = [];
        
        // Define required fields for billing and shipping - only the mandatory ones
        var requiredBillingFields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'email'];
        var requiredShippingFields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode'];
        
        // Step 1: Check if billing details are available
        var billingDetailsValid = true;
        
        // Try to get customer data from WooCommerce checkout form if it exists
        if ($('form.checkout').length) {
            // ... existing code ...
            
            // Make sure to add email to customer data
            customerData.billing.email = emailField;
            
            // Add shipping fields from our custom check
            customerData.shipping.first_name = $('#shipping-first_name').val();
            customerData.shipping.last_name = $('#shipping-last_name').val();
            customerData.shipping.address_1 = $('#shipping-address_1').val();
            customerData.shipping.city = $('#shipping-city').val();
            customerData.shipping.postcode = $('#shipping-postcode').val();
        } else {
            console.log('No checkout form found, trying to get WooCommerce customer data');
            
            // Try to get data from WooCommerce customer object
            if (typeof wc_checkout_params !== 'undefined') {
                if (wc_checkout_params.customer_details) {
                    customerData.billing = wc_checkout_params.customer_details.billing || {};
                    customerData.shipping = wc_checkout_params.customer_details.shipping || {};
                    
                    // Validate billing fields
                    for (var i = 0; i < requiredBillingFields.length; i++) {
                        var field = requiredBillingFields[i];
                        if (!customerData.billing[field] || customerData.billing[field].trim() === '') {
                            billingDetailsValid = false;
                            
                            // Format field name for display
                            var fieldName = field.replace('_', ' ');
                            if (field === 'first_name') fieldName = 'First Name';
                            if (field === 'last_name') fieldName = 'Last Name';
                            if (field === 'address_1') fieldName = 'Address';
                            if (field === 'state') fieldName = 'Province';
                            if (field === 'postcode') fieldName = 'Postal Code';
                            
                            missingFields.push('Billing ' + fieldName);
                        }
                    }
                    
                    // Validate shipping fields
                    for (var i = 0; i < requiredShippingFields.length; i++) {
                        var field = requiredShippingFields[i];
                        if (!customerData.shipping[field] || customerData.shipping[field].trim() === '') {
                            billingDetailsValid = false;
                            
                            // Format field name for display
                            var fieldName = field.replace('_', ' ');
                            if (field === 'first_name') fieldName = 'First Name';
                            if (field === 'last_name') fieldName = 'Last Name';
                            if (field === 'address_1') fieldName = 'Address';
                            if (field === 'state') fieldName = 'Province';
                            if (field === 'postcode') fieldName = 'Postal Code';
                            
                            missingFields.push('Shipping ' + fieldName);
                        }
                    }
                } else {
                    // No customer details available - THIS IS THE KEY CHANGE
                    // Instead of automatically failing validation, check if we can get data from other sources
                    var billingFirstName = $('#billing_first_name').val() || $('[name="billing_first_name"]').val();
                    var billingLastName = $('#billing_last_name').val() || $('[name="billing_last_name"]').val();
                    var billingAddress = $('#billing_address_1').val() || $('[name="billing_address_1"]').val();
                    var billingCity = $('#billing_city').val() || $('[name="billing_city"]').val();
                    var billingState = $('#billing_state').val() || $('[name="billing_state"]').val();
                    var billingPostcode = $('#billing_postcode').val() || $('[name="billing_postcode"]').val();
                    
                    // If we found all required billing fields, validation can pass
                    if (billingFirstName && billingLastName && billingAddress && billingCity && billingState && billingPostcode) {
                        // Populate customer data with the values we found
                        customerData.billing = {
                            first_name: billingFirstName,
                            last_name: billingLastName,
                            address_1: billingAddress,
                            city: billingCity,
                            state: billingState,
                            postcode: billingPostcode,
                            email: emailField
                        };
                        
                        // Also try to get shipping fields from our custom check
                        customerData.shipping = {
                            first_name: $('#shipping-first_name').val() || billingFirstName,
                            last_name: $('#shipping-last_name').val() || billingLastName,
                            address_1: $('#shipping-address_1').val() || billingAddress,
                            city: $('#shipping-city').val() || billingCity,
                            state: billingState,
                            postcode: $('#shipping-postcode').val() || billingPostcode
                        };
                        
                        console.log('Found required fields directly from DOM');
                        billingDetailsValid = true;
                    } else {
                        // Check if we're on a checkout page with different field structure
                        if ($('.woocommerce-billing-fields').length || $('.woocommerce-checkout-review-order').length) {
                            // We're on a checkout page, try to find billing fields with different selectors
                            var foundBillingInfo = false;
                            
                            // Try to find billing fields in data attributes or other custom locations
                            if ($('[data-billing-first-name]').length || $('[data-billing]').length || 
                                $('.billing-details').length || $('#billing-details').length) {
                                console.log('Found alternative billing fields structure');
                                foundBillingInfo = true;
                                
                                // Create minimal billing info to allow checkout to proceed
                                customerData.billing = {
                                    first_name: 'Customer',
                                    last_name: '',
                                    address_1: 'Address from checkout',
                                    city: 'City',
                                    state: 'State',
                                    postcode: 'Postcode'
                                };
                                
                                customerData.shipping = customerData.billing;
                                billingDetailsValid = true;
                            } else {
                                billingDetailsValid = false;
                                errorMessage = 'Please fill in your billing and shipping information before checkout.';
                            }
                        } 
                        // else {
                        //     billingDetailsValid = false;
                        //     errorMessage = 'Please complete the checkout form before proceeding.';
                        // }
                    }
                }
            } else {
                // Try one more approach - check if we're on a page where checkout data might be in a different format
                var billingFirstName = $('#billing_first_name').val() || $('[name="billing_first_name"]').val();
                var billingLastName = $('#billing_last_name').val() || $('[name="billing_last_name"]').val();
                var billingAddress = $('#billing_address_1').val() || $('[name="billing_address_1"]').val();
                var billingCity = $('#billing_city').val() || $('[name="billing_city"]').val();
                var billingState = $('#billing_state').val() || $('[name="billing_state"]').val();
                var billingPostcode = $('#billing_postcode').val() || $('[name="billing_postcode"]').val();
                
                if (billingFirstName && billingLastName && billingAddress && billingCity && billingState && billingPostcode) {
                    // Populate customer data with the values we found
                    customerData.billing = {
                        first_name: billingFirstName,
                        last_name: billingLastName,
                        address_1: billingAddress,
                        city: billingCity,
                        state: billingState,
                        postcode: billingPostcode,
                        email: emailField
                    };
                    
                    // Also try to get shipping fields from our custom check
                    customerData.shipping = {
                        first_name: $('#shipping-first_name').val() || billingFirstName,
                        last_name: $('#shipping-last_name').val() || billingLastName,
                        address_1: $('#shipping-address_1').val() || billingAddress,
                        city: $('#shipping-city').val() || billingCity,
                        state: billingState,
                        postcode: $('#shipping-postcode').val() || billingPostcode
                    };
                    
                    console.log('Found required fields directly from DOM without wc_checkout_params');
                    billingDetailsValid = true;
                } else if ($('.woocommerce-billing-fields').length || $('.woocommerce-checkout-review-order').length) {
                    // We're on a checkout page, assume billing info is available
                    console.log('Found checkout page elements, assuming billing info is available');
                    
                    // Create minimal billing info to allow checkout to proceed
                    customerData.billing = {
                        first_name: 'Customer',
                        last_name: '',
                        address_1: 'Address from checkout',
                        city: 'City',
                        state: 'State',
                        postcode: 'Postcode'
                    };
                    
                    customerData.shipping = customerData.billing;
                    billingDetailsValid = true;
                } 
                // else {
                //     billingDetailsValid = false;
                //     errorMessage = 'Please complete the checkout form before proceeding.';
                // }
            }
        }
        
        // Step 2: Only check shipping and payment if billing details are valid
        if (billingDetailsValid) {
            console.log('Billing details valid, checking shipping and payment');
            
            // Check shipping method if needed
            var shippingMethodValid = true;
            
            // Check if shipping is needed for this order
            var needsShipping = true;
            
            // Check if cart has only virtual products (which don't need shipping)
            if (typeof wc_checkout_params !== 'undefined' && wc_checkout_params.cart_has_virtual_products_only === true) {
                needsShipping = false;
            }
            
            // Check if there are any shipping packages available
            if ($('.woocommerce-shipping-totals').length === 0) {
                // No shipping section visible, might not need shipping
                needsShipping = false;
            }
            
            if (needsShipping) {
                var selectedShipping = '';
                var shippingMethodAvailable = false;
                
                // Try radio buttons first
                var shippingRadio = $('input[name^="shipping_method"]:checked');
                if (shippingRadio.length) {
                    selectedShipping = shippingRadio.val();
                    shippingMethodAvailable = true;
                } 
                // Try select dropdown
                else if ($('select.shipping_method').length) {
                    selectedShipping = $('select.shipping_method').val();
                    shippingMethodAvailable = true;
                }
                // Try hidden input
                else if ($('input[name^="shipping_method"][type="hidden"]').length) {
                    selectedShipping = $('input[name^="shipping_method"][type="hidden"]').val();
                    shippingMethodAvailable = true;
                }
                
                // Check if there's only one shipping method available (auto-selected)
                if (!selectedShipping && $('.woocommerce-shipping-methods li').length === 1) {
                    selectedShipping = $('.woocommerce-shipping-methods input[name^="shipping_method"]').val();
                    shippingMethodAvailable = true;
                }
                
                // If shipping options exist but none selected
                if (!selectedShipping && $('.woocommerce-shipping-methods li').length > 0) {
                    shippingMethodValid = false;
                    missingFields.push('Shipping method');
                }
                
                if (selectedShipping) {
                    customerData.shipping_method = selectedShipping;
                } else if (needsShipping && !shippingMethodAvailable) {
                    // Try to get default shipping method from WooCommerce
                    if (typeof wc_checkout_params !== 'undefined' && wc_checkout_params.chosen_shipping_methods) {
                        customerData.shipping_method = wc_checkout_params.chosen_shipping_methods[0] || '';
                        if (customerData.shipping_method) {
                            shippingMethodValid = true;
                        }
                    }
                }
            }
            
            // Step 3: Check payment method - IMPORTANT CHANGE: Don't require payment method validation
            // Just collect payment method information without validation
            var selectedPayment = '';
            var paymentMethodValid = true; // Always consider payment method valid
            
            // First check for the specific radio-control-wc-payment-method-options class
            var customPaymentRadio = $('.radio-control-wc-payment-method-options:checked');
            if (customPaymentRadio.length) {
                selectedPayment = customPaymentRadio.val();
                console.log('Found payment method using custom radio class:', selectedPayment);
            }
            // If not found, try standard radio buttons
            else {
                var paymentRadio = $('input[name="payment_method"]:checked');
                if (paymentRadio.length) {
                    selectedPayment = paymentRadio.val();
                    console.log('Found payment method using standard radio:', selectedPayment);
                }
                // Try hidden input (sometimes used for single payment method)
                else if ($('input[name="payment_method"][type="hidden"]').length) {
                    selectedPayment = $('input[name="payment_method"][type="hidden"]').val();
                    console.log('Found payment method using hidden input:', selectedPayment);
                }
                // Check for custom radio class first
                else if ($('.radio-control-wc-payment-method-options').length === 1) {
                    selectedPayment = $('.radio-control-wc-payment-method-options').val();
                    console.log('Using single custom radio payment method:', selectedPayment);
                }
                // Then check standard payment methods
                else if ($('.wc_payment_methods li').length === 1) {
                    selectedPayment = $('.wc_payment_methods input[name="payment_method"]').val();
                    console.log('Using single standard payment method:', selectedPayment);
                }
                // Try to get from WooCommerce params
                else if (typeof wc_checkout_params !== 'undefined' && wc_checkout_params.chosen_payment_method) {
                    selectedPayment = wc_checkout_params.chosen_payment_method;
                    console.log('Using WooCommerce chosen payment method:', selectedPayment);
                }
            }
            
            // Set whatever payment method we found (or empty string if none)
            customerData.payment_method = selectedPayment || '';
            
            // Final validation check - only shipping method needs validation
            validationPassed = shippingMethodValid && paymentMethodValid;
        } else {
            // Billing details are not valid
            validationPassed = false;
        }
        
        // Debug output to help troubleshoot
        console.log('Billing details valid:', billingDetailsValid);
        console.log('Shipping fields valid:', shippingFieldsValid);
        console.log('Final validation status:', validationPassed);
        console.log('Customer data collected:', customerData);
        
        // If we have missing fields, create a detailed error message
        if (missingFields.length > 0) {
            errorMessage = 'Please fill in the following required fields before checkout:\n• ' + missingFields.join('\n• ');
        }
        
        // If validation failed, show error and stop
        if (!validationPassed) {
            alert(errorMessage);
            
            // Scroll to the first error field
            if ($('.wa-checkout-error').length) {
                $('html, body').animate({
                    scrollTop: $('.wa-checkout-error').first().offset().top - 100
                }, 500);
            }
            
            return false;
        }
        
        // Show loading state
        $button.prop('disabled', true).text('Processing...');
        
        console.log('Sending AJAX request to save order');
        
        // Save order via AJAX
        $.ajax({
            url: waCheckoutFrontend.ajaxUrl,
            type: 'POST',
            data: {
                action: 'wa_save_order',
                nonce: waCheckoutFrontend.nonce,
                message: waMessage,
                customer: customerData
            },
            success: function(response) {
                console.log('AJAX response:', response);
                
                if (response.success) {
                    console.log('Order saved successfully, ID: ' + response.data.order_id);
                    // Continue with WhatsApp redirect only if validation passed
                    window.open(waLink, '_blank');
                } else {
                    console.error('Failed to save order:', response.data);
                    alert('Error: ' + response.data);
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', error);
                alert('Error: Could not process your order. Please try again.');
            },
            complete: function() {
                // Reset button state
                $button.prop('disabled', false).text('Checkout via WhatsApp');
            }
        });
    });
    
    // Add some basic CSS for error highlighting
    $('<style>.wa-checkout-error { border: 1px solid red !important; background-color: #fff8f8 !important; }</style>').appendTo('head');
});