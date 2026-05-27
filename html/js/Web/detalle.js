document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES DE ESTADO ---
    let asociaciones = [];
    let categorias = [];
    let etiquetas = [];
    let asociacionSeleccionada = null;
    let idAsociacion = null;

    // --- ELEMENTOS DEL DOM ---
    const btnLogout = document.getElementById('btn-logout');
    const detalleLogo = document.getElementById('detalle-logo');
    const detalleNombre = document.getElementById('detalle-nombre');
    const detalleSiglas = document.getElementById('detalle-siglas');
    const detalleCategoria = document.getElementById('detalle-categoria');
    const detalleEtiquetas = document.getElementById('detalle-etiquetas');
    const detalleDesc = document.getElementById('detalle-desc');
    const detalleContactos = document.getElementById('detalle-contactos-container');
    const detalleServicios = document.getElementById('detalle-servicios');
    const contenedorBorrado = document.getElementById('contenedor-borrado');
    const btnModificar = document.getElementById('btn-modificar-entrada');
    const btnEliminar = document.getElementById('btn-eliminar-entrada');

    // --- ICONOS VECTORIALES (FAVICONS INTEGRADOS - OFFLINE-SAFE) ---
    const iconSVG = {
        x: `<svg class="icono-svg-detalle" style="color:#1d1e20;" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
        instagram: `<svg class="icono-svg-detalle" style="color:#e1306c;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
        facebook: `<svg class="icono-svg-detalle" style="color:#1877f2;" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
        tiktok: `<svg class="icono-svg-detalle" style="color:#010101;" viewBox="0 0 24 24" fill="currentColor"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.52-4.06-1.39v7.7c-.03 2.1-.88 4.2-2.58 5.48a7.07 7.07 0 01-8.58.46c-2.3-1.61-3.48-4.61-2.9-7.36.42-2.3 2.22-4.22 4.53-4.73 1.56-.37 3.25-.09 4.62.67v4.03a3.02 3.02 0 00-2.48-.34c-.88.19-1.74.83-2.12 1.65a3.02 3.02 0 00.32 3.28c.67.84 1.83 1.25 2.87 1.03 1.12-.21 2.05-1.22 2.11-2.36-.02-2.13-.01-4.26-.01-6.39.02-4.38.01-8.77.01-13.15z"/></svg>`,
        email: `<svg class="icono-svg-detalle" style="color:var(--color-primario);" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
        linkedin: `<svg class="icono-svg-detalle" style="color:#0a66c2;" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`,
        web: `<svg class="icono-svg-detalle" style="color:var(--color-primario);" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/></svg>`,
        telefono: `<svg class="icono-svg-detalle" style="color:var(--color-primario);" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`,
        otro: `<svg class="icono-svg-detalle" style="color:var(--color-primario);" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`
    };

    // --- AUTENTICACIÓN Y VISTAS DE BARRA NAVEGACIÓN ---
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
            window.location.href = 'index.html';
        });
    }

    // --- LEER ID DE LA URL ---
    const urlParams = new URLSearchParams(window.location.search);
    idAsociacion = urlParams.get('id');

    if (!idAsociacion) {
        alert("ID de asociación no proporcionado.");
        window.location.href = 'index.html';
        return;
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

            asociacionSeleccionada = asociaciones.find(a => String(a.id) === String(idAsociacion));

            if (!asociacionSeleccionada) {
                alert("Asociación no encontrada.");
                window.location.href = 'index.html';
                return;
            }

            renderizarDetalles();
        } catch (error) {
            console.error('Error al cargar datos en la vista de detalle:', error);
            alert("Error al conectar con el servidor.");
            window.location.href = 'index.html';
        }
    }

    // --- RENDERIZADO SEGURO DE DETALLES ---
    function renderizarDetalles() {
        const asoc = asociacionSeleccionada;

        // Cargar logo con fallback
        detalleLogo.src = safeUrl(asoc.logo) || 'img/Sanidad, presidencia y emergencias (5) (1).jpeg';
        detalleLogo.alt = `Logo de ${asoc.nombre_asociacion}`;
        detalleLogo.onerror = () => {
            detalleLogo.src = 'img/Sanidad, presidencia y emergencias (5) (1).jpeg';
        };

        // Textos directos seguros
        detalleNombre.textContent = asoc.nombre_asociacion;
        detalleSiglas.textContent = asoc.siglas;
        detalleDesc.textContent = asoc.descripcion;
        detalleServicios.textContent = asoc.cartera_servicios;

        // Resolver Categoría
        const catObj = categorias.find(c => c.id === asoc.categoria);
        detalleCategoria.textContent = catObj ? catObj.nombre : 'No especificada';

        // Renderizar Ubicación Geográfica
        const detalleUbicacion = document.getElementById('detalle-ubicacion');
        if (detalleUbicacion) {
            const ubi = asoc.ubicacion;
            if (ubi && (ubi.pais || ubi.comunidad || ubi.provincia || ubi.municipio)) {
                const partes = [ubi.municipio, ubi.provincia, ubi.comunidad, ubi.pais].filter(Boolean);
                detalleUbicacion.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;vertical-align:middle;margin-right:5px;color:var(--color-primario);flex-shrink:0;">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    ${partes.join(' &middot; ')}
                `;
                detalleUbicacion.style.display = 'flex';
                detalleUbicacion.style.alignItems = 'center';
            } else {
                detalleUbicacion.style.display = 'none';
            }
        }

        // Resolver Etiquetas Múltiples como insignias
        detalleEtiquetas.innerHTML = '';
        if (asoc.etiquetas && asoc.etiquetas.length > 0) {
            asoc.etiquetas.forEach(etiId => {
                const etiObj = etiquetas.find(e => e.id === etiId);
                if (etiObj) {
                    const badge = document.createElement('span');
                    badge.className = 'badge-tag-detalle';
                    badge.textContent = etiObj.nombre;
                    detalleEtiquetas.appendChild(badge);
                }
            });
        } else {
            detalleEtiquetas.textContent = 'Ninguna';
        }

        // Renderizado Seguro de Contactos con favicons integrados
        detalleContactos.innerHTML = '';
        if (asoc.contactos && asoc.contactos.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'lista-contactos';

            asoc.contactos.forEach(contacto => {
                const li = document.createElement('li');
                li.className = 'item-contacto-detalle';
                
                // Mapear icono vectorial seguro (Favicon)
                const cleanTipo = contacto.tipo.toLowerCase().trim();
                const svgMarkup = iconSVG[cleanTipo] || iconSVG['otro'];
                
                // Inyectar el icono en una caja protectora
                const iconSpan = document.createElement('span');
                iconSpan.innerHTML = svgMarkup;
                li.appendChild(iconSpan);

                // Tipo de contacto en texto
                const strong = document.createElement('strong');
                strong.textContent = `${contacto.tipo.charAt(0).toUpperCase() + contacto.tipo.slice(1)}: `;
                strong.style.marginRight = '6px';
                li.appendChild(strong);

                // Enlace o texto con su validación XSS correspondientes
                const cleanVal = contacto.valor.trim();
                if (cleanTipo === 'email') {
                    const a = document.createElement('a');
                    a.href = `mailto:${encodeURIComponent(cleanVal)}`;
                    a.textContent = cleanVal;
                    li.appendChild(a);
                } else if (['web', 'linkedin', 'facebook', 'instagram', 'x', 'tiktok'].includes(cleanTipo) || cleanVal.startsWith('http://') || cleanVal.startsWith('https://')) {
                    const a = document.createElement('a');
                    a.href = safeUrl(cleanVal);
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.textContent = cleanVal;
                    li.appendChild(a);
                } else {
                    const spanVal = document.createElement('span');
                    spanVal.textContent = cleanVal;
                    li.appendChild(spanVal);
                }
                
                ul.appendChild(li);
            });
            detalleContactos.appendChild(ul);
        } else {
            const sinContacto = document.createElement('p');
            sinContacto.style.fontStyle = 'italic';
            sinContacto.textContent = 'Sin información de contacto disponible.';
            detalleContactos.appendChild(sinContacto);
        }

        // Mostrar botones de administración si está autenticado
        if (token) {
            contenedorBorrado.style.display = 'block';
        } else {
            contenedorBorrado.style.display = 'none';
        }

        // Renderizar Galería de Vídeos de YouTube
        const galeriaVideos = document.getElementById('detalle-galeria-videos');
        const videosGrid = document.getElementById('detalle-videos-grid');
        if (galeriaVideos && videosGrid && asoc.videos && asoc.videos.length > 0) {
            videosGrid.innerHTML = '';
            asoc.videos.forEach(videoUrl => {
                const videoId = extraerYouTubeId(videoUrl);
                if (!videoId) return;
                const wrapper = document.createElement('div');
                wrapper.className = 'video-youtube-wrapper';
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${videoId}`;
                iframe.title = 'Vídeo de YouTube';
                iframe.frameBorder = '0';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.allowFullscreen = true;
                iframe.loading = 'lazy';
                wrapper.appendChild(iframe);
                videosGrid.appendChild(wrapper);
            });
            galeriaVideos.style.display = asoc.videos.filter(v => extraerYouTubeId(v)).length > 0 ? 'block' : 'none';
        } else if (galeriaVideos) {
            galeriaVideos.style.display = 'none';
        }
    }

    // Extrae el ID de un vídeo YouTube de múltiples formatos de URL
    function extraerYouTubeId(url) {
        if (!url) return null;
        const str = url.trim();
        // Formato ID directo (11 caracteres alfanuméricos)
        if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
        // Formatos de URL estándar
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
        ];
        for (const pattern of patterns) {
            const match = str.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    // --- ACCIONES DE GESTIÓN ADMINISTRATIVA ---

    if (btnModificar) {
        btnModificar.addEventListener('click', () => {
            if (asociacionSeleccionada) {
                window.location.href = `crearEntrada.html?id=${asociacionSeleccionada.id}`;
            }
        });
    }

    if (btnEliminar) {
        btnEliminar.addEventListener('click', async () => {
            if (!asociacionSeleccionada) return;

            const confirmacion = confirm(`¿Estás seguro de que deseas eliminar permanentemente la asociación "${asociacionSeleccionada.nombre_asociacion}"?`);
            if (!confirmacion) return;

            try {
                const response = await fetch(`/api/asociaciones/${asociacionSeleccionada.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    alert('Sesión expirada o inválida. Inicia sesión de nuevo.');
                    localStorage.removeItem('adminToken');
                    window.location.href = 'login.html';
                    return;
                }

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || 'Error al eliminar');
                }

                alert('Asociación eliminada correctamente.');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error al eliminar asociación:', error);
                alert('No se pudo eliminar el registro. Inténtalo de nuevo.');
            }
        });
    }

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

    // --- INICIALIZAR ---
    cargarDatos();
});
