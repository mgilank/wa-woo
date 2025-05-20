<?php
/**
 * Plugin Name: WhatsApp Checkout Block
 * Description: Adds a WhatsApp Checkout button block to the WooCommerce Cart page.
 * Version: 1.0
 * Author: Gilang
 */

if (!defined('ABSPATH')) exit;

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

    if (!function_exists('WC') || !WC()->cart) {
        wp_send_json_error('WooCommerce cart not available');
        exit;
    }

    // Get customer data from POST
    $customer_data = isset($_POST['customer']) ? $_POST['customer'] : [];
    $billing = isset($customer_data['billing']) ? $customer_data['billing'] : [];
    $shipping = isset($customer_data['shipping']) ? $customer_data['shipping'] : [];
    $shipping_method = isset($customer_data['shipping_method']) ? sanitize_text_field($customer_data['shipping_method']) : '';
    $payment_method = isset($customer_data['payment_method']) ? sanitize_text_field($customer_data['payment_method']) : '';
    $customer_note = isset($customer_data['note']) ? sanitize_textarea_field($customer_data['note']) : '';

    // Debug: Log cart contents and customer data
    error_log('Cart contents: ' . print_r(WC()->cart->get_cart(), true));
    error_log('Customer data: ' . print_r($customer_data, true));

    try {
        // Create a new order
        $order = wc_create_order();
        
        // Set customer ID if user is logged in
        if (is_user_logged_in()) {
            $current_user_id = get_current_user_id();
            $order->set_customer_id($current_user_id);
        }
        
        // Get customer data from WooCommerce session if available
        $customer = WC()->customer;
        
        // Set billing address - first try from POST data, then from WC customer session
        if (!empty($billing)) {
            // Use data from AJAX request
            $order->set_billing_first_name(isset($billing['first_name']) ? $billing['first_name'] : '');
            $order->set_billing_last_name(isset($billing['last_name']) ? $billing['last_name'] : '');
            $order->set_billing_company(isset($billing['company']) ? $billing['company'] : '');
            $order->set_billing_address_1(isset($billing['address_1']) ? $billing['address_1'] : '');
            $order->set_billing_address_2(isset($billing['address_2']) ? $billing['address_2'] : '');
            $order->set_billing_city(isset($billing['city']) ? $billing['city'] : '');
            $order->set_billing_state(isset($billing['state']) ? $billing['state'] : '');
            $order->set_billing_postcode(isset($billing['postcode']) ? $billing['postcode'] : '');
            $order->set_billing_country(isset($billing['country']) ? $billing['country'] : '');
            $order->set_billing_email(isset($billing['email']) ? $billing['email'] : '');
            $order->set_billing_phone(isset($billing['phone']) ? $billing['phone'] : '');
        } elseif ($customer) {
            // Use data from WooCommerce customer session
            $order->set_billing_first_name($customer->get_billing_first_name());
            $order->set_billing_last_name($customer->get_billing_last_name());
            $order->set_billing_company($customer->get_billing_company());
            $order->set_billing_address_1($customer->get_billing_address_1());
            $order->set_billing_address_2($customer->get_billing_address_2());
            $order->set_billing_city($customer->get_billing_city());
            $order->set_billing_state($customer->get_billing_state());
            $order->set_billing_postcode($customer->get_billing_postcode());
            $order->set_billing_country($customer->get_billing_country());
            $order->set_billing_email($customer->get_billing_email());
            $order->set_billing_phone($customer->get_billing_phone());
        }
        
        // Set shipping address - first try from POST data, then from WC customer session
        if (!empty($shipping)) {
            // Use data from AJAX request
            $order->set_shipping_first_name(isset($shipping['first_name']) ? $shipping['first_name'] : '');
            $order->set_shipping_last_name(isset($shipping['last_name']) ? $shipping['last_name'] : '');
            $order->set_shipping_company(isset($shipping['company']) ? $shipping['company'] : '');
            $order->set_shipping_address_1(isset($shipping['address_1']) ? $shipping['address_1'] : '');
            $order->set_shipping_address_2(isset($shipping['address_2']) ? $shipping['address_2'] : '');
            $order->set_shipping_city(isset($shipping['city']) ? $shipping['city'] : '');
            $order->set_shipping_state(isset($shipping['state']) ? $shipping['state'] : '');
            $order->set_shipping_postcode(isset($shipping['postcode']) ? $shipping['postcode'] : '');
            $order->set_shipping_country(isset($shipping['country']) ? $shipping['country'] : '');
        } elseif ($customer) {
            // Use data from WooCommerce customer session
            $order->set_shipping_first_name($customer->get_shipping_first_name());
            $order->set_shipping_last_name($customer->get_shipping_last_name());
            $order->set_shipping_company($customer->get_shipping_company());
            $order->set_shipping_address_1($customer->get_shipping_address_1());
            $order->set_shipping_address_2($customer->get_shipping_address_2());
            $order->set_shipping_city($customer->get_shipping_city());
            $order->set_shipping_state($customer->get_shipping_state());
            $order->set_shipping_postcode($customer->get_shipping_postcode());
            $order->set_shipping_country($customer->get_shipping_country());
        }
        
        // Set customer note
        if (!empty($customer_note)) {
            $order->set_customer_note($customer_note);
        }
        
        // Add items from cart to order
        $cart_items = WC()->cart->get_cart();
        
        if (empty($cart_items)) {
            wp_send_json_error('Cart is empty');
            exit;
        }
        
        foreach ($cart_items as $cart_item_key => $cart_item) {
            // Get the product
            $product = $cart_item['data'];
            $product_id = $product->get_id();
            
            // Get quantity
            $quantity = $cart_item['quantity'];
            
            // Get variation ID if any
            $variation_id = !empty($cart_item['variation_id']) ? $cart_item['variation_id'] : 0;
            
            // Get variation data if any
            $variation = !empty($cart_item['variation']) ? $cart_item['variation'] : array();
            
            // Add the product to the order
            $item_id = $order->add_product(
                $product,
                $quantity,
                array(
                    'variation' => $variation,
                    'totals' => array(
                        'subtotal' => $cart_item['line_subtotal'],
                        'subtotal_tax' => $cart_item['line_subtotal_tax'],
                        'total' => $cart_item['line_total'],
                        'tax' => $cart_item['line_tax'],
                        'tax_data' => $cart_item['line_tax_data']
                    )
                )
            );
            
            if (!$item_id) {
                error_log('Failed to add product ' . $product_id . ' to order');
            }
        }
        
        // Set shipping method
        if (!empty($shipping_method)) {
            // Add shipping line
            $shipping_item = new WC_Order_Item_Shipping();
            $shipping_item->set_method_title($shipping_method);
            $shipping_item->set_method_id($shipping_method);
            $shipping_item->set_total(WC()->cart->get_shipping_total());
            $order->add_item($shipping_item);
        } else {
            // Try to get chosen shipping methods from session
            $chosen_shipping_methods = WC()->session->get('chosen_shipping_methods');
            if (!empty($chosen_shipping_methods)) {
                $shipping_method_id = reset($chosen_shipping_methods);
                
                // Get shipping packages
                $packages = WC()->shipping->get_packages();
                if (!empty($packages)) {
                    foreach ($packages as $package_key => $package) {
                        if (!empty($package['rates'][$shipping_method_id])) {
                            $rate = $package['rates'][$shipping_method_id];
                            
                            $shipping_item = new WC_Order_Item_Shipping();
                            $shipping_item->set_method_title($rate->get_label());
                            $shipping_item->set_method_id($rate->get_id());
                            $shipping_item->set_total($rate->get_cost());
                            $shipping_item->set_taxes($rate->get_taxes());
                            $order->add_item($shipping_item);
                            
                            break;
                        }
                    }
                }
            }
        }
        
        // Set payment method if provided
        if (!empty($payment_method)) {
            $order->set_payment_method($payment_method);
            $order->set_payment_method_title($payment_method);
        } else {
            // Try to get chosen payment method from session
            $chosen_payment_method = WC()->session->get('chosen_payment_method');
            if (!empty($chosen_payment_method)) {
                $order->set_payment_method($chosen_payment_method);
                
                // Get payment method title
                $available_gateways = WC()->payment_gateways->get_available_payment_gateways();
                if (isset($available_gateways[$chosen_payment_method])) {
                    $order->set_payment_method_title($available_gateways[$chosen_payment_method]->get_title());
                } else {
                    $order->set_payment_method_title($chosen_payment_method);
                }
            }
        }
        
        // Calculate and set order totals
        $order->calculate_totals();
        
        // Set order status to pending
        $order->update_status('pending', 'Order created via WhatsApp Checkout');
        
        // Save order
        $order->save();
        
        // Get the order ID
        $order_id = $order->get_id();
        
        // Debug: Log order ID
        error_log('Created order ID: ' . $order_id);
        
        wp_send_json_success(array('order_id' => $order_id));
    } catch (Exception $e) {
        error_log('Error creating order: ' . $e->getMessage());
        wp_send_json_error('Failed to create order: ' . $e->getMessage());
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
    return '<button style="padding:1em; width:250px; background:#0b9872; border:0px; border-radius:5px; color:#fff;" type="button" class="wp-block-wa-checkout-button" data-wa-message="' . htmlspecialchars($message) . '" data-wa-link="' . htmlspecialchars($link) . '" data-wa-save-order="true">
        Checkout via WhatsApp
    </button>';
}



// Add WooCommerce settings
add_filter('woocommerce_get_settings_pages', function ($settings) {
    require_once __DIR__ . '/wa-settings.php';
    $settings[] = new WA_Checkout_Settings();
    return $settings;
});
?>

