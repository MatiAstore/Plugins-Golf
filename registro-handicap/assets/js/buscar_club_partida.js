(function ($) {
    let delayTimer;
    let currentRequest = null;
    const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

    $(document).ready(function () {
        // Cargar clubes habituales desde localStorage o desde el backend si es necesario
        cargarClubesHabituales();

        function limpiarResultadosRegistro() {
            $('#resultados_clubes, #club-seleccionado, #resultado').empty();
            $('#club-info-seleccionado, #tee-seleccionado, #contenedor-seleccion-y-formulario').hide();
            $('#club_id').val('');
            $('#resultado').css('border', 'none');
        }

        $('#nombre_club').on('input', function () {
            clearTimeout(delayTimer);
            limpiarResultadosRegistro();

            let nombre_club = $(this).val().trim();
            if (currentRequest) currentRequest.abort();

            if (nombre_club.length >= 3) {
                delayTimer = setTimeout(() => buscarClubesRegistro(nombre_club, 1, false), 300);
            } else {
                $('#resultados_clubes').empty();
            }
        });

        function buscarClubesRegistro(nombre_club, pagina, append) {
            // Definir clave para la caché (incluye búsqueda y página)
            let cacheKey = 'clubes_' + nombre_club + '_' + pagina;
            let cached = localStorage.getItem(cacheKey);
            let now = Date.now();

            if (cached) {
                let cachedObj = JSON.parse(cached);
                if (now - cachedObj.timestamp < CACHE_EXPIRATION) {
                    // Si la caché es válida, renderizamos sin consultar el backend
                    renderizarResultados(cachedObj.data, append, nombre_club, pagina);
                    return;
                } else {
                    localStorage.removeItem(cacheKey);
                }
            }

            // Si no hay caché o ha expirado, hacer la consulta AJAX
            currentRequest = $.ajax({
                url: registroPartida.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: { 
                    action: 'registro_buscar_clubes', 
                    nombre_club, 
                    pagina, 
                    append: append ? 'true' : 'false' 
                },
                beforeSend: () => {
                    if (!append) {
                        $('#resultados_clubes').html('<p>Cargando...</p>');
                    }
                    $('#ver_mas_resultados').prop('disabled', true).text('Cargando...');
                },
                success: function (response) {
                    if (!response.success || !response.data) {
                        $('#resultados_clubes').html('<p>No se encontraron clubes con ese nombre.</p>');
                        return;
                    }
                    // Guardar el resultado en caché
                    localStorage.setItem(cacheKey, JSON.stringify({ data: response.data, timestamp: now }));
                    renderizarResultados(response.data, append, nombre_club, pagina);
                },
                error: function (xhr, status, error) {
                    if (status !== 'abort') {
                        $('#resultados_clubes').html('<p>No se pudo completar la búsqueda. Intenta nuevamente.</p>');
                        console.error("Error en AJAX: ", status, error);
                    }
                }
            });
        }

        function renderizarResultados(data, append, nombre_club, pagina) {
            let listaClubes;
            if (!append) {
                $('#resultados_clubes').html(`<p id="total_resultados">Total de resultados: ${data.total_resultados}</p><ul id="lista_clubes"></ul>`);
                listaClubes = $('#lista_clubes');
            } else {
                listaClubes = $('#lista_clubes');
            }

            let clubesHTML = '';
            data.clubes.forEach(club => {
                clubesHTML += `
                    <li class="nuevo-club-temporal">
                        <strong>${club.club_name}</strong>
                        <span>Ciudad: ${club.ciudad}</span>
                        <button type="button" class="seleccionar-club" data-name="${club.club_name}" data-ciudad="${club.ciudad}">Seleccionar</button>
                    </li>`;
            });
            listaClubes.append(clubesHTML);

            // Eliminar la clase temporal después de 1.5 segundos para efecto visual
            $('.nuevo-club-temporal').each(function () {
                const clubElement = $(this);
                setTimeout(() => {
                    clubElement.removeClass('nuevo-club-temporal');
                }, 1500);
            });

            if (data.more_results) {
                $('#ver_mas_resultados').remove();
                listaClubes.after(`<button id="ver_mas_resultados" data-nombre="${nombre_club}" data-pagina="${pagina + 1}">Cargar más</button>`);
            } else {
                $('#ver_mas_resultados').remove();
            }

            if (append) {
                listaClubes[0].scrollTo({ top: listaClubes[0].scrollHeight, behavior: 'smooth' });
            }
            $('#ver_mas_resultados').prop('disabled', false).text('Cargar más');
        }

        // Manejo del botón de paginación
        $(document).on('click', '#ver_mas_resultados', function () {
            buscarClubesRegistro($(this).data('nombre'), $(this).data('pagina'), true);
        });

        // Manejo de la selección de un club
        $(document).on('click', '.seleccionar-club', function () {
            let club_name = $(this).data('name'),
                ciudad = $(this).data('ciudad');

            if (!club_name) return alert('Club no válido.');

            // Vaciar campos y ocultar formularios
            $('#tee_select').empty();
            $('#club-seleccionado').empty();
            $('#contenedor-seleccion-y-formulario').hide();

            // Mostrar información del club seleccionado
            $('#club-info-seleccionado').show();
            $('#club-nombre').text(club_name);
            $('#club-ciudad').text(ciudad);
            $('#tee-seleccionado').show();

            // Hacer scroll hacia la sección de tees
            document.querySelector('#tee-seleccionado').scrollIntoView({ behavior: 'smooth', block: 'center' });
            mostrarTeesRegistro(club_name, ciudad);
        });

        // Mostrar las tees del club seleccionado
        function mostrarTeesRegistro(club_name) {
            let teeSelect = $('#tee_select').empty().append('<option value="" disabled selected>Selecciona un tee</option>').prop('disabled', true);

            $.ajax({
                url: registroPartida.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: { action: 'registro_buscar_tees', club_name },
                success: function (response) {
                    if (!response.success || !response.data || response.data.tees.length === 0) {
                        return alert('No se encontraron tees.');
                    }

                    let opcionesTees = response.data.tees.map(tee => `
                        <option value="${tee.club_id}" data-tee-name="${tee.tee_name}" data-gender="${tee.gender}" data-par="${tee.par}" data-rating="${tee.rating}">
                            ${tee.tee_name} (${tee.gender}) - Par: ${tee.par}
                        </option>
                    `).join('');
                    teeSelect.append(opcionesTees).prop('disabled', false);
                },
                error: function (xhr, status, error) {
                    console.error("Error en la solicitud de tees: ", status, error);
                }
            });
        }

        // Manejo al seleccionar una tee
        $(document).on('change', '#tee_select', function () {
            let selected = $(this).find(':selected');

            $('#club-seleccionado').html(`
                <strong>Tee:</strong> ${selected.data('tee-name')}<br>
                <strong>Par:</strong> ${selected.data('par')}<br>
                <strong>Género:</strong> ${selected.data('gender')}<br>
            `);
            $('#contenedor-seleccion-y-formulario').show();
            $('#club_id').val(selected.val());
            document.querySelector('#contenedor-seleccion-y-formulario').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        // Cargar los clubes habituales desde localStorage con expiración o hacer la solicitud si no están en caché
        function cargarClubesHabituales() {
            let cached = localStorage.getItem('clubesHabituales');
            let now = Date.now();
            if (cached) {
                let cachedObj = JSON.parse(cached);
                if (now - cachedObj.timestamp < CACHE_EXPIRATION) {
                    renderizarClubesHabituales(cachedObj.data);
                    return;
                } else {
                    localStorage.removeItem('clubesHabituales');
                }
            }
            $.ajax({
                url: registroPartida.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: { action: 'registro_clubes_habituales' },
                success: function (response) {
                    if (!response.success || !response.data || response.data.clubes.length === 0) return;
                    // Guardar en caché con timestamp
                    localStorage.setItem('clubesHabituales', JSON.stringify({ data: response.data.clubes, timestamp: now }));
                    renderizarClubesHabituales(response.data.clubes);
                },
                error: function (xhr, status, error) {
                    console.error("Error al obtener clubes habituales: ", status, error);
                }
            });
        }

        function renderizarClubesHabituales(clubes) {
            let clubesHTML = clubes.map(club => `
                <li>
                    <strong>${club.club_name}</strong>
                    <span>Ciudad: ${club.ciudad}</span>

                    <div class="clubes-habituales-info">
                        <span>Tee: ${club.tee_name}</span> 
                        <span> - Gender: ${club.gender}</span> 
                    </div>

                    
                    <button type="button" class="seleccionar-club-habitual" 
                        data-name="${club.club_name}" 
                        data-ciudad="${club.ciudad}" 
                        data-tee-name="${club.tee_name}"
                        data-par="${club.par}" 
                        data-gender="${club.gender}" 
                        data-rating="${club.rating}"    
                        data-club-id="${club.club_id}">
                        Seleccionar
                    </button>
                </li>
            `).join('');
        
            let clubesContainer = $('#clubes-habituales');
            clubesContainer.show().html(`
                <h3>Tus Búsquedas Habituales</h3>
                <ul>${clubesHTML}</ul>`);
        }        

        // Manejo de la selección de un club habitual
        $(document).on('click', '.seleccionar-club-habitual', function () {
            let club_name = $(this).data('name'),
                ciudad = $(this).data('ciudad'),
                tee_name = $(this).data('tee-name'),
                par = $(this).data('par'),
                gender = $(this).data('gender'),
                rating = $(this).data('rating'),
                club_id = $(this).data('club-id');
        
            if (!club_name || !tee_name) return alert('Club o tee inválido.');
        
            $('#club-info-seleccionado').show();
            $('#club-nombre').text(club_name);
            $('#club-ciudad').text(ciudad);
        
            $("#resultados_clubes").empty(); 
            $('#tee-seleccionado').hide();
            $('#club-seleccionado').html(`
                <strong>Tee:</strong> ${tee_name}<br>
                <strong>Par:</strong> ${par}<br>
                <strong>Género:</strong> ${gender}<br>
            `);
        
            $('#club_id').val(club_id);
            $('#contenedor-seleccion-y-formulario').show();
            document.querySelector('#contenedor-seleccion-y-formulario').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });
})(jQuery);
