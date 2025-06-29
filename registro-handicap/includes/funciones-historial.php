<?php 
defined('ABSPATH') || exit;

// Función para obtener las partidas del usuario 
function obtener_partidas() {
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Debes estar logueado para ver tus partidas.']);
    }

    global $wpdb; 
    $user_id = get_current_user_id();

    // Claves de caché
    $transient_key_partidas = 'partidas_user_' . $user_id; 
    $transient_key_promedios = 'promedios_user_' . $user_id; 

    // Obtener datos desde la caché
    $partidas = get_transient($transient_key_partidas);     
    $promedios = get_transient($transient_key_promedios);     

    // Si no hay partidas, se obtienen las partidas de la base de datos.  
    if ($partidas === false) {
        $partidas = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT hp.*, c.club_name, c.tee_name, c.gender
                FROM {$wpdb->prefix}historial_partidas hp
                LEFT JOIN {$wpdb->prefix}clubs c ON c.id = hp.club_id
                WHERE hp.user_id = %d
                ORDER BY hp.fecha_juego DESC",
                $user_id
            ),
            ARRAY_A
        );

        // Guardar las partidas en caché.  
        set_transient($transient_key_partidas, $partidas, HOUR_IN_SECONDS); 
    }

    // Si no hay partidas, se envía todo vacio, incluido el promedio de desempeño y el promedio de length.  
    if (empty($partidas)) {
        wp_send_json_success([
            'partidas' => [],
            'promedio_desempeño' => 0,
            'promedio_length' => 0,
            'total_partidas' => 0,
        ]);
    }

    // Si no hay promedios, se obtienen los promedios de la base de datos.  
    if ($promedios === false) {
        $tabla_promedios = $wpdb->prefix . 'users_promedio'; 
        $promedios = [
            "promedio_desempeño" => $wpdb->get_var($wpdb->prepare("SELECT promedio_desempeño FROM $tabla_promedios WHERE user_id = %d", $user_id)) ?: 0,
            "promedio_length" => $wpdb->get_var($wpdb->prepare("SELECT promedio_length FROM $tabla_promedios WHERE user_id = %d", $user_id)) ?: 0
        ];

        // Guardar los promedios en caché.   
        set_transient($transient_key_promedios, $promedios, 2 * HOUR_IN_SECONDS); 
    }

    wp_send_json_success([
        'partidas' => $partidas,
        'promedio_desempeño' => $promedios['promedio_desempeño'],
        'promedio_length' => $promedios['promedio_length'],
        'total_partidas' => count($partidas),
    ]);
}
add_action('wp_ajax_obtener_partidas', 'obtener_partidas');

// Función para eliminar una partida
function eliminar_partida(){
    if (!is_user_logged_in()) {
        wp_send_json_error(["message" => "Debes estar logueado para eliminar una partida"]);
    }

    global $wpdb; 

    $user_id = get_current_user_id();
    $partida_id = isset($_POST['partida_id']) ? intval($_POST['partida_id']) : 0; 

    if ($partida_id <= 0) {
        wp_send_json_error(['message' => 'ID de partida inválido.']);
    }

    // Eliminar partida
    $eliminado = $wpdb->delete(
        $wpdb->prefix . 'historial_partidas',
        ['id' => $partida_id, 'user_id' => $user_id],
        ['%d', '%d']
    );

    if ($eliminado === false) {
        wp_send_json_error(['message' => "Error al intentar eliminar la partida"]); 
    }

    // Limpiar caché de partidas y promedios inmediatamente
    eliminar_cache_partidas_historial($user_id); 

    // Obtener las últimas 20 partidas y calcular nuevos promedios
    $mejores_partidas = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT desempeño_objetivo, length 
                FROM (
                    SELECT desempeño_objetivo, length
                    FROM {$wpdb->prefix}historial_partidas
                    WHERE user_id = %d
                    ORDER BY fecha_juego DESC LIMIT 20
                ) AS ultimas_partidas
                ORDER BY desempeño_objetivo ASC LIMIT 10",
            $user_id
        ),
        ARRAY_A
    );    

    $promedio_desempeño = !empty($mejores_partidas) ? array_sum(array_column($mejores_partidas, 'desempeño_objetivo')) / count($mejores_partidas) : 0;
    $promedio_length = !empty($mejores_partidas) ? array_sum(array_column($mejores_partidas, 'length')) / count($mejores_partidas) : 0;

    // Actualizar la tabla de promedios en la base de datos
    $actualizado = $wpdb->update(
        $wpdb->prefix . 'users_promedio',
        ['promedio_desempeño' => $promedio_desempeño, 'promedio_length' => $promedio_length],
        ['user_id' => $user_id],
        ['%f', '%f'],
        ['%d']
    );

    if ($actualizado === false) {
        wp_send_json_error(['message' => 'Error al intentar actualizar los promedios.']);
    }   

    // Guardar los valores actualizados en caché
    set_transient("promedios_user_" . $user_id, [
        'promedio_desempeño' => $promedio_desempeño, 
        'promedio_length' => $promedio_length, 
    ], 2 * HOUR_IN_SECONDS);    

    wp_send_json_success([
        'message' => 'Partida eliminada y promedios actualizados.',
        'promedio_desempeño' => $promedio_desempeño,
        'promedio_length' => $promedio_length,
    ]);
}
add_action('wp_ajax_eliminar_partida', 'eliminar_partida');  

// Función para eliminar caché de un usuario
function eliminar_cache_partidas_historial($user_id) {
    $transients = [
        'partidas_user_' . $user_id,
        'promedios_user_' . $user_id,
        'user_data_' . $user_id
    ];

    foreach ($transients as $transient) {
        delete_transient($transient);
    }
}