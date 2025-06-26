<?php 
defined('ABSPATH') || exit;

function registrar_partida() {
    if (!is_user_logged_in()) {
        wp_send_json_error(['error' => 'Debes iniciar sesión para registrar una partida.']); 
    }

    global $wpdb;
    $user_id = get_current_user_id(); 

    if (!$user_id) {
        wp_send_json_error(['error' => 'Error al obtener el ID de usuario.']);
    }

    // Recibir y validar los datos de la petición AJAX
    $club_id = isset($_POST["club_id"]) ? intval($_POST['club_id']) : 0; 
    $golpes_totales = isset($_POST["golpes_totales"]) ? intval($_POST["golpes_totales"]) : 0; 
    $fecha_juego = isset($_POST['fecha_juego']) ? sanitize_text_field($_POST['fecha_juego']) : '';

    if (!$club_id || !$golpes_totales || !strtotime($fecha_juego)) {
        wp_send_json_error(['error' => "Faltan datos obligatorios: Club, Golpes Totales y/o Fecha inválida."]);
    }

    // Tomar datos del club elegido 
    $club = $wpdb->get_row($wpdb->prepare(
        "SELECT id, par, course_rating, length FROM {$wpdb->prefix}clubs WHERE id = %d", 
        $club_id
    ));

    if (!$club) {
        wp_send_json_error(['error' => 'No se ha encontrado el club proporcionado.']);
    }

    // Calcular desempeño y total neto
    $desempeño_objetivo = round($golpes_totales - $club->course_rating, 2);
    $total_neto = $golpes_totales - $club->par;

    // Guardar registro en base de datos
    $inserted = $wpdb->insert($wpdb->prefix . 'historial_partidas', [
        'user_id' => $user_id,
        'club_id' => $club_id,
        'par' => $club->par, 
        'course_rating' => $club->course_rating,
        'length' => $club->length, 
        'golpes_totales' => $golpes_totales, 
        'fecha_juego' => $fecha_juego, 
        'total_neto' => $total_neto, 
        'desempeño_objetivo' => $desempeño_objetivo,
    ]);

    if ($inserted === false) {
        wp_send_json_error(['error' => 'Hubo un error al registrar la partida. Por favor, inténtalo más tarde.']);
    }

    // Eliminar caché relacionado
    eliminar_cache_partidas_registro($user_id);

    // Obtener las 10 mejores partidas de las últimas 20
    $mejores_partidas = $wpdb->get_results($wpdb->prepare(
        "SELECT desempeño_objetivo, length 
         FROM (
             SELECT desempeño_objetivo, length
             FROM {$wpdb->prefix}historial_partidas
             WHERE user_id = %d
             ORDER BY fecha_juego DESC LIMIT 20
         ) AS ultimas_partidas
         ORDER BY desempeño_objetivo ASC LIMIT 10",
        $user_id
    ), ARRAY_A);

    $promedio_desempeño = !empty($mejores_partidas) 
        ? array_sum(array_column($mejores_partidas, 'desempeño_objetivo')) / count($mejores_partidas) 
        : 0;

    $promedio_length = !empty($mejores_partidas) 
        ? array_sum(array_column($mejores_partidas, 'length')) / count($mejores_partidas) 
        : 0;

    // Intentar actualizar los promedios, si no existe, insertar
    $tabla_promedios = $wpdb->prefix . 'users_promedio';
    $actualizado = $wpdb->update(
        $tabla_promedios, 
        ['promedio_desempeño' => $promedio_desempeño, 'promedio_length' => $promedio_length],
        ['user_id' => $user_id],
        ['%f', '%f'],
        ['%d']
    );

    if (!$actualizado) {
        $wpdb->insert(
            $tabla_promedios,
            ['user_id' => $user_id, 'promedio_desempeño' => $promedio_desempeño, 'promedio_length' => $promedio_length],
            ['%d', '%f', '%f']
        );
    }
    wp_send_json_success(['success' => 'Su ronda fue cargada con éxito']); 
}
add_action('wp_ajax_registrar_partida', 'registrar_partida');

function eliminar_cache_partidas_registro($user_id) {
    delete_transient('partidas_user_' . $user_id);
    delete_transient('user_data_' . $user_id);
    delete_transient('promedios_user_' . $user_id); // Solo se elimina una vez
}