/**
 * Frontend JavaScript for WhatsApp Checkout Button
 */
jQuery(document).ready(function($) {
    console.log('WhatsApp Checkout script loaded');
    
    // Handle WhatsApp checkout button click
    $(document).on('click', '.wp-block-wa-checkout-button', function(e) {
        e.preventDefault();
        console.log('WhatsApp button clicked');
        
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
        var requiredBillingFields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode'];
        var requiredShippingFields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode'];
        
        // Try to get customer data from WooCommerce checkout form if it exists
        if ($('form.checkout').length) {
            console.log('Checkout form found, collecting data');
            
            // Reset any previous error styling
            $('.wa-checkout-error').removeClass('wa-checkout-error');
            
            // Billing fields
            $('form.checkout [name^="billing_"]').each(function() {
                var field = $(this).attr('name').replace('billing_', '');
                customerData.billing[field] = $(this).val();
                
                // Check if this is a required field and it's empty
                if (requiredBillingFields.includes(field) && !$(this).val().trim()) {
                    validationPassed = false;
                    $(this).addClass('wa-checkout-error');
                    
                    // Format field name for display
                    var fieldName = field.replace('_', ' ');
                    if (field === 'first_name') fieldName = 'First Name';
                    if (field === 'last_name') fieldName = 'Last Name';
                    if (field === 'address_1') fieldName = 'Address';
                    if (field === 'state') fieldName = 'Province';
                    if (field === 'postcode') fieldName = 'Postal Code';
                    
                    missingFields.push('Billing ' + fieldName);
                }
            });
            
            // Shipping fields
            $('form.checkout [name^="shipping_"]').each(function() {
                var field = $(this).attr('name').replace('shipping_', '');
                customerData.shipping[field] = $(this).val();
                
                // Check if this is a required field and it's empty
                if (requiredShippingFields.includes(field) && !$(this).val().trim()) {
                    validationPassed = false;
                    $(this).addClass('wa-checkout-error');
                    
                    // Format field name for display
                    var fieldName = field.replace('_', ' ');
                    if (field === 'first_name') fieldName = 'First Name';
                    if (field === 'last_name') fieldName = 'Last Name';
                    if (field === 'address_1') fieldName = 'Address';
                    if (field === 'state') fieldName = 'Province';
                    if (field === 'postcode') fieldName = 'Postal Code';
                    
                    missingFields.push('Shipping ' + fieldName);
                }
            });
            
            // Shipping method - try different selectors to find the shipping method
            var selectedShipping = '';
            var shippingMethodAvailable = false;
            
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
                    validationPassed = false;
                    missingFields.push('Shipping method');
                }
            }
            
            if (selectedShipping) {
                customerData.shipping_method = selectedShipping;
            } else if (needsShipping && !shippingMethodAvailable) {
                // Try to get default shipping method from WooCommerce
                if (typeof wc_checkout_params !== 'undefined' && wc_checkout_params.chosen_shipping_methods) {
                    customerData.shipping_method = wc_checkout_params.chosen_shipping_methods[0] || '';
                }
            }
            
            // Payment method - improved detection
            var selectedPayment = '';
            var paymentMethodAvailable = false;
            
            // Try radio buttons first (most common)
            var paymentRadio = $('input[name="payment_method"]:checked');
            if (paymentRadio.length) {
                selectedPayment = paymentRadio.val();
                paymentMethodAvailable = true;
            }
            // Try hidden input (sometimes used for single payment method)
            else if ($('input[name="payment_method"][type="hidden"]').length) {
                selectedPayment = $('input[name="payment_method"][type="hidden"]').val();
                paymentMethodAvailable = true;
            }
            
            // Check if there's only one payment method available (auto-selected)
            if (!selectedPayment && $('.wc_payment_methods li').length === 1) {
                selectedPayment = $('.wc_payment_methods input[name="payment_method"]').val();
                paymentMethodAvailable = true;
            }
            
            // If payment options exist but none selected
            if (!selectedPayment && $('.wc_payment_methods li').length > 0) {
                validationPassed = false;
                missingFields.push('Payment method');
            }
            
            if (selectedPayment) {
                customerData.payment_method = selectedPayment;
            } else if (!paymentMethodAvailable) {
                // Try to get default payment method from WooCommerce
                if (typeof wc_checkout_params !== 'undefined' && wc_checkout_params.chosen_payment_method) {
                    customerData.payment_method = wc_checkout_params.chosen_payment_method;
                }
            }
            
            // Customer note (optional)
            var customerNote = $('#order_comments').val();
            if (customerNote) {
                customerData.note = customerNote;
            }
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
                            validationPassed = false;
                            
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
                            validationPassed = false;
                            
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
                    // No customer details available
                    validationPassed = false;
                    errorMessage = 'Please fill in your billing and shipping information before checkout.';
                }
                
                // Check if shipping is needed
                var needsShipping = true;
                if (wc_checkout_params.cart_has_virtual_products_only === true) {
                    needsShipping = false;
                }
                
                // Try to get shipping method from WooCommerce
                if (needsShipping && wc_checkout_params.chosen_shipping_methods) {
                    customerData.shipping_method = wc_checkout_params.chosen_shipping_methods[0] || '';
                    
                    // Only validate shipping method if shipping is needed
                    if (!customerData.shipping_method) {
                        validationPassed = false;
                        missingFields.push('Shipping method');
                    }
                }
            } else {
                // WooCommerce checkout params not available
                validationPassed = false;
                errorMessage = 'Please complete the checkout form before proceeding.';
            }
            
            // Try to get payment method from WooCommerce
            if (typeof wc_checkout_params !== 'undefined') {
                // Check if payment is needed (some stores might have free orders)
                var needsPayment = true;
                
                // Check if order total is zero
                if (wc_checkout_params.order_total === '0') {
                    needsPayment = false;
                }
                
                if (needsPayment) {
                    if (wc_checkout_params.chosen_payment_method) {
                        customerData.payment_method = wc_checkout_params.chosen_payment_method;
                    } else {
                        // Check if there's only one payment method available
                        if (typeof wc_checkout_params.available_payment_methods === 'object') {
                            var availableMethodsCount = Object.keys(wc_checkout_params.available_payment_methods).length;
                            if (availableMethodsCount === 1) {
                                // Use the only available payment method
                                customerData.payment_method = Object.keys(wc_checkout_params.available_payment_methods)[0];
                            } else if (availableMethodsCount > 1) {
                                validationPassed = false;
                                missingFields.push('Payment method');
                            }
                        } else {
                            validationPassed = false;
                            missingFields.push('Payment method');
                        }
                    }
                } else {
                    // No payment needed, set a placeholder
                    customerData.payment_method = 'none';
                }
            } else {
                // Only add payment method error if we can't determine payment methods
                validationPassed = false;
                missingFields.push('Payment method');
            }
        }
        
        // If we have missing fields, create a detailed error message
        if (missingFields.length > 0) {
            errorMessage = 'Please fill in the following required fields before checkout:\n• ' + missingFields.join('\n• ');
        }
        
        console.log('Validation passed:', validationPassed);
        if (!validationPassed) {
            console.log('Missing fields:', missingFields);
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