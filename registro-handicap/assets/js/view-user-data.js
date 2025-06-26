(function ($) {
    $(document).ready(function () {
        const $promedioDesempeñoSpan = $('#promedio-partidas');
        const $promedioYardasSpan = $('#promedio-yardas');
        const $totalRondasSpan = $('#total-rondas');
        const $camposSpan = $('#campos');
        const $mensajeError = $('.shortcode-view');

        let datosPrevios = {}; // Evitar actualizaciones innecesarias

        function obtenerPromedios(reintento = 0) {
            // Obtener la URL actual de la página
            const urlActual = window.location.href;  

            $.ajax({
                url: ajaxView.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'get_user_data',
                    url_actual: urlActual // Enviar la URL al servidor
                },
                success: function (response) {
                    if (response.success) {
                        const { promedio_desempeño, promedio_length, total_rondas, campos_diferentes } = response.data;

                        if (![promedio_desempeño, promedio_length, total_rondas, campos_diferentes].every(Number.isFinite)) {
                            $mensajeError.html('<p>Error: Datos inválidos.</p>');
                            return;
                        }

                        if (
                            datosPrevios.promedio_desempeño !== promedio_desempeño ||
                            datosPrevios.promedio_length !== promedio_length ||
                            datosPrevios.total_rondas !== total_rondas ||
                            datosPrevios.campos_diferentes !== campos_diferentes
                        ) {
                            $promedioDesempeñoSpan.text(promedio_desempeño.toFixed(2));
                            $promedioYardasSpan.text(promedio_length.toFixed(2));
                            $totalRondasSpan.text(total_rondas);
                            $camposSpan.text(campos_diferentes);

                            datosPrevios = { promedio_desempeño, promedio_length, total_rondas, campos_diferentes };
                        }
                    } else {
                        if (response.data.message === 'No se encontró el usuario en la URL.') {
                            $mensajeError.html('<p>No se encontraron datos del usuario.</p>');
                        } else {
                            $mensajeError.html('<p>Usuario no encontrado</p>');
                        }
                    }
                },
                error: function () {
                    if (reintento < 2) {
                        setTimeout(() => obtenerPromedios(reintento + 1), 2000);
                    } else {
                        $mensajeError.html('<p>Error en la solicitud. Inténtalo más tarde.</p>');
                    }
                },
            });
        }

        obtenerPromedios();
    });
})(jQuery);
