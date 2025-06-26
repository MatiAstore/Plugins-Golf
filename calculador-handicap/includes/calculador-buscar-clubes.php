<?php
defined('ABSPATH') || exit;
function calculador_buscar_clubes() {
    global $wpdb;

    // Obtener y sanitizar la entrada
    $nombre_club = isset($_POST['nombre_club']) ? sanitize_text_field($_POST['nombre_club']) : '';

    //Paginacion
    $pagina = isset($_POST['pagina']) ? intval($_POST['pagina']) : 1;
    $limite = 5;
    $offset = ($pagina - 1) * $limite;
    $append = isset($_POST['append']) && $_POST['append'] === 'true';

    // Escapar para LIKE
    $nombre_club_like = '%' . $wpdb->esc_like($nombre_club) . '%';

    // Consulta para obtener clubes únicos por nombre (usando GROUP BY)
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
add_action('wp_ajax_calculador_buscar_clubes', 'calculador_buscar_clubes');
add_action('wp_ajax_nopriv_calculador_buscar_clubes', 'calculador_buscar_clubes');

function calculador_buscar_tees() {
    global $wpdb;

    // Obtener el nombre del club desde la solicitud
    $club_name = $_POST['club_name'] ?? '';
    $use_course_rating = isset($_POST['course_rating']) && $_POST['course_rating'] === 'true';

    // Validar que no esté vacío
    if (empty($club_name)) {
        wp_send_json_error(['message' => 'El nombre del club no es válido.']);
    }

    // Seleccionar el campo apropiado según course_rating
    $rating_field = $use_course_rating ? 'course_rating' : 'slope_rating';

    // Consulta para obtener los nombres únicos de tees para el club especificado
    $tees = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT DISTINCT id, tee_name, gender, par, $rating_field as rating
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
        'rating' => $tee->rating,
    ], array_filter($tees, fn($tee) => !empty($tee->tee_name)));

    wp_send_json_success(['tees' => $response]);
}
add_action('wp_ajax_calculador_buscar_tees', 'calculador_buscar_tees');
add_action('wp_ajax_nopriv_calculador_buscar_tees', 'calculador_buscar_tees');

