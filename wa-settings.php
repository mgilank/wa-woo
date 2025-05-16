<?php
if (!defined('ABSPATH')) exit;

class WA_Checkout_Settings extends WC_Settings_Page {
    public function __construct() {
        $this->id    = 'wa_checkout';
        $this->label = __('WA Checkout', 'wa-checkout');
        parent::__construct();
    }

    public function get_settings() {
        return array(
            array(
                'title' => __('WhatsApp Settings', 'wa-checkout'),
                'type'  => 'title',
                'desc'  => 'Nomor WhatsApp untuk menerima order',
                'id'    => 'wa_checkout_section_title'
            ),
            array(
                'title'    => __('Nomor WhatsApp'),
                'desc'     => 'Contoh: 6281234567890',
                'id'       => 'wa_checkout_number',
                'type'     => 'text',
                'default'  => '',
                'desc_tip' => true,
            ),
            array(
                'type' => 'sectionend',
                'id'   => 'wa_checkout_section_title'
            ),
        );
    }
}
?>