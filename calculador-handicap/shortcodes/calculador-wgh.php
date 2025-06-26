<?php 
defined('ABSPATH') || exit; 

require_once plugin_dir_path(__FILE__) . '../includes/calculador-buscar-clubes.php';
require_once plugin_dir_path(__FILE__) . '../includes/calcular-wgh.php';

// Cargar el JavaScript y CSS del plugin solo si el shortcode está presente
function cargar_scripts_wgh() {
    if (is_singular() && has_shortcode(get_post()->post_content, 'formulario_wgh')) {
        
        wp_enqueue_script('wgh-js', plugin_dir_url(__FILE__) . '../assets/js/wgh.js', array('jquery'), null, true);
        wp_enqueue_style('handip-css', plugin_dir_url(__FILE__) . '../assets/css/handip.css', array(), null, 'all');

        wp_localize_script('wgh-js', 'ajaxWGH', array(
            'ajaxurl' => admin_url('admin-ajax.php')
        ));
    }
}
add_action('wp_enqueue_scripts', 'cargar_scripts_wgh');

// Shortcode para mostrar el formulario
function mi_plugin_formulario_wgh() {
    ob_start();
    ?>        
    <div class="shortcode-wgh" id="shortcode-wgh">
        
        <!-- Sección: Clubes Habituales -->
        <div id="clubes-habituales" style="display: none;"></div>

        <input type="text" id="nombre_club" placeholder="Buscar club">

        <div id="resultados_clubes"></div>

        <div id="club-info-seleccionado" style="display:none;">
            <p><span class="label-bold">Club:</span> <span id="club-nombre" class="club-data-info"></span></p>
            <p><span class="label-bold">Ciudad:</span> <span id="club-ciudad" class="club-data-info"></span></p>
        </div>
     
        <div id="tee-seleccionado" style="display: none;">
            <label for="tee_select">Seleccionar Tee:</label>
            <select id="tee_select" name="tee_select" required>
            </select>
        </div>

        <div id="contenedor-seleccion-y-formulario" style="display: none;">
            <div id="club-seleccionado"></div>

            <form id="form-calcular-wgh">
                <input type="hidden" id="club_id">
                <button type="submit">Calcular WGH de Juego</button>
            </form>
            
            <div id="resultado_wgh"></div>
        </div>
    </div>  
    <?php
    return ob_get_clean();
}
add_shortcode('formulario_wgh', 'mi_plugin_formulario_wgh');
