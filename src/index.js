import { registerBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

registerBlockType('wa/checkout-button', {
    title: 'WhatsApp Checkout Button',
    icon: 'whatsapp',
    category: 'woocommerce',
    
    // Editor representation
    edit: () => {
        const phone = typeof waCheckoutData !== 'undefined' ? waCheckoutData.number : '6281234567890';
        const message = encodeURIComponent('Halo, saya ingin checkout dengan keranjang saya.');
        const link = `https://wa.me/${phone}?text=${message}`;

        return (
            <div className="wp-block-wa-checkout-button">
                <Button 
                    variant="primary"
                    className="wa-checkout-button"
                >
                    {__('Checkout via WhatsApp', 'wa-checkout')}
                </Button>
                <p className="description">
                    {__('This button will link to WhatsApp in the frontend', 'wa-checkout')}
                </p>
            </div>
        );
    },
    
    // We're using server-side rendering, so return null
    save: () => null
});