<?php 
defined('ABSPATH') || exit; 

// Incluir el archivo PHP que maneja la lógica para obtener partidas
require_once plugin_dir_path(__FILE__) . '../includes/funciones-historial.php';

function cargar_scripts_historial_partida() {
    // Verificar si estamos en una página con el shortcode del historial de partidas
    if (is_singular() && has_shortcode(get_post()->post_content, 'historial_partidas')) {
        // Encolar el CSS para el historial de partidas con una alta prioridad
        wp_enqueue_style('historial-partidas-css', plugin_dir_url(__FILE__) . '../assets/css/historial-partidas.css', array(), null, 'all');

        // Encolar el script del historial de par tidas
        wp_enqueue_script('historial-partidas-js', plugin_dir_url(__FILE__) . '../assets/js/historial_partidas.js', array('jquery'), null, true);

        // Pasar la URL de admin-ajax.php a JavaScript
        wp_localize_script('historial-partidas-js', 'ajaxHistorial', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
        ));
    }
}
add_action('wp_enqueue_scripts', 'cargar_scripts_historial_partida', 10); 

function historial_partidas() {
    ob_start(); ?>

    <div class="shortcode-historial">
            <div class="contenedor-promedios">
                <p>Tu World Golf Handicap es: <span id="promedio-partidas" class="promedio">Calculando...</span></p>
                <p>Promedio Yardas: <span id="promedio-yardas" class="promedio">Calculando...</span></p>
            </div>
            
            <div id="mensaje-eliminacion" class="mensaje" style="display: none;"></div>

            <div class="contenedor-tabla">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Club</th>
                            <th>Tee</th>
                            <th>Género</th>
                            <th>Par</th>
                            <!-- <th>Sratch Rating</th> --> 
                            <th>Yardas</th>
                            <th>Golpes Totales</th>
                            <th>Gross</th>
                            <th>Desempeño Objetivo</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-partidas">
                        <tr><td colspan="9"Cargando partidas...</td></tr>
                    </tbody>
                </table>
                
            </div>

            <div id="tarjetas-partidas" class="contenedor-tarjetas">
                <p class="mensaje-cargando">Cargando partidas...</p>
            </div>

            <button id="boton-cargar-mas" class="btn-cargar-mas" style="display: none;">Cargar más</button>
    </div>

    <?php
    return ob_get_clean();
}
add_shortcode('historial_partidas', 'historial_partidas');