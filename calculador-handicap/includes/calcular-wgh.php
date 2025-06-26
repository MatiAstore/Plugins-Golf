<?php 
defined('ABSPATH') || exit;

function calcular_wgh() {
    global $wpdb;

    // Validar club_id y usuario
    $club_id = isset($_POST['club_id']) ? intval($_POST['club_id']) : 0;
    $user_id = get_current_user_id();

    if (!$club_id || !$user_id) {
        wp_send_json_error(array('message' => 'Datos inválidos o usuario no autenticado.'));
    }

    // Obtener los datos del club
    $club = $wpdb->get_row($wpdb->prepare("SELECT * FROM wp_clubs WHERE id = %d", $club_id));

    if (!$club) {
        wp_send_json_error(array('message' => 'Club no encontrado.'));
    }

    // Obtener los promedios del usuario
    $tabla_promedios = $wpdb->prefix . 'users_promedio';
    $promedio_wgh = $wpdb->get_var($wpdb->prepare("SELECT promedio_desempeño FROM $tabla_promedios WHERE user_id = %d", $user_id));
    $promedio_length = $wpdb->get_var($wpdb->prepare("SELECT promedio_length FROM $tabla_promedios WHERE user_id = %d", $user_id));

    if (!$promedio_wgh || !$promedio_length) {
        wp_send_json_error(array('message' => 'No se encontraron los promedios del usuario.'));
    }

    // Calcular el WGH de juego
    $longitud_campo = $club->length;
    $rating_campo = $club->course_rating;
    $par_campo = $club->par;

    $wgh_juego = ($promedio_wgh * ($longitud_campo / $promedio_length)) + ($rating_campo - $par_campo);

    // Enviar respuesta exitosa
    wp_send_json_success(array('wgh' => round($wgh_juego)));
}
add_action('wp_ajax_calcular_wgh', 'calcular_wgh');
add_action('wp_ajax_nopriv_calcular_wgh', 'calcular_wgh');


