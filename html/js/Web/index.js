document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES DE ESTADO ---
    let asociaciones = [];
    let categorias = [];
    let etiquetas = [];

    // --- ELEMENTOS DEL DOM ---
    const galeria = document.getElementById('galeria-asociaciones');
    const selectCategoria = document.getElementById('filtro-categoria');
    const selectEtiqueta = document.getElementById('filtro-etiqueta');
    const selectProvincia = document.getElementById('filtro-provincia');
    const selectComunidad = document.getElementById('filtro-comunidad');
    const selectPais = document.getElementById('filtro-pais');
    const btnLimpiar = document.getElementById('btn-limpiar-filtros');
    const btnLogout = document.getElementById('btn-logout');

    // --- AUTENTICACIÓN Y VISTAS ---
    const token = localStorage.getItem('adminToken');
    if (token) {
        document.querySelectorAll('.req-admin').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.req-publico').forEach(el => el.style.display = 'none');
    } else {
        document.querySelectorAll('.req-admin').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.req-publico').forEach(el => el.style.display = 'block');
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.reload();
        });
    }

    // --- INYECCIÓN DINÁMICA DEL BUSCADOR DE NOMBRE/SIGLAS ---
    const filtrosContainer = document.getElementById('filtros-container');
    let inputBuscar = null;
    if (filtrosContainer) {
        const searchGroup = document.createElement('div');
        searchGroup.className = 'form-group grupo-buscador';
        searchGroup.innerHTML = `
            <label for="buscar-nombre">Buscar por Nombre o Siglas:</label>
            <input type="text" id="buscar-nombre" class="caja-buscador" placeholder="Ej: AECC o Cáncer">
        `;
        filtrosContainer.insertBefore(searchGroup, filtrosContainer.firstChild);
        inputBuscar = document.getElementById('buscar-nombre');
    }

    // --- UTILERÍAS DE SEGURIDAD (MITIGACIÓN XSS) ---
    function safeUrl(url) {
        if (!url) return '';
        const cleanUrl = url.trim();
        if (cleanUrl.toLowerCase().startsWith('javascript:')) {
            console.warn('URL bloqueada por seguridad (intento de inyección javascript:):', cleanUrl);
            return '';
        }
        return cleanUrl;
    }

    // --- OPERACIONES DE DATOS (API) ---
    async function cargarDatos() {
        try {
            const [resAsoc, resCat, resEti] = await Promise.all([
                fetch('/api/asociaciones').then(r => r.json()),
                fetch('/api/categorias').then(r => r.json()),
                fetch('/api/etiquetas').then(r => r.json())
            ]);

            asociaciones = resAsoc || [];
            categorias = resCat || [];
            etiquetas = resEti || [];

            llenarFiltros();
            renderizarTarjetas();
        } catch (error) {
            console.error('Error al cargar datos de la API:', error);
            galeria.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--color-peligro); font-weight: bold;">Error al conectar con el servidor.</p>';
        }
    }

    // --- RELLENO DE FILTROS ---
    function llenarFiltros() {
        selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
        selectEtiqueta.innerHTML = '<option value="">Todas las etiquetas</option>';

        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.nombre;
            selectCategoria.appendChild(opt);
        });

        etiquetas.forEach(eti => {
            const opt = document.createElement('option');
            opt.value = eti.id;
            opt.textContent = eti.nombre;
            selectEtiqueta.appendChild(opt);
        });

        // --- Rellenar filtros de ubicación dinámicamente desde los datos ---
        const provinciasSet = new Set();
        const comunidadesSet = new Set();
        const paisesSet = new Set();

        asociaciones.forEach(asoc => {
            const ubi = asoc.ubicacion;
            if (!ubi) return;
            if (ubi.provincia && ubi.provincia.trim()) provinciasSet.add(ubi.provincia.trim());
            if (ubi.comunidad && ubi.comunidad.trim()) comunidadesSet.add(ubi.comunidad.trim());
            if (ubi.pais && ubi.pais.trim()) paisesSet.add(ubi.pais.trim());
        });

        if (selectProvincia) {
            selectProvincia.innerHTML = '<option value="">Todas las provincias</option>';
            [...provinciasSet].sort().forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                selectProvincia.appendChild(opt);
            });
            // Ocultar si no hay provincias registradas
            selectProvincia.closest('.form-group').style.display = provinciasSet.size > 0 ? '' : 'none';
        }

        if (selectComunidad) {
            selectComunidad.innerHTML = '<option value="">Todas las comunidades</option>';
            [...comunidadesSet].sort().forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                selectComunidad.appendChild(opt);
            });
            selectComunidad.closest('.form-group').style.display = comunidadesSet.size > 0 ? '' : 'none';
        }

        if (selectPais) {
            selectPais.innerHTML = '<option value="">Todos los países</option>';
            [...paisesSet].sort().forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                selectPais.appendChild(opt);
            });
            selectPais.closest('.form-group').style.display = paisesSet.size > 0 ? '' : 'none';
        }
    }

    // --- RENDERIZADO SEGURO DE TARJETAS (PREVENCIÓN XSS) ---
    function renderizarTarjetas() {
        galeria.innerHTML = '';

        const filtroCat = selectCategoria.value;
        const filtroEti = selectEtiqueta.value;
        const filtroProvincia = selectProvincia ? selectProvincia.value : '';
        const filtroComunidad = selectComunidad ? selectComunidad.value : '';
        const filtroPais = selectPais ? selectPais.value : '';
        const textoBusqueda = inputBuscar ? inputBuscar.value.toLowerCase().trim() : '';

        const filtradas = asociaciones.filter(asoc => {
            const coincideCat = !filtroCat || asoc.categoria === filtroCat;
            const coincideEti = !filtroEti || (asoc.etiquetas && asoc.etiquetas.includes(filtroEti));
            const coincideTexto = !textoBusqueda || 
                asoc.nombre_asociacion.toLowerCase().includes(textoBusqueda) || 
                asoc.siglas.toLowerCase().includes(textoBusqueda);

            const ubi = asoc.ubicacion || {};
            const coincideProvincia = !filtroProvincia || 
                (ubi.provincia && ubi.provincia.trim().toLowerCase() === filtroProvincia.toLowerCase());
            const coincideComunidad = !filtroComunidad || 
                (ubi.comunidad && ubi.comunidad.trim().toLowerCase() === filtroComunidad.toLowerCase());
            const coincidePais = !filtroPais || 
                (ubi.pais && ubi.pais.trim().toLowerCase() === filtroPais.toLowerCase());
            
            return coincideCat && coincideEti && coincideTexto && coincideProvincia && coincideComunidad && coincidePais;
        });

        if (filtradas.length === 0) {
            const sinResultados = document.createElement('p');
            sinResultados.style.cssText = 'grid-column: 1/-1; text-align: center; color: #888; margin-top: 2rem;';
            sinResultados.textContent = 'No se encontraron asociaciones con los filtros seleccionados.';
            galeria.appendChild(sinResultados);
            return;
        }

        filtradas.forEach(asoc => {
            const card = document.createElement('article');
            card.className = 'tarjeta';
            card.setAttribute('data-id', asoc.id);

            const img = document.createElement('img');
            img.src = safeUrl(asoc.logo) || 'img/Sanidad, presidencia y emergencias (5) (1).jpeg';
            img.alt = `Logo de ${asoc.nombre_asociacion}`;
            img.onerror = () => {
                img.src = 'img/Sanidad, presidencia y emergencias (5) (1).jpeg';
            };

            const h3 = document.createElement('h3');
            h3.textContent = asoc.nombre_asociacion;

            const divSiglas = document.createElement('div');
            divSiglas.className = 'insignia-filtro';
            divSiglas.textContent = asoc.siglas;

            // Contenedor de Etiquetas Múltiples en la tarjeta (siempre se añade y tiene min-height)
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'contenedor-tags-tarjeta';
            if (asoc.etiquetas && asoc.etiquetas.length > 0) {
                asoc.etiquetas.forEach(etiId => {
                    const etiObj = etiquetas.find(e => e.id === etiId);
                    if (etiObj) {
                        const tagSpan = document.createElement('span');
                        tagSpan.className = 'badge-tag-tarjeta';
                        tagSpan.textContent = etiObj.nombre;
                        tagsDiv.appendChild(tagSpan);
                    }
                });
            } else {
                // Relleno invisible para conservar la perfecta alineación horizontal
                const tagSpanSpacer = document.createElement('span');
                tagSpanSpacer.className = 'badge-tag-tarjeta';
                tagSpanSpacer.style.visibility = 'hidden';
                tagSpanSpacer.innerHTML = '&nbsp;';
                tagsDiv.appendChild(tagSpanSpacer);
            }

            const btnVer = document.createElement('button');
            btnVer.className = 'btn-ver-detalles-tarjeta';
            btnVer.textContent = 'Ver Detalles';

            card.appendChild(img);
            card.appendChild(h3);
            card.appendChild(divSiglas);
            card.appendChild(tagsDiv);

            // Mostrar ubicación en la tarjeta (siempre se añade para conservar nivelación)
            const ubi = asoc.ubicacion;
            const ubiDiv = document.createElement('div');
            ubiDiv.className = 'ubicacion-tarjeta';
            if (ubi && (ubi.provincia || ubi.municipio || ubi.comunidad || ubi.pais)) {
                const partes = [ubi.municipio, ubi.provincia, ubi.comunidad, ubi.pais].filter(Boolean);
                ubiDiv.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;flex-shrink:0;color:var(--color-primario);">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span>${partes.join(' · ')}</span>
                `;
            } else {
                // Relleno invisible para conservar la alineación horizontal de los botones
                ubiDiv.innerHTML = '&nbsp;';
                ubiDiv.classList.add('vacia');
            }
            card.appendChild(ubiDiv);
            card.appendChild(btnVer);

            // REDIRECCIÓN A PÁGINA DE DETALLE DEDICADA
            card.addEventListener('click', () => {
                window.location.href = `detalle.html?id=${asoc.id}`;
            });

            galeria.appendChild(card);
        });
    }

    // --- GESTIONAR FILTROS Y EVENTOS ---
    selectCategoria.addEventListener('change', renderizarTarjetas);
    selectEtiqueta.addEventListener('change', renderizarTarjetas);
    if (selectProvincia) selectProvincia.addEventListener('change', renderizarTarjetas);
    if (selectComunidad) selectComunidad.addEventListener('change', renderizarTarjetas);
    if (selectPais) selectPais.addEventListener('change', renderizarTarjetas);
    if (inputBuscar) {
        inputBuscar.addEventListener('input', renderizarTarjetas);
    }

    btnLimpiar.addEventListener('click', () => {
        selectCategoria.value = '';
        selectEtiqueta.value = '';
        if (selectProvincia) selectProvincia.value = '';
        if (selectComunidad) selectComunidad.value = '';
        if (selectPais) selectPais.value = '';
        if (inputBuscar) inputBuscar.value = '';
        renderizarTarjetas();
    });

    // --- APLICAR CONFIGURACIÓN DE FONDO GLOBAL ---
    async function aplicarFondoGlobal() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                if (config && config.fondo) {
                    document.body.style.backgroundImage = `linear-gradient(135deg, rgba(255, 255, 255, 0.90) 0%, rgba(244, 246, 248, 0.92) 100%), url('/html/img/fondos/${config.fondo}')`;
                    document.body.style.backgroundSize = 'cover';
                    document.body.style.backgroundAttachment = 'fixed';
                    document.body.style.backgroundPosition = 'center';
                }
            }
        } catch (error) {
            console.error("Error al cargar la configuración de fondo:", error);
        }
    }
    aplicarFondoGlobal();

    // --- CARGA DE DATOS INICIAL ---
    cargarDatos();
});