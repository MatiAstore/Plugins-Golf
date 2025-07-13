<?php 
defined('ABSPATH') || exit; 

require_once plugin_dir_path(__FILE__) . '../includes/registro-buscar-clubes.php';
require_once plugin_dir_path(__FILE__) . '../includes/registrar-partida.php';

function cargar_scripts_registro_partida() {
    if (is_singular() && has_shortcode(get_post()->post_content, 'registro_partida')) {
        wp_enqueue_style('registro_handicaap_css', plugin_dir_url(__FILE__) . '../assets/css/registro-handicaap.css');

        wp_enqueue_script('flatpickr', 'https://cdn.jsdelivr.net/npm/flatpickr', array(), null, true);
        wp_enqueue_style('flatpickr-css', 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css');
        wp_enqueue_script('flatpickr-locale-es', 'https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/es.js', array('flatpickr'), null, true);

        wp_enqueue_script(
            'buscar_club_partida_js',
            plugin_dir_url(__FILE__) . '../assets/js/buscar_club_partida.js',
            array('jquery'),
            null,
            true
        );

        wp_enqueue_script(
            'registro_partida_js',
            plugin_dir_url(__FILE__) . '../assets/js/registro_partida.js',
            array('jquery', 'flatpickr', 'buscar_club_partida_js'),
            null,
            true
        );

        wp_localize_script('registro_partida_js', 'registroPartida', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
        ));
    }
}
add_action('wp_enqueue_scripts', 'cargar_scripts_registro_partida');

function formulario_partida() {
    ob_start();
    ?>
    <div class="shortcode-registro" id="shortcode-registro">
        <!-- Sección: Clubes Habituales -->
        <div id="clubes-habituales" style="display: none;"></div>

        <!-- Busqueda -->
        <label for="nombre_club">Seleccionar club:</label>
        <input type="text" id="nombre_club" name="nombre_club" placeholder="Buscar club" required>
        
        <!-- Sección: Resultados busqueda -->
        <div id="resultados_clubes"></div>
        
        <!-- Sección: Club seleccionado -->
        <div id="club-info-seleccionado" style="display:none;">
            <p><span class="label-bold">Club:</span> <span id="club-nombre" class="club-data-info"></span></p>
            <p><span class="label-bold">Ciudad:</span> <span id="club-ciudad" class="club-data-info"></span></p>
        </div>

        <!-- Sección: Elegir Tee del club -->
        <div id="tee-seleccionado" style="display: none;">
            <p>Selecciona tu Tee:</p>    
            <form id="form-seleccion-tee">
                
            </form>
        </div>


        <!-- Sección: Formulario de datos y club elegido -->
        <div id="contenedor-seleccion-y-formulario" style="display: none;">    
            <div id="club-seleccionado" class="margin-top: 10px;"></div>

            <form id="form_partida" method="POST">
                <input type="hidden" id="club_id" name="club_id" value="">
                            
                <label for="golpes_totales">Score Gross:</label>
                <input type="number" id="golpes_totales" name="golpes_totales" placeholder="Score Gross" min="1">
                
                <label for="fecha_juego">Fecha:</label>
                <input type="text" id="fecha_juego_fecha" name="fecha_juego_fecha" placeholder="Fecha">

                <label for="hora_juego">Hora:</label>
                <input type="text" id="fecha_juego_hora" name="fecha_juego_hora" placeholder="Hora">

                <button type="submit" id="submit_partida">Registrar Ronda</button>
            </form>
        </div>
        
        <!-- Sección: Respuestas del servidor-->
        <div id="resultado" class="margin-top: 10px;"></div>    
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode("registro_partida", "formulario_partida");  
