<?php
/**
 * Plugin Name: WhatsApp Checkout Block
 * Description: Adds a WhatsApp Checkout button block to the WooCommerce Cart page.
 * Version: 1.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) exit;

function wa_register_block() {
    // Enqueue block editor assets
    wp_register_script(
        'whatsapp-checkout-block-editor',
        plugins_url('build/index.js', __FILE__),
        ['wp-blocks', 'wp-element', 'wp-editor'],
        filemtime(plugin_dir_path(__FILE__) . 'build/index.js')
    );

    // Pass WA number from settings to JS
    $wa_number = get_option('wa_checkout_number', '');
    wp_localize_script('whatsapp-checkout-block-editor', 'waCheckoutData', [
        'number' => $wa_number,
    ]);

    register_block_type(__DIR__, [
        'editor_script' => 'whatsapp-checkout-block-editor',
    ]);
}
add_action('init', 'wa_register_block');

// Add WooCommerce settings
add_filter('woocommerce_get_settings_pages', function ($settings) {
    require_once __DIR__ . '/wa-settings.php';
    $settings[] = new WA_Checkout_Settings();
    return $settings;
});
?>