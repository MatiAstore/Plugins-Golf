(function ($) {
    $(document).ready(function () {
        // Inicializa flatpickr
        function initFlatpickr() {
            flatpickr('#fecha_juego_fecha', {
                clickOpens: true,
                locale: 'es',
                dateFormat: "Y-m-d",
                maxDate: "today",
                closeOnSelect: false,
            });

            flatpickr('#fecha_juego_hora', {
                enableTime: true,
                noCalendar: true,
                dateFormat: "H:i",
                allowInput: true,
            });
        }

        // Deshabilita/habilita el botón de enviar y cambia el texto
        function toggleSubmitButton(enable, text) {
            $('#submit_partida').prop('disabled', !enable).text(text);
        }

        // Valida el formulario
        function validarFormulario() {
            const errores = [];
            const club_id = $('#club_id').val();
            const golpes_totales = $('#golpes_totales').val();
            const fecha = $('#fecha_juego_fecha').val();
            const hora = $('#fecha_juego_hora').val();

            if (!club_id) errores.push('Seleccione un club.');
            if (!golpes_totales || golpes_totales <= 0) errores.push('Ingrese un número válido de golpes.');
            if (!fecha) errores.push('Ingrese una fecha válida.');
            if (!hora) errores.push('Ingrese una hora válida.');

            return errores;
        }

        // Muestra los errores
        function mostrarErrores(errores) {
            const resultado = $('#resultado');
            resultado.empty();
            let errorMessage = '';

            if (errores.length > 1) {
                errorMessage = `<div class="error-message" role="alert">Por favor, complete todos los campos correctamente.</div>`;
            } else {
                errorMessage = `<div class="error-message" role="alert">${errores[0]}</div>`;
            }
            resultado.html(errorMessage);
            $('.error-message').fadeIn(300).focus();
        }

        // Maneja la respuesta del servidor después de la solicitud AJAX
        function handleAjaxSuccess(response, golpes_totales) {
            if (response.success && response.data) {
                // Oculta el contenedor antes de mostrar el mensaje de éxito
                $('#contenedor-seleccion-y-formulario').fadeOut(300, function () {
                    // Reinicia el formulario y oculta secciones relacionadas
                    $('#form_partida')[0].reset();
                    $('#club_id').val('');
                    $('#tee-seleccionado').val('').hide();
                    $('#club-info-seleccionado').hide();
                    $('#club-seleccionado').empty();

                    // Construir y mostrar el mensaje de éxito
                    const mensaje = `
                        <div class="success-message" style="display:none;" tabindex="0" role="alert">
                            <h2>${response.data.success}</h2>
                            <p>Total de golpes registrados: <strong>${golpes_totales}</strong></p>
                        </div>`;
                    $('#resultado').html(mensaje);
                    $('#resultado .success-message').fadeIn(100, function () {
                        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }).focus();
                });
            } else {
                const error = response.data?.error || 'Ocurrió un error inesperado al registrar la partida.';
                mostrarErrores([error]);
            }
        }

        // Maneja el envío del formulario
        $(document).on('submit', '#form_partida', function (e) {
            e.preventDefault();
            $('#resultado').empty();
            
            const errores = validarFormulario();
            if (errores.length > 0) {
                mostrarErrores(errores);
                return;
            }

            const club_id = $('#club_id').val();
            const golpes_totales = $('#golpes_totales').val();
            const fecha = $('#fecha_juego_fecha').val();
            const hora = $('#fecha_juego_hora').val();
            const fecha_juego = `${fecha} ${hora}`;

            toggleSubmitButton(false, "Registrando...");

            $.ajax({
                url: registroPartida.ajaxurl,
                type: 'POST',
                data: { action: 'registrar_partida', club_id, golpes_totales, fecha_juego },
                dataType: 'json',
                success: function (response) {
                    handleAjaxSuccess(response, golpes_totales);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    const errorMensaje = jqXHR.responseJSON?.message || errorThrown || 'Hubo un problema con la conexión al servidor.';
                    mostrarErrores([errorMensaje]);
                },
                complete: function () {
                    toggleSubmitButton(true, "Registrar Ronda");
                }
            });
        });

        // Inicializar flatpickr
        initFlatpickr();
    });
})(jQuery);
