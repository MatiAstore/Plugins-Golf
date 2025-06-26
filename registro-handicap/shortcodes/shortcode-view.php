<?php
defined('ABSPATH') || exit; 

require_once plugin_dir_path(__FILE__) . '../includes/get-user-data.php';

function cargar_scripts_view(){
    if(is_singular() && has_shortcode(get_post()->post_content, 'view_user_data')){
        wp_enqueue_style('view-user-data-css', plugin_dir_url(__FILE__) . '../assets/css/view-user-data.css', array(), null, 'all');
        wp_enqueue_script('view-user-data-js', plugin_dir_url(__FILE__) . '../assets/js/view-user-data.js', array('jquery'), null, true);

        
        wp_localize_script('view-user-data-js', 'ajaxView', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
        )); 
    }
}
add_action('wp_enqueue_scripts', 'cargar_scripts_view'); 

function view_user_data(){
    ob_start(); ?>

    <div class="shortcode-view">
        <p>Tu World Golf Handicap: <span class="view-span" id="promedio-partidas">Calculando...</span></p>
        <p>Rondas: <span class="view-span" id="total-rondas">Calculando...</span></p>
        <p>Campos de Golf: <span class="view-span" id="campos">Calculando...</span></p>
        <p>Promedio Yardas: <span class="view-span" id="promedio-yardas">Calculando...</span></p>
    </div>

    <?php 
    return ob_get_clean();
}
add_shortcode('view_user_data', 'view_user_data'); 