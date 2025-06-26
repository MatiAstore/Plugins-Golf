<?php
defined('ABSPATH') || exit;

function calcular_handicap() {
    global $wpdb;

    $club_id = intval($_POST['club_id']);
    $index_jugador = floatval($_POST['index_jugador']); 

    if ($club_id && $index_jugador !== null ) {
        $club = $wpdb->get_row("SELECT * FROM wp_clubs WHERE id = $club_id");

        if ($club) {
            $slopeRating = $club->slope_rating ?: 0;
            $courseRating = $club->course_rating ?: 0;
            $par = $club->par ?: 0;

            $handicap = (($slopeRating / 113) * $index_jugador) + ($courseRating - $par);
            wp_send_json_success(array('handicap' => round($handicap)));
        } else {
            wp_send_json_error(array('message' => 'Club no encontrado'));
        }
    } else {
        wp_send_json_error(array('message' => 'Datos inválidos'));
    }
}
add_action('wp_ajax_calcular_handicap', 'calcular_handicap'); 
add_action('wp_ajax_nopriv_calcular_handicap', 'calcular_handicap');
