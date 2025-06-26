(function ($) {
    let delayTimer;
    let currentRequest = null;
    const STORAGE_KEY = 'clubesHabitualesCalculo';
    const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    
    $(document).ready(function () {
        cargarClubesHabituales(); 

        function limpiarResultadosHandicap() {
            $('#resultados_clubes, #club-seleccionado, #resultado_handicap').empty();
            $('#club-info-seleccionado, #tee-seleccionado, #contenedor-seleccion-y-formulario').hide();
            $('#club_id').val('');
            $('#resultado_handicap').css('border', 'none');
        }

        // Buscar clubes dinámicamente al escribir
        $('#nombre_club').on('input', function () {
            clearTimeout(delayTimer);
            limpiarResultadosHandicap();

            let nombre_club = $(this).val().trim();
            if (currentRequest) currentRequest.abort();

            if (nombre_club.length >= 3) {
                delayTimer = setTimeout(() => buscarClubesHandicap(nombre_club, 1, false), 300);
            } else {
                $('#resultados_clubes').empty();
            }
        });

        // Función para buscar clubes
        function buscarClubesHandicap(nombre_club, pagina, append) {
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
        
            currentRequest = $.ajax({
                url: ajaxHandicap.ajaxurl, 
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'calculador_buscar_clubes',
                    nombre_club: nombre_club,
                    pagina: pagina,
                    append: append ? 'true' : 'false'
                },
                beforeSend: function () {
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
            buscarClubesHandicap($(this).data('nombre'), $(this).data('pagina'), true);
        });

        // Seleccionar un club
        $(document).on('click', '.seleccionar-club', function () {
            let club_name = $(this).data('name'), ciudad = $(this).data('ciudad');

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
            mostrarTeesHandicap(club_name);
        });

        // Función para mostrar tees
        function mostrarTeesHandicap(club_name, course_rating) {
            let teeSelect = $('#tee_select').empty().append('<option value="" disabled selected>Selecciona un tee</option>').prop('disabled', true);

            $.ajax({
                url: ajaxHandicap.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: { action: 'calculador_buscar_tees', club_name: club_name, course_Rating : course_rating ? 'true' : 'false' },
                success: function (response) {
                    if (!response.success || !response.data || response.data.tees.length === 0) {
                        return alert('No se encontraron tees.');
                    }
                    let opcionesTees = response.data.tees.map(tee => `
                        <option value="${tee.club_id}" data-tee-name="${tee.tee_name}" data-gender="${tee.gender}" data-par="${tee.par}" data-rating="${tee.rating}">
                            ${tee.tee_name} (${tee.gender}) - Rating: ${tee.rating} - Par: ${tee.par}
                        </option>
                    `).join('');
                    teeSelect.append(opcionesTees).prop('disabled', false);
                },
                error: function (xhr, status, error) {
                    console.error("Error en la solicitud de tees: ", status, error);
                }
            });
        }

        // Manejar la selección del tee
        $(document).on('change', '#tee_select', function () {
            let selected = $(this).find(':selected');

            $('#club-seleccionado').html(`
                <strong>Tee:</strong> ${selected.data('tee-name')}<br>
                <strong>Par:</strong> ${selected.data('par')}<br>
                <strong>Género:</strong> ${selected.data('gender')}<br>
                <strong>Rating:</strong> ${selected.data('rating')}
            `);
            $('#contenedor-seleccion-y-formulario').show();
            $('#club_id').val(selected.val());

            $('#resultado_handicap').empty();
            document.querySelector('#contenedor-seleccion-y-formulario').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }); 

        // Cargar clubes desde localStorage
        function cargarClubesHabituales() {
            let cached = localStorage.getItem(STORAGE_KEY);
            if (!cached) return;

            let clubes = JSON.parse(cached).data || [];
            renderizarClubesHabituales(clubes);
        }

        function guardarClubHabitual(club) {
            let cached = localStorage.getItem(STORAGE_KEY);
            let clubes = cached ? JSON.parse(cached).data : [];
        
            let clubIndex = clubes.findIndex(c => c.club_id === club.club_id);
        
            if (clubIndex !== -1) {
                // Si el club ya está en la lista, aumentar su contador de uso
                clubes[clubIndex].uso += 1;
            } else {
                club.uso = 1;
        
                if (clubes.length < 3) {
                    // Si hay espacio, simplemente lo agregamos
                    clubes.push(club);
                } else {
                    // Encontrar el club con menor uso para reemplazarlo
                    let menosUsadoIndex = clubes.reduce((minIndex, c, i) => c.uso < clubes[minIndex].uso ? i : minIndex, 0);
                    clubes[menosUsadoIndex] = club;  // Reemplazar directamente
                }
            }
        
            // Ordenar la lista por uso (mayor a menor)
            clubes.sort((a, b) => b.uso - a.uso);
            
            // Guardar solo los 3 más frecuentes
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: clubes }));
        }

        // Renderizar clubes en el DOM
        function renderizarClubesHabituales(clubes) {
            if (!clubes.length) return;

            let clubesHTML = clubes.map(club => `
                <li>
                    <strong>${club.club_name}</strong>
                    <span>Ciudad: ${club.ciudad}</span>

                    <div class="clubes-habituales-info">
                        <span>Tee: ${club.tee_name}</span> 
                        <span> - Gender: ${club.gender}</span> 
                        <span> - Rating: ${club.rating}</span> 
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

            $('#clubes-habituales').show().html(`
                <h3>Tus Búsquedas Habituales</h3>
                <ul>${clubesHTML}</ul>
            `);
        }



        
        // Manejar selección de un club habitual
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

        $('#club-seleccionado').html(`
            <strong>Tee:</strong> ${tee_name}<br>
            <strong>Par:</strong> ${par}<br>
            <strong>Género:</strong> ${gender}<br>
            <strong>Rating:</strong> ${rating}
        `);

        $('#club_id').val(club_id);
        $('#contenedor-seleccion-y-formulario').show();
        document.querySelector('#contenedor-seleccion-y-formulario').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }); 

       // Calcular handicap
        $('#form-calcular-handicap').on('submit', function (e) {
            e.preventDefault();
            const club_id = $('#club_id').val();
            const index_jugador = $('#index_jugador').val();

            if (!club_id) {
                alert("Selecciona un club y un tee antes de calcular.");
                return;
            }

            const submitButton = $(this).find('button[type="submit"]');
            submitButton.prop('disabled', true).text('Calculando...');

            $.ajax({
                url: ajaxHandicap.ajaxurl,
                type: 'POST',
                dataType: 'json', 
                data: {
                    action: 'calcular_handicap',
                    club_id: club_id,
                    index_jugador: index_jugador
                },
                success: function (response) {
                    if (response.success) {
                        // Mostrar el handicap calculado
                        $('#resultado_handicap').html(`
                            <p>WGH de juego:</p>
                            <div class="valor-resultado">${response.data.handicap}</div>
                        `);

                        // Guardar el club como habitual al calcular
                        let club = {
                            club_id: club_id,
                            club_name: $('#club-nombre').text(),
                            ciudad: $('#club-ciudad').text(),
                            tee_name: $('#tee_select option:selected').data('tee-name'),
                            par: $('#tee_select option:selected').data('par'),
                            gender: $('#tee_select option:selected').data('gender'),
                            rating: $('#tee_select option:selected').data('rating')
                        };

                        guardarClubHabitual(club); // Guardar solo después del cálculo

                        // Desplazar la vista hasta el resultado del handicap
                        const resultadoHandicap = document.getElementById('resultado_handicap');
                        resultadoHandicap.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        alert(response.data.message || 'Ocurrió un error al calcular el handicap.');
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Error en la solicitud AJAX: ", status, error);
                    alert('Error al calcular el handicap. Inténtalo de nuevo.');
                },
                complete: function () {
                    submitButton.prop('disabled', false).text('Calcular');
                }
            });
        });

    });
})(jQuery);
