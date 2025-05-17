/**
 * Frontend JavaScript for WhatsApp Checkout Button
 */
jQuery(document).ready(function($) {
    console.log('WhatsApp Checkout script loaded');
    
    // Handle WhatsApp checkout button click
    $(document).on('click', '.wp-block-wa-checkout-button', function(e) {
        console.log('WhatsApp button clicked');
        // Prevent default action temporarily
        e.preventDefault();
        
        var $button = $(this);
        var waLink = $button.attr('href');
        var waMessage = $button.data('wa-message');
        
        console.log('Sending AJAX request to save order');
        
        // Save order via AJAX
        $.ajax({
            url: waCheckoutFrontend.ajaxUrl,
            type: 'POST',
            data: {
                action: 'wa_save_order',
                nonce: waCheckoutFrontend.nonce,
                message: waMessage
            },
            success: function(response) {
                if (response.success) {
                    console.log('Order saved successfully, ID: ' + response.data.order_id);
                } else {
                    console.error('Failed to save order:', response.data);
                }
                
                // Continue with WhatsApp redirect
                window.open(waLink, '_blank');
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', error);
                
                // Continue with WhatsApp redirect even if saving failed
                window.open(waLink, '_blank');
            }
        });
    });
});