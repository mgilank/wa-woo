import { registerBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

registerBlockType('wa/checkout-button', {
    title: 'WhatsApp Checkout Button',
    icon: 'whatsapp',
    category: 'woocommerce',
    
    // Tambahkan atribut untuk menyimpan properti blok
    attributes: {
        align: {
            type: 'string',
            default: 'none',
        },
    },
    
    // Editor representation
    edit: (props) => {
        const { attributes, setAttributes } = props;
        const blockProps = useBlockProps();
        
        const phone = typeof waCheckoutData !== 'undefined' ? waCheckoutData.number : '6281234567890';
        const message = encodeURIComponent('Halo, saya ingin checkout dengan keranjang saya.');
        const link = `https://wa.me/${phone}?text=${message}`;

        return (
            <div {...blockProps}>
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