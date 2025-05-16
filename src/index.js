import { registerBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';

registerBlockType('wa/checkout-button', {
    title: 'WhatsApp Checkout Button',
    icon: 'whatsapp',
    category: 'woocommerce',
    edit: () => {
        const phone = typeof waCheckoutData !== 'undefined' ? waCheckoutData.number : '6281234567890';
        const message = encodeURIComponent('Halo, saya ingin checkout dengan keranjang saya.');
        const link = `https://wa.me/${phone}?text=${message}`;

        return (
            <a href={link} target="_blank" rel="noopener noreferrer">
                <Button variant="primary">Checkout via WhatsApp</Button>
            </a>
        );
    },
    save: () => null // dynamic rendering
});