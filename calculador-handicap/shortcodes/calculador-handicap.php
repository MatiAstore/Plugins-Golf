<?php
defined('ABSPATH') || exit;

require_once plugin_dir_path(__FILE__) . '../includes/calculador-buscar-clubes.php';
require_once plugin_dir_path(__FILE__) . '../includes/calcular-handicap.php';

// Cargar el JavaScript y CSS del plugin solo si el shortcode está presente
function cargar_scripts_calcular() {
    if (is_singular() && has_shortcode(get_post()->post_content, 'formulario_handicap')) {
        wp_enqueue_script('handicap-js', plugin_dir_url(__FILE__) . '../assets/js/handicap.js', array('jquery'), null, true);
        wp_enqueue_style('handip-css', plugin_dir_url(__FILE__) . '../assets/css/handip.css', array(), null, 'all');
        wp_localize_script('handicap-js', 'ajaxHandicap', array(
            'ajaxurl' => admin_url('admin-ajax.php')
        ));
    }
}
add_action('wp_enqueue_scripts', 'cargar_scripts_calcular');

// Shortcode para mostrar el formulario
function mi_plugin_formulario_handicap() {
    ob_start();
    ?>        
    <div class="shortcode-handicap" id="shortcode-handicap">
        
        <!-- Sección: Clubes Habituales -->
        <div id="clubes-habituales" style="display: none;"></div>

        <!-- Busqueda -->
        <input type="text" id="nombre_club" placeholder="Buscar club">

        <!-- Resultado busqueda -->
        <div id="resultados_clubes"></div>

        <!-- Informaicon club elegido -->
        <div id="club-info-seleccionado" style="display:none;">
            <p><span class="label-bold">Club:</span> <span id="club-nombre" class="club-data-info"></span></p>
            <p><span class="label-bold">Ciudad:</span> <span id="club-ciudad" class="club-data-info"></span></p>
        </div>

        <!-- Tees del club elegido -->
        <div id="tee-seleccionado" style="display: none;">
            <p>Selecciona tu Tee:</p>    
            <form id="form-seleccion-tee">
                <!-- contenido de los tees. dinamoco --> 
            </form>
        </div>

        <!-- Contenedor club elegido con su tee y formalurio -->
        <div id="contenedor-seleccion-y-formulario" style="display: none;">
            <div id="club-seleccionado"></div>

            <form id="form-calcular-handicap">
                <input type="hidden" id="club_id">
                <input type="number" id="index_jugador" placeholder="Índice del jugador" step="any" required>
                <button type="submit">Calcular Handicap</button>
            </form>
            
            <div id="resultado_handicap"></div>
        </div>
    </div>  
    <?php
    return ob_get_clean();
}
add_shortcode('formulario_handicap', 'mi_plugin_formulario_handicap');
