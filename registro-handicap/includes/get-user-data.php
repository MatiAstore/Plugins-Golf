<?php
defined('ABSPATH') || exit;

function get_user_data() {
    // Obtener URL desde POST
    $path = isset($_POST['url_actual']) ? sanitize_text_field($_POST['url_actual']) : '';

    // Extraer nombre de usuario de la URL
    if (!preg_match('/golfer\/([^\/]+)/', $path, $matches)) {
        wp_send_json_error(['message' => 'No se encontró el usuario en la URL.']);
    }

    $user_name = sanitize_text_field($matches[1]);

    // Obtener ID del usuario desde el nicename
    $user = get_user_by('slug', $user_name);
    if (!$user) {
        wp_send_json_error(['message' => 'Usuario no encontrado.']);
    }

    $user_id = $user->ID;

    global $wpdb;

    $cache_key = "user_data_$user_id";

    // Intentar obtener caché
    $datos = get_transient($cache_key);
    if ($datos !== false) {
        wp_send_json_success($datos);
    }

    // Consulta optimizada
    $resultados = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT 
                up.user_id, 
                COALESCE(up.promedio_desempeño, 0) AS promedio_desempeño, 
                COALESCE(up.promedio_length, 0) AS promedio_length, 
                COUNT(DISTINCT hp.id) AS total_rondas,
                COUNT(DISTINCT hp.club_id) AS campos_diferentes
            FROM {$wpdb->prefix}users_promedio up
            LEFT JOIN {$wpdb->prefix}historial_partidas hp ON up.user_id = hp.user_id
            WHERE up.user_id = %d
            GROUP BY up.user_id",
            $user_id
        ),
        ARRAY_A
    );

    if (!$resultados) {
        $datos = [
            'promedio_desempeño'  => 0,
            'promedio_length'     => 0,
            'total_rondas'        => 0,
            'campos_diferentes'   => 0
        ];
    } else {
        $datos = [
            'promedio_desempeño'  => (float) $resultados['promedio_desempeño'],
            'promedio_length'     => (float) $resultados['promedio_length'],
            'total_rondas'        => (int) $resultados['total_rondas'],
            'campos_diferentes'   => (int) $resultados['campos_diferentes']
        ];
    }
    
    // Guardar en caché y responder con éxito
    set_transient($cache_key, $datos, 30 * MINUTE_IN_SECONDS);
    wp_send_json_success($datos);    
}

add_action('wp_ajax_get_user_data', 'get_user_data');
add_action('wp_ajax_nopriv_get_user_data', 'get_user_data');
