<?php
/**
 * Plugin Name: WhatsApp Checkout Block
 * Description: Adds a WhatsApp Checkout button block to the WooCommerce Cart page.
 * Version: 1.0
 * Author: Gilang
 */

if (!defined('ABSPATH')) exit;

// Register custom post type for WhatsApp orders
function wa_register_order_post_type() {
    register_post_type('wa_order', [
        'labels' => [
            'name' => 'WhatsApp Orders',
            'singular_name' => 'WhatsApp Order',
        ],
        'public' => true,
        'has_archive' => true,
        'menu_icon' => 'dashicons-whatsapp',
        'supports' => ['title', 'editor', 'custom-fields'],
        'menu_position' => 30,
        'show_in_rest' => true,
    ]);
}
add_action('init', 'wa_register_order_post_type');

function wa_register_block() {
    // Enqueue block editor assets
    wp_register_script(
        'whatsapp-checkout-block-editor',
        plugins_url('build/index.js', __FILE__),
        ['wp-blocks', 'wp-element', 'wp-components', 'wp-i18n'],
        filemtime(plugin_dir_path(__FILE__) . 'build/index.js')
    );

    // Pass WA number from settings to JS
    $wa_number = get_option('wa_checkout_number', '');
    wp_localize_script('whatsapp-checkout-block-editor', 'waCheckoutData', [
        'number' => $wa_number,
    ]);

    // Register the block using the block.json file
    register_block_type(__DIR__, [
        'editor_script' => 'whatsapp-checkout-block-editor',
        'render_callback' => 'wa_render_checkout_button',
    ]);
    
    // Register frontend script for AJAX
    wp_register_script(
        'whatsapp-checkout-frontend',
        plugins_url('build/frontend.js', __FILE__),
        ['jquery'],
        filemtime(plugin_dir_path(__FILE__) . 'build/frontend.js'),
        true
    );
    
    // Add AJAX URL and nonce to the script
    wp_localize_script('whatsapp-checkout-frontend', 'waCheckoutFrontend', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('wa_checkout_nonce'),
    ]);
}
add_action('init', 'wa_register_block');

// Enqueue frontend script on the frontend
function wa_enqueue_frontend_scripts() {
    if (!is_admin()) {
        wp_enqueue_script('whatsapp-checkout-frontend');
    }
}
add_action('wp_enqueue_scripts', 'wa_enqueue_frontend_scripts');

// AJAX handler to save order
function wa_save_order() {
    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'wa_checkout_nonce')) {
        wp_send_json_error('Invalid nonce');
        exit;
    }
    
    // Check if WC()->cart is available
    if (!function_exists('WC') || !WC()->cart) {
        wp_send_json_error('WooCommerce cart not available');
        exit;
    }
    
    // Get cart data
    $cart_items = WC()->cart->get_cart();
    $cart_total = WC()->cart->get_cart_total();
    
    // Create order post
    $order_id = wp_insert_post([
        'post_title' => 'WhatsApp Order - ' . date('Y-m-d H:i:s'),
        'post_type' => 'wa_order',
        'post_status' => 'publish',
        'post_content' => isset($_POST['message']) ? sanitize_textarea_field($_POST['message']) : '',
    ]);
    
    if ($order_id) {
        // Save cart items as meta
        $items_data = [];
        foreach ($cart_items as $cart_item) {
            $product = $cart_item['data'];
            $items_data[] = [
                'name' => $product->get_name(),
                'quantity' => $cart_item['quantity'],
                'price' => $product->get_price(),
                'subtotal' => WC()->cart->get_product_subtotal($product, $cart_item['quantity']),
            ];
        }
        
        update_post_meta($order_id, '_wa_order_items', $items_data);
        update_post_meta($order_id, '_wa_order_total', $cart_total);
        update_post_meta($order_id, '_wa_order_status', 'pending');
        
        wp_send_json_success(['order_id' => $order_id]);
    } else {
        wp_send_json_error('Failed to create order');
    }
    
    exit;
}
add_action('wp_ajax_wa_save_order', 'wa_save_order');
add_action('wp_ajax_nopriv_wa_save_order', 'wa_save_order');

// Render function for the block on the frontend
function wa_render_checkout_button($attributes, $content) {
    $phone = get_option('wa_checkout_number', '');
    
    // Format pesan sesuai permintaan
    $message_parts = ["Halo Admin, saya ingin memesan: \n\n"];
    $message_parts[] = "Nama: \n";
    $message_parts[] = "Email: \n";
    $message_parts[] = "Produk item: \n";
    
    // Check if WC()->cart is available before using it
    if (function_exists('WC') && WC()->cart) {
        $cart_items = WC()->cart->get_cart();
        
        if (!empty($cart_items)) {
            foreach ($cart_items as $cart_item) {
                $product = $cart_item['data'];
                $quantity = $cart_item['quantity'];
                $price = wp_strip_all_tags(WC()->cart->get_product_subtotal($product, $quantity));
                
                $message_parts[] = "- " . $product->get_name() . " (x" . $quantity . ") " . $price . "\n";
            }
            
            // Add cart total
            $cart_total = wp_strip_all_tags(WC()->cart->get_cart_total());
            $message_parts[] = "\nTotal: " . $cart_total . "\n\n";
        } else {
            $message_parts[] = "Keranjang kosong\n\n";
        }
    } else {
        // If cart is not available
        $message_parts[] = "Keranjang belum tersedia\n\n";
    }
    
    $message_parts[] = "Alamat: \n\n\n";
    $message_parts[] = "Metode Pembayaran: ";
    
    $message = rawurlencode(implode('', $message_parts));
    $link = "https://wa.me/{$phone}?text={$message}";
    
    // Add data attributes for JavaScript
    return '<a href="' . htmlspecialchars($link) . '" target="_blank" rel="noopener noreferrer" class="wp-block-wa-checkout-button" data-wa-message="' . htmlspecialchars($message) . '" data-wa-save-order="true">
        <button class="wp-element-button">Checkout via WhatsApp</button>
    </a>';
}

// Add WooCommerce settings
add_filter('woocommerce_get_settings_pages', function ($settings) {
    require_once __DIR__ . '/wa-settings.php';
    $settings[] = new WA_Checkout_Settings();
    return $settings;
});
?>