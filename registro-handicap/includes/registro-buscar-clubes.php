<?php
defined('ABSPATH') || exit;

function registro_buscar_clubes() {
    global $wpdb;

    // Obtener y sanitizar la entrada
    $nombre_club = sanitize_text_field($_POST['nombre_club'] ?? '');

    // Paginación
    $pagina = max(1, intval($_POST['pagina'] ?? 1));
    $limite = 5;
    $offset = ($pagina - 1) * $limite;
    $append = isset($_POST['append']) && $_POST['append'] === 'true';

    // Escapar para LIKE
    $nombre_club_like = '%' . $wpdb->esc_like($nombre_club) . '%';

    // Consulta para obtener clubes
    $clubes = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT DISTINCT club_name, ciudad
             FROM wp_clubs
             WHERE club_name LIKE %s
             ORDER BY CASE
                        WHEN club_name = %s THEN 1
                        WHEN club_name LIKE %s THEN 2
                        ELSE 3
                     END
             LIMIT %d OFFSET %d",
            $nombre_club_like,
            $nombre_club,
            $nombre_club_like,
            $limite,
            $offset
        )
    );

    // Obtener el total de clubes únicos
    $total_clubes = (int) $wpdb->get_var(
        $wpdb->prepare(
            "SELECT COUNT(DISTINCT club_name) FROM wp_clubs WHERE club_name LIKE %s",
            $nombre_club_like
        )
    );

    if (!empty($clubes)) {
       // Construcción de respuesta
        $response = [
            'clubes' => array_map(fn($club) => [
                'club_id' => $club->id,
                'club_name' => $club->club_name,
                'ciudad' => $club->ciudad,
            ], $clubes),
            'more_results' => $total_clubes > $pagina * $limite,
        ];

        if (!$append) {
            $response['total_resultados'] = $total_clubes;
        }

        wp_send_json_success($response);
    } else {
        wp_send_json_error(['message' => 'No se encontraron clubes con ese nombre.']);
    }
}
add_action('wp_ajax_registro_buscar_clubes', 'registro_buscar_clubes');

function registro_buscar_tees() {
    global $wpdb;

    // Obtener el nombre del club desde la solicitud
    $club_name = $_POST['club_name'] ?? '';

    // Validar que no esté vacío
    if (empty($club_name)) {
        wp_send_json_error(['message' => 'El nombre del club no es válido.']);
    }

    // Consulta para obtener los nombres únicos de tees para el club especificado
    $tees = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT DISTINCT id, tee_name, gender, par, `length`, course_rating 
             FROM wp_clubs 
             WHERE club_name = %s",
            $club_name
        )
    );

    // Si no hay tees, devolver error de inmediato
    if (empty($tees)) {
        wp_send_json_error(['message' => 'No se encontraron tees para este club.']);
    }

    // Construcción de respuesta 
    $response = array_map(fn($tee) => [
        'club_id' => $tee->id, 
        'tee_name' => $tee->tee_name,
        'gender' => $tee->gender,
        'par' => $tee->par, 
        'rating' => $tee->course_rating,
        'length' => $tee->length,
    ], array_filter($tees, fn($tee) => !empty($tee->tee_name)));

    wp_send_json_success(['tees' => $response]);
}
add_action('wp_ajax_registro_buscar_tees', 'registro_buscar_tees');

function registro_clubes_habituales() {
    global $wpdb;

    // Obtener el ID del usuario actual
    $user_id = get_current_user_id();
    if (!$user_id) {
        wp_send_json_error(['message' => 'Usuario no autenticado']);
    }

    // Consulta para obtener los clubes más jugados por el usuario
    $clubes_habituales = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT c.id, c.club_name, c.ciudad, c.tee_name, c.gender, c.par, c.course_rating
             FROM wp_historial_partidas h
             INNER JOIN wp_clubs c ON h.club_id = c.id
             WHERE h.user_id = %d
             GROUP BY h.club_id
             ORDER BY COUNT(h.id) DESC
             LIMIT 3",
            $user_id
        )
    );

    if (!empty($clubes_habituales)) {
        wp_send_json_success([
            'clubes' => array_map(fn($club) => [
                'club_id' => $club->id,
                'club_name' => $club->club_name,
                'ciudad' => $club->ciudad,
                'tee_name' => $club->tee_name,
                'gender' => $club->gender,
                'par' => $club->par,
                'rating' => $club->course_rating,
                'length' => $club->length
            ], $clubes_habituales)
        ]);
    } else {
        wp_send_json_error(['message' => 'No se encontraron clubes habituales']);
    }
}
add_action('wp_ajax_registro_clubes_habituales', 'registro_clubes_habituales');