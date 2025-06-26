jQuery(document).ready(function ($) {
    const tablaPartidas = $('#tabla-partidas');
    const tarjetasPartidas = $('#tarjetas-partidas');
    const promedioDesempeñoSpan = $('#promedio-partidas');
    const promedioYardasSpan = $('#promedio-yardas');
    const botonCargarMas = $('#boton-cargar-mas');

    let partidas = []; 
    let paginaActual = 1;
    let limitePagina = 10;
    let mejoresPartidasIds = new Set();  

    // Función que calcula las mejores partidas. 
    function calcularMejoresPartidas() {
        const mejoresPartidas = partidas.slice(0, 20)
            .sort((a, b) => a.desempeño_objetivo - b.desempeño_objetivo)
            .slice(0, 10);
        mejoresPartidasIds = new Set(mejoresPartidas.map(p => p.id));
    }

    // Función que genera el HTML para una partida. 
    function generarHTMLPartida(partida, esMejor, esMenosDe10) {
        const claseResaltar = esMejor || esMenosDe10 ? 'resaltar' : '';
        
        const htmlTarjeta = `
            <div class="tarjeta-partida ${claseResaltar}">
                <div class="first-row">
                    <p id="club-name">${partida.club_name}</p>
                    <p id="fecha-juego">${partida.fecha_juego}</p> 
                </div>
                <div class="second-row">
                    <div class="golpes-par-container"> 
                        <p id="golpes-totales">${partida.golpes_totales}</p>
                        <p id="par">${partida.par}</p>
                    </div>
                    <p id="desempeño_objetivo">${partida.desempeño_objetivo}</p>
                </div>
                <button class="btn-ver-detalles">Ver más detalles</button>
                <button class="btn-eliminar" data-partida-id="${partida.id}">Eliminar</button>
                <div class="detalles-adicionales" style="display: none;">
                    <p><strong>Course Rating:</strong> ${partida.course_rating}</p>
                    <p><strong>Tee:</strong> ${partida.tee_name}</p>
                    <p><strong>Género:</strong> ${partida.gender}</p>
                    <p><strong>Yardas:</strong> ${partida.length}</p>
                    <p><strong>Gross:</strong> ${partida.total_neto > 0 ? `+${partida.total_neto}` : partida.total_neto}</p>
                </div>
            </div>
        `;
    
        const htmlTabla = `
            <tr class="${claseResaltar}">
                <td>${partida.fecha_juego}</td>
                <td>${partida.club_name}</td>
                <td>${partida.tee_name}</td>
                <td>${partida.gender}</td>
                <td>${partida.par}</td>
                <td>${partida.course_rating}</td>
                <td>${partida.length}</td>
                <td>${partida.golpes_totales}</td>
                <td>${partida.total_neto > 0 ? `+${partida.total_neto}` : partida.total_neto}</td>
                <td>${partida.desempeño_objetivo}</td>
                <td>
                    <span class="btn-eliminar-x" data-partida-id="${partida.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16">
                            <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                        </svg>
                    </span>
                </td>
            </tr>
        `;

        return { htmlTarjeta, htmlTabla };
    }

    // Función de renderizado optimizado
    function renderizarPartidas(pagina) {
        let htmlTarjetas = "", htmlTabla = ""; 

        const inicio = (pagina - 1) * limitePagina;
        const fin = inicio + limitePagina;
        const partidasPagina = partidas.slice(inicio, fin);
    
        // Limpiar la UI si es la primera página.
        if (pagina === 1) {tablaPartidas.empty(); tarjetasPartidas.empty();}
        if (!partidasPagina.length) {
            tablaPartidas.append('<tr><td colspan="10">No hay partidas disponibles</td></tr>');
            tarjetasPartidas.append('<p class="mensaje-no-encontrado">No hay partidas disponibles.</p>');
            return botonCargarMas.hide();
        }
    
        const esMenosDe10 = partidas.length <= 10;
    
        partidasPagina.forEach(partida => {
            const esMejor = mejoresPartidasIds.has(partida.id);
            const { htmlTarjeta, htmlTabla: tabla } = generarHTMLPartida(partida, esMejor, esMenosDe10);
            htmlTarjetas += htmlTarjeta;
            htmlTabla += tabla;
        });

        tarjetasPartidas.append(htmlTarjetas);
        tablaPartidas.append(htmlTabla);
    
        // Mostrar u ocultar el botón "Cargar más"
        partidas.length > fin ? botonCargarMas.show().prop('disabled', false).text('Cargar más') : botonCargarMas.hide();
    }

    // Manejar errores y reintentar en caso de fallos
    function cargarPartidas() {
        $.ajax({
            url: ajaxHistorial.ajaxurl,
            type: 'POST',
            data: { action: 'obtener_partidas' },
            dataType: 'json',
            beforeSend: () => botonCargarMas.prop('disabled', true).text('Cargando...'),
            success: (response) => {
                if (!response.success) return alert('Error al cargar las partidas.');
                partidas = response.data.partidas;
                calcularMejoresPartidas();
                promedioDesempeñoSpan.text(parseFloat(response.data.promedio_desempeño).toFixed(2));
                promedioYardasSpan.text(parseFloat(response.data.promedio_length).toFixed(2));
                renderizarPartidas(paginaActual);
            },
            error: () => { alert('Error al cargar datos, reintentando...'); cargarPartidas(); }
        });
    }

    // Función para eliminar una partida.
    function eliminarPartida(partidaId) {
        if (!confirm("¿Eliminar esta partida?")) return;
        
        // Actualiza el arreglo de partidas y recalcula las mejores partidas
        partidas = partidas.filter(p => p.id != partidaId);
        calcularMejoresPartidas();
        
        // Reinicia la visualización: vacía los contenedores y renderiza la primera página
        paginaActual = 1;
        tablaPartidas.empty();
        tarjetasPartidas.empty();
        renderizarPartidas(paginaActual);
        
        // Realiza la eliminación en el servidor
        $.ajax({
            url: ajaxHistorial.ajaxurl,
            type: 'POST',
            data: { action: 'eliminar_partida', partida_id: partidaId },
            dataType: 'json',
            success: (response) => {
                if (response.success) {
                    $('#mensaje-eliminacion')
                        .text('Partida eliminada')
                        .addClass('success')
                        .fadeIn()
                        .delay(3000)
                        .fadeOut();
                        
                    promedioDesempeñoSpan.text(parseFloat(response.data.promedio_desempeño).toFixed(2));
                    promedioYardasSpan.text(parseFloat(response.data.promedio_length).toFixed(2));
                }
            }
        });
    }

    // Inicializar la carga
    cargarPartidas();
    
    // Unificar eventos de eliminación de partidas
    $(document).on('click', '.btn-eliminar-x, .btn-eliminar', function () {
        const partidaId = $(this).data('partida-id');
        eliminarPartida(partidaId);
    });
    
    // Manejar clic en "Cargar más"
    botonCargarMas.on('click', function () {
        paginaActual++;
        renderizarPartidas(paginaActual);
    });
    
    // Manejar clic en "Ver Detalles"
    tarjetasPartidas.on('click', '.btn-ver-detalles', function () {
        const tarjeta = $(this).closest('.tarjeta-partida');
        const detalles = tarjeta.find('.detalles-adicionales');
    
        if (detalles.css('display') === 'none') {
            detalles.slideDown();
            $(this).text('Ver menos detalles');
        } else {
            detalles.slideUp();
            $(this).text('Ver más detalles');
        }
    });
});
