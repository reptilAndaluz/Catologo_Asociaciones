document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES DE ESTADO ---
    let editMode = false;
    let editId = null;
    let categorias = [];
    let etiquetas = [];
    let asociacionEditar = null;

    // --- AUTENTICACIÓN ---
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert("Sesión no encontrada o inválida. Inicia sesión.");
        window.location.href = 'login.html';
        return;
    }

    // --- ELEMENTOS DEL DOM ---
    const form = document.getElementById('form-entrada');
    const tituloPagina = document.getElementById('titulo-pagina');
    const selectCategoria = document.getElementById('categoria');
    const inputNuevaCat = document.getElementById('nueva_categoria_input');
    const inputEtiquetaName = document.getElementById('etiqueta');
    const datalistEtiquetas = document.getElementById('lista-etiquetas');
    const contactosContainer = document.getElementById('contactos-container');
    const btnAddContacto = document.getElementById('btn-add-contacto');
    const videosContainer = document.getElementById('videos-container');
    const btnAddVideo = document.getElementById('btn-add-video');

    // Estado del logo subido
    let logoUploadedUrl = '';

    // --- RECOGER PARÁMETROS URL ---
    const urlParams = new URLSearchParams(window.location.search);
    editId = urlParams.get('id');
    if (editId) {
        editMode = true;
        tituloPagina.textContent = "Modificar Asociación";
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = "Guardar Cambios";
    }

    // --- FUNCIONES AUXILIARES API ---
    async function apiRequest(url, method = 'GET', body = null) {
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            method,
            headers
        };
        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(url, config);

        if (response.status === 401) {
            alert("Tu sesión ha expirado.");
            localStorage.removeItem('adminToken');
            window.location.href = 'login.html';
            return null;
        }

        if (!response.ok) {
            let errorMsg = 'Error en la petición de API';
            try {
                const err = await response.json();
                if (err.detail) {
                    if (typeof err.detail === 'string') {
                        errorMsg = err.detail;
                    } else if (Array.isArray(err.detail)) {
                        errorMsg = err.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n');
                    } else {
                        errorMsg = JSON.stringify(err.detail);
                    }
                }
            } catch (e) {
                // No es JSON o no tiene detail
            }
            throw new Error(errorMsg);
        }

        return await response.json();
    }

    function crearFilaContacto(tipo = 'x', valor = '') {
        const row = document.createElement('div');
        row.className = 'row contacto-item';
        
        const standardTypes = ['x', 'instagram', 'facebook', 'tiktok'];
        const isCustom = !standardTypes.includes(tipo.toLowerCase().trim());
        const selectedTipo = isCustom ? 'otro' : tipo.toLowerCase().trim();
        const customValue = isCustom ? tipo : '';
        
        row.innerHTML = `
            <select name="tipo_contacto[]" class="select-contacto" required>
                <option value="x" ${selectedTipo === 'x' ? 'selected' : ''}>X (Twitter)</option>
                <option value="instagram" ${selectedTipo === 'instagram' ? 'selected' : ''}>Instagram</option>
                <option value="facebook" ${selectedTipo === 'facebook' ? 'selected' : ''}>Facebook</option>
                <option value="tiktok" ${selectedTipo === 'tiktok' ? 'selected' : ''}>TikTok</option>
                <option value="otro" ${selectedTipo === 'otro' ? 'selected' : ''}>Otro...</option>
            </select>
            <input type="text" name="otro_tipo_contacto[]" value="${escapeHTML(customValue)}" class="input-custom-contacto" style="display: ${isCustom ? 'block' : 'none'};" ${isCustom ? 'required' : ''} placeholder="Nombre red/medio">
            <input type="text" name="valor_contacto[]" value="${escapeHTML(valor)}" class="input-valor-contacto ${isCustom ? 'con-custom' : ''}" required placeholder="Valor/Enlace">
            <button type="button" class="btn-eliminar-contacto">X</button>
        `;

        const select = row.querySelector('select[name="tipo_contacto[]"]');
        const customInput = row.querySelector('input[name="otro_tipo_contacto[]"]');
        const valueInput = row.querySelector('input[name="valor_contacto[]"]');
        
        select.addEventListener('change', () => {
            if (select.value === 'otro') {
                customInput.style.display = 'block';
                customInput.required = true;
                customInput.focus();
                valueInput.classList.add('con-custom');
            } else {
                customInput.style.display = 'none';
                customInput.required = false;
                customInput.value = '';
                valueInput.classList.remove('con-custom');
            }
        });

        // Botón de eliminar contacto individual
        row.querySelector('.btn-eliminar-contacto').addEventListener('click', () => {
            row.remove();
        });

        return row;
    }

    // Escapar caracteres para HTML seguro en inputs
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    if (btnAddContacto) {
        btnAddContacto.addEventListener('click', () => {
            contactosContainer.appendChild(crearFilaContacto());
        });
    }

    // --- TABS DE LOGO (URL / SUBIR IMAGEN) ---
    function inicializarLogoTabs() {
        const tabUrl = document.getElementById('logo-tab-url');
        const tabUpload = document.getElementById('logo-tab-upload');
        const panelUrl = document.getElementById('logo-panel-url');
        const panelUpload = document.getElementById('logo-panel-upload');
        const uploadArea = document.getElementById('upload-logo-area');
        const fileInput = document.getElementById('input-logo-file');
        const previewDiv = document.getElementById('logo-upload-preview');
        const previewImg = document.getElementById('logo-preview-img');
        const previewNombre = document.getElementById('logo-preview-nombre');
        const btnQuitarImg = document.getElementById('btn-quitar-logo-img');
        const statusDiv = document.getElementById('logo-upload-status');

        if (!tabUrl || !tabUpload) return;

        function switchTab(tab) {
            if (tab === 'url') {
                tabUrl.classList.add('activo');
                tabUpload.classList.remove('activo');
                panelUrl.style.display = 'block';
                panelUpload.style.display = 'none';
            } else {
                tabUrl.classList.remove('activo');
                tabUpload.classList.add('activo');
                panelUrl.style.display = 'none';
                panelUpload.style.display = 'block';
            }
        }

        tabUrl.addEventListener('click', () => switchTab('url'));
        tabUpload.addEventListener('click', () => switchTab('upload'));

        // Click en zona de upload abre el selector de archivos
        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput.click());
            // Drag & Drop
            uploadArea.addEventListener('dragover', e => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            ['dragleave', 'dragend'].forEach(t => {
                uploadArea.addEventListener(t, () => uploadArea.classList.remove('drag-over'));
            });
            uploadArea.addEventListener('drop', e => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) procesarArchivoLogo(e.dataTransfer.files[0]);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) procesarArchivoLogo(fileInput.files[0]);
            });
        }

        if (btnQuitarImg) {
            btnQuitarImg.addEventListener('click', () => {
                logoUploadedUrl = '';
                previewDiv.style.display = 'none';
                uploadArea.style.display = 'flex';
                if (fileInput) fileInput.value = '';
                statusDiv.style.display = 'none';
            });
        }

        async function procesarArchivoLogo(file) {
            const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (!allowed.includes(ext)) {
                mostrarEstadoLogo(false, 'Tipo de archivo no válido. Usa JPG, PNG, WEBP, SVG o GIF.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                mostrarEstadoLogo(false, 'El archivo es demasiado grande. Máximo 5 MB.');
                return;
            }

            mostrarEstadoLogo(null, 'Subiendo imagen...');

            // Mostrar preview local inmediato
            const reader = new FileReader();
            reader.onload = (ev) => {
                previewImg.src = ev.target.result;
                previewNombre.textContent = file.name;
                previewDiv.style.display = 'flex';
                uploadArea.style.display = 'none';
            };
            reader.readAsDataURL(file);

            // Subir al servidor
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/upload-logo', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || 'Error al subir la imagen');
                }
                const data = await response.json();
                logoUploadedUrl = data.url;
                mostrarEstadoLogo(true, '\u2713 Imagen subida correctamente');
            } catch (error) {
                logoUploadedUrl = '';
                mostrarEstadoLogo(false, `Error: ${error.message}`);
            }
        }

        function mostrarEstadoLogo(exito, mensaje) {
            statusDiv.style.display = 'block';
            if (exito === true) {
                statusDiv.style.color = 'var(--color-primario)';
            } else if (exito === false) {
                statusDiv.style.color = 'var(--color-peligro)';
            } else {
                statusDiv.style.color = 'var(--color-texto)';
            }
            statusDiv.textContent = mensaje;
        }
    }

    // --- GESTIÓN DE VÍDEOS DE YOUTUBE ---
    function crearFilaVideo(url = '') {
        const row = document.createElement('div');
        row.className = 'video-input-row';
        row.innerHTML = `
            <div class="video-input-icono">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#FF0000;">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            </div>
            <input type="text" class="input-video-youtube" placeholder="Pega la URL de YouTube o el ID del v\u00eddeo" value="${escapeHTML(url)}">
            <button type="button" class="btn-eliminar-video">✕</button>
        `;
        row.querySelector('.btn-eliminar-video').addEventListener('click', () => row.remove());
        return row;
    }

    function obtenerVideosFormulario() {
        const filas = document.querySelectorAll('.input-video-youtube');
        const videos = [];
        filas.forEach(input => {
            const val = input.value.trim();
            if (val) videos.push(val);
        });
        return videos;
    }

    if (btnAddVideo) {
        btnAddVideo.addEventListener('click', () => {
            if (videosContainer) videosContainer.appendChild(crearFilaVideo());
        });
    }

    // --- CATEGORÍA INLINE Y BORRADO ---
    if (selectCategoria) {
        selectCategoria.addEventListener('change', () => {
            if (selectCategoria.value === 'nueva_categoria') {
                inputNuevaCat.style.display = 'block';
                inputNuevaCat.required = true;
                inputNuevaCat.focus();
            } else {
                inputNuevaCat.style.display = 'none';
                inputNuevaCat.required = false;
                inputNuevaCat.value = '';
            }
        });
    }

    // --- CARGA INICIAL DE DATOS ---
    async function inicializarFormulario() {
        try {
            // Cargar categorías y etiquetas de apoyo
            const [catList, etiList] = await Promise.all([
                apiRequest('/api/categorias'),
                apiRequest('/api/etiquetas')
            ]);

            categorias = catList || [];
            etiquetas = etiList || [];

            // Poblar dropdown de categorías
            categorias.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.nombre;
                // Insertar antes del botón de "+ Crear nueva..." que está en index 1
                selectCategoria.insertBefore(opt, selectCategoria.lastElementChild);
            });

            // Poblar autocompletado de etiquetas
            etiquetas.forEach(eti => {
                const opt = document.createElement('option');
                opt.value = eti.nombre;
                datalistEtiquetas.appendChild(opt);
            });

            // Si estamos en Modo Edición, cargar la asociación
            if (editMode) {
                const asociacionesList = await apiRequest('/api/asociaciones');
                asociacionEditar = asociacionesList.find(a => String(a.id) === String(editId));

                if (!asociacionEditar) {
                    alert("No se encontró la asociación solicitada.");
                    window.location.href = 'index.html';
                    return;
                }

                // Rellenar datos
                document.getElementById('nombre_asociacion').value = asociacionEditar.nombre_asociacion;
                document.getElementById('siglas').value = asociacionEditar.siglas;
                // Si el logo es una URL del servidor propio, mostrar en tab 'subir'
                const logoVal = asociacionEditar.logo || '';
                if (logoVal.startsWith('/html/img/logos/')) {
                    logoUploadedUrl = logoVal;
                    const tabUploadBtn = document.getElementById('logo-tab-upload');
                    if (tabUploadBtn) tabUploadBtn.click();
                    const previewImg = document.getElementById('logo-preview-img');
                    const previewNombre = document.getElementById('logo-preview-nombre');
                    const previewDiv = document.getElementById('logo-upload-preview');
                    const uploadArea = document.getElementById('upload-logo-area');
                    if (previewImg) previewImg.src = logoVal;
                    if (previewNombre) previewNombre.textContent = logoVal.split('/').pop();
                    if (previewDiv) previewDiv.style.display = 'flex';
                    if (uploadArea) uploadArea.style.display = 'none';
                } else {
                    document.getElementById('logo').value = logoVal;
                }
                document.getElementById('descripcion').value = asociacionEditar.descripcion;
                document.getElementById('cartera_servicios').value = asociacionEditar.cartera_servicios;

                // Cargar datos de ubicación si existen
                const ubi = asociacionEditar.ubicacion || {};
                const ubiPais = document.getElementById('ubi_pais');
                const ubiComunidad = document.getElementById('ubi_comunidad');
                const ubiProvincia = document.getElementById('ubi_provincia');
                const ubiMunicipio = document.getElementById('ubi_municipio');
                if (ubiPais) ubiPais.value = ubi.pais || '';
                if (ubiComunidad) ubiComunidad.value = ubi.comunidad || '';
                if (ubiProvincia) ubiProvincia.value = ubi.provincia || '';
                if (ubiMunicipio) ubiMunicipio.value = ubi.municipio || '';

                // Seleccionar Categoría
                selectCategoria.value = asociacionEditar.categoria;
                selectCategoria.dispatchEvent(new Event('change'));

                // Cargar vídeos de YouTube existentes
                if (videosContainer && asociacionEditar.videos && asociacionEditar.videos.length > 0) {
                    videosContainer.innerHTML = '';
                    asociacionEditar.videos.forEach(videoUrl => {
                        videosContainer.appendChild(crearFilaVideo(videoUrl));
                    });
                }

                // Seleccionar Etiquetas (cargar sus nombres legibles separados por comas)
                if (asociacionEditar.etiquetas && asociacionEditar.etiquetas.length > 0) {
                    const tagNames = asociacionEditar.etiquetas.map(etiId => {
                        const tagObj = etiquetas.find(e => e.id === etiId);
                        return tagObj ? tagObj.nombre : '';
                    }).filter(name => name !== '');
                    inputEtiquetaName.value = tagNames.join(', ');
                } else {
                    inputEtiquetaName.value = '';
                }

                // Poblar contactos
                contactosContainer.innerHTML = '';
                if (asociacionEditar.contactos && asociacionEditar.contactos.length > 0) {
                    asociacionEditar.contactos.forEach(contacto => {
                        contactosContainer.appendChild(crearFilaContacto(contacto.tipo, contacto.valor));
                    });
                } else {
                    contactosContainer.appendChild(crearFilaContacto());
                }
            } else {
                // Modo creación: inicializar con un contacto vacío
                contactosContainer.innerHTML = '';
                contactosContainer.appendChild(crearFilaContacto());
            }

            // Cargar y mostrar la cuadrícula de gestión de categorías
            await renderGestionCategorias();

        } catch (error) {
            console.error("Error al cargar dependencias del formulario:", error);
            alert("No se pudieron cargar las categorías o etiquetas del servidor.");
        }
    }

    // --- GESTIÓN DE CATEGORÍAS EN LISTADO ERGONÓMICO ---
    async function renderGestionCategorias() {
        const listDiv = document.getElementById('lista-categorias-gestion');
        if (!listDiv) return;

        try {
            // Obtener asociaciones y categorías
            const [asocs, catList] = await Promise.all([
                apiRequest('/api/asociaciones'),
                apiRequest('/api/categorias')
            ]);

            categorias = catList || [];

            // Re-poblar el dropdown de categorías en el formulario para sincronizar cambios
            while (selectCategoria.options.length > 2) {
                selectCategoria.remove(1);
            }
            categorias.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.nombre;
                selectCategoria.insertBefore(opt, selectCategoria.lastElementChild);
            });

            listDiv.innerHTML = '';

            if (categorias.length === 0) {
                listDiv.innerHTML = '<p style="color:#888; text-align:center; padding:1.5rem 0; grid-column:1/-1;">No hay categorías registradas.</p>';
                return;
            }

            categorias.forEach(cat => {
                const count = asocs ? asocs.filter(a => String(a.categoria) === String(cat.id)).length : 0;

                const card = document.createElement('div');
                card.className = 'tarjeta-categoria-gestion';

                const info = document.createElement('div');
                info.className = 'categoria-info';

                const nombreSpan = document.createElement('span');
                nombreSpan.className = 'categoria-nombre';
                nombreSpan.textContent = cat.nombre;

                const contadorSpan = document.createElement('span');
                contadorSpan.className = 'categoria-contador';
                contadorSpan.textContent = count === 1 ? '1 asociación vinculada' : `${count} asociaciones vinculadas`;

                info.appendChild(nombreSpan);
                info.appendChild(contadorSpan);

                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'btn-eliminar-categoria-list';
                deleteBtn.innerHTML = '✕';

                if (count > 0) {
                    deleteBtn.disabled = true;
                    deleteBtn.title = `No se puede eliminar la categoría porque está asignada a ${count} asociación/es.`;
                } else {
                    deleteBtn.title = 'Eliminar categoría permanentemente';
                    deleteBtn.addEventListener('click', async () => {
                        if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${cat.nombre}"?`)) {
                            try {
                                const response = await apiRequest(`/api/categorias/${cat.id}`, 'DELETE');
                                if (response && response.status === 'success') {
                                    alert(`Categoría "${cat.nombre}" eliminada correctamente.`);
                                    // Volver a renderizar la lista y actualizar el selector
                                    await renderGestionCategorias();
                                } else {
                                    alert('No se pudo eliminar la categoría.');
                                }
                            } catch (err) {
                                console.error('Error al eliminar categoría:', err);
                                alert(`Error al eliminar categoría: ${err.message}`);
                            }
                        }
                    });
                }

                card.appendChild(info);
                card.appendChild(deleteBtn);
                listDiv.appendChild(card);
            });
        } catch (error) {
            console.error('Error al renderizar categorías:', error);
            listDiv.innerHTML = '<p style="color:var(--color-peligro); text-align:center; padding:1.5rem 0; grid-column:1/-1;">Error al cargar las categorías.</p>';
        }
    }

    // --- ENVÍO DE FORMULARIO CON VALIDACIONES Y CREACIONES SEGURAS ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                let categoriaId = selectCategoria.value;
                let etiquetaId = '';
                const etiquetaValue = inputEtiquetaName.value.trim();

                if (!categoriaId) {
                    alert("Debes seleccionar una categoría válida.");
                    return;
                }

                if (!etiquetaValue) {
                    alert("Debes definir una etiqueta principal.");
                    return;
                }

                // --- 1. PROCESAR CATEGORÍA INLINE ---
                if (categoriaId === 'nueva_categoria') {
                    const nuevoNombreCat = inputNuevaCat.value.trim();
                    if (!nuevoNombreCat) {
                        alert("Escribe el nombre de la nueva categoría.");
                        return;
                    }

                    // Evitar duplicación por nombre
                    const catDuplicada = categorias.find(c => c.nombre.toLowerCase() === nuevoNombreCat.toLowerCase());
                    if (catDuplicada) {
                        categoriaId = catDuplicada.id;
                    } else {
                        // Crear nueva categoría en servidor
                        const nuevaCatObj = {
                            id: `cat_${Date.now()}`,
                            nombre: nuevoNombreCat
                        };
                        const responseCat = await apiRequest('/api/categorias', 'POST', nuevaCatObj);
                        if (responseCat) {
                            categoriaId = nuevaCatObj.id;
                        } else {
                            throw new Error("No se pudo registrar la nueva categoría.");
                        }
                    }
                }

                // --- 2. PROCESAR ETIQUETAS MÚLTIPLES ---
                const tagIds = [];
                const tagNames = etiquetaValue.split(',').map(t => t.trim()).filter(t => t !== '');
                
                for (let i = 0; i < tagNames.length; i++) {
                    const rawTagName = tagNames[i];
                    const etiquetaFormateada = rawTagName.startsWith('#') ? rawTagName : `#${rawTagName}`;
                    
                    let tagObj = etiquetas.find(t => t.nombre.toLowerCase() === etiquetaFormateada.toLowerCase());
                    if (tagObj) {
                        tagIds.push(tagObj.id);
                    } else {
                        // Crear nueva etiqueta en el servidor
                        const nuevoTagId = `eti_${Date.now()}_${i}`;
                        const nuevaEtiObj = {
                            id: nuevoTagId,
                            nombre: etiquetaFormateada
                        };
                        const responseEti = await apiRequest('/api/etiquetas', 'POST', nuevaEtiObj);
                        if (responseEti) {
                            tagIds.push(nuevoTagId);
                            etiquetas.push(nuevaEtiObj);
                        } else {
                            throw new Error(`No se pudo registrar la etiqueta: ${etiquetaFormateada}`);
                        }
                    }
                }

                // --- 3. PROCESAR MÉTODOS DE CONTACTO ---
                const contactos = [];
                const filasContacto = document.querySelectorAll('.contacto-item');
                filasContacto.forEach(row => {
                    const selectVal = row.querySelector('select[name="tipo_contacto[]"]').value;
                    const customVal = row.querySelector('input[name="otro_tipo_contacto[]"]').value.trim();
                    const valor = row.querySelector('input[name="valor_contacto[]"]').value.trim();
                    
                    const tipo = selectVal === 'otro' ? customVal : selectVal;
                    
                    if (tipo && valor) {
                        contactos.push({ tipo, valor });
                    }
                });

                // --- 4. PREPARAR OBJETO ASOCIACIÓN ---
                // Determinar URL del logo final (uploaded tiene prioridad sobre campo URL)
                const logoTabActivo = document.querySelector('.logo-tab.activo');
                let logoFinal = '';
                if (logoTabActivo && logoTabActivo.dataset.tab === 'upload') {
                    logoFinal = logoUploadedUrl;
                } else {
                    logoFinal = document.getElementById('logo').value.trim();
                }

                // Construir objeto de ubicación
                const ubicacion = {
                    pais: (document.getElementById('ubi_pais')?.value || '').trim(),
                    comunidad: (document.getElementById('ubi_comunidad')?.value || '').trim(),
                    provincia: (document.getElementById('ubi_provincia')?.value || '').trim(),
                    municipio: (document.getElementById('ubi_municipio')?.value || '').trim()
                };

                const payloadAsoc = {
                    id: editMode ? asociacionEditar.id : Date.now(),
                    nombre_asociacion: document.getElementById('nombre_asociacion').value.trim(),
                    siglas: document.getElementById('siglas').value.trim(),
                    logo: logoFinal,
                    descripcion: document.getElementById('descripcion').value.trim(),
                    categoria: categoriaId,
                    etiquetas: tagIds,
                    contactos: contactos,
                    cartera_servicios: document.getElementById('cartera_servicios').value.trim(),
                    videos: obtenerVideosFormulario(),
                    ubicacion: ubicacion
                };

                // --- 5. ENVIAR CAMBIOS A LA API ---
                let responseAsoc;
                if (editMode) {
                    responseAsoc = await apiRequest(`/api/asociaciones/${editId}`, 'PUT', payloadAsoc);
                } else {
                    responseAsoc = await apiRequest('/api/asociaciones', 'POST', payloadAsoc);
                }

                if (responseAsoc) {
                    alert(editMode ? "Asociación modificada correctamente." : "Asociación registrada con éxito.");
                    window.location.href = 'index.html';
                }

            } catch (error) {
                console.error("Error al guardar la entrada:", error);
                alert(`Error al guardar: ${error.message}`);
            }
        });
    }

    // --- GESTIÓN DE GALERÍA DE FONDO GLOBAL ---
    async function inicializarGestionFondo() {
        const galeriaContenedor = document.getElementById('galeria-fondos');
        const btnGuardar = document.getElementById('btn-guardar-fondo');
        
        if (!galeriaContenedor || !btnGuardar) return;

        let fondosDisponibles = [];
        try {
            const resp = await apiRequest('/api/fondos');
            if (resp) {
                fondosDisponibles = resp;
            }
        } catch (e) {
            console.error("Error cargando fondos:", e);
        }

        // Crear UI de subida si no existe
        let uploadContenedor = document.getElementById('upload-fondo-container');
        if (!uploadContenedor) {
            uploadContenedor = document.createElement('div');
            uploadContenedor.id = 'upload-fondo-container';
            uploadContenedor.innerHTML = `
                <div class="upload-fondo-wrapper">
                    <label for="fondo-upload" class="upload-fondo-header">Subir nuevo fondo (JPG, PNG, WEBP, máximo 10MB):</label>
                    <div class="upload-fondo-controls">
                        <input type="file" id="fondo-upload" accept=".jpg,.jpeg,.png,.webp,.gif,.svg" class="form-control upload-fondo-input">
                        <button id="btn-upload-fondo" type="button" class="btn btn-primary upload-fondo-btn">Subir Fondo</button>
                    </div>
                </div>
            `;
            galeriaContenedor.parentNode.insertBefore(uploadContenedor, galeriaContenedor);

            document.getElementById('btn-upload-fondo').addEventListener('click', async () => {
                const fileInput = document.getElementById('fondo-upload');
                if (!fileInput.files || fileInput.files.length === 0) {
                    alert("Selecciona un archivo de imagen primero.");
                    return;
                }
                const file = fileInput.files[0];
                const formData = new FormData();
                formData.append('file', file);
                
                const btn = document.getElementById('btn-upload-fondo');
                const textOriginal = btn.textContent;
                btn.textContent = 'Subiendo...';
                btn.disabled = true;

                try {
                    const response = await fetch('/api/upload-fondo', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }, // Token es global en auth.js/crearEntrada
                        body: formData
                    });
                    const data = await response.json();
                    if (response.ok && data.status === 'success') {
                        alert("Fondo subido correctamente.");
                        // Recargar la galería
                        inicializarGestionFondo();
                    } else {
                        alert(`Error al subir: ${data.detail || 'Desconocido'}`);
                    }
                } catch (err) {
                    console.error(err);
                    alert("Error de conexión al subir el fondo.");
                } finally {
                    btn.textContent = textOriginal;
                    btn.disabled = false;
                    fileInput.value = '';
                }
            });
        }

        let selectedFondo = "";

        // Aplicar fondo actual
        function aplicarVistaPrevia(fondoName) {
            if (fondoName) {
                document.body.style.backgroundImage = `linear-gradient(135deg, rgba(255, 255, 255, 0.90) 0%, rgba(244, 246, 248, 0.92) 100%), url('/html/img/fondos/${fondoName}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundAttachment = 'fixed';
                document.body.style.backgroundPosition = 'center';
            } else {
                document.body.style.backgroundImage = 'none';
            }
        }

        try {
            // Cargar configuración actual del servidor
            const config = await apiRequest('/api/config');
            if (config && config.fondo) {
                selectedFondo = config.fondo;
                aplicarVistaPrevia(selectedFondo);
            }
        } catch (error) {
            console.error("Error al cargar la configuración de fondo existente:", error);
        }

        // Renderizar Galería
        galeriaContenedor.innerHTML = '';
        fondosDisponibles.forEach(item => {
            const card = document.createElement('div');
            
            // Checkmark SVG
            const checkmark = `
                <div class="badge-seleccionado">
                    <svg style="width:14px;height:14px;fill:currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                </div>
            `;

            card.className = 'tarjeta-fondo';
            card.style.position = 'relative';
            card.style.overflow = 'hidden';
            card.style.borderRadius = '10px';
            card.style.border = '2px solid var(--color-borde)';
            card.style.aspectRatio = '16/10';
            card.style.cursor = 'pointer';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.backgroundColor = 'var(--color-fondo-main)';
            
            if (item.file) {
                card.className = 'tarjeta-fondo';
                card.style.position = 'relative';
                card.style.overflow = 'hidden';
                card.style.borderRadius = '10px';
                card.style.border = '2px solid var(--color-borde)';
                card.style.aspectRatio = '16/10';
                card.style.cursor = 'pointer';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.backgroundColor = 'var(--color-fondo-main)';
                card.innerHTML = `
                    <img src="/html/img/fondos/${item.file}" alt="${item.label}" style="width:100%; height:100%; object-fit:cover; display:block;">
                    <div class="info-tag">${item.label}</div>
                    ${checkmark}
                `;
            } else {
                card.className = 'tarjeta-fondo sin-fondo-opt';
                card.style.cursor = 'pointer';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.alignItems = 'center';
                card.style.justifyContent = 'center';
                card.style.backgroundColor = 'var(--color-inputs)';
                card.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; gap: 8px;">
                        <svg style="width:24px;height:24px;color:var(--color-texto);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                        <span style="font-weight:600; color:var(--color-texto); font-size:0.95rem;">${item.label}</span>
                    </div>
                    ${checkmark}
                `;
            }

            // Marcar seleccionada por defecto si coincide
            if (item.file === selectedFondo) {
                card.classList.add('seleccionada');
            }

            card.addEventListener('click', () => {
                // Limpiar previas
                galeriaContenedor.querySelectorAll('.tarjeta-fondo').forEach(el => el.classList.remove('seleccionada'));
                card.classList.add('seleccionada');
                
                selectedFondo = item.file;
                aplicarVistaPrevia(selectedFondo);
            });

            galeriaContenedor.appendChild(card);
        });

        // Evento de guardar
        btnGuardar.addEventListener('click', async () => {
            try {
                btnGuardar.disabled = true;
                const originalText = btnGuardar.textContent;
                btnGuardar.textContent = "Guardando...";

                const result = await apiRequest('/api/config', 'POST', { fondo: selectedFondo });
                if (result && result.status === 'success') {
                    btnGuardar.textContent = "¡Guardado con éxito!";
                    btnGuardar.style.backgroundColor = "var(--color-secundario)";
                    setTimeout(() => {
                        btnGuardar.textContent = originalText;
                        btnGuardar.style.backgroundColor = "";
                        btnGuardar.disabled = false;
                    }, 2000);
                } else {
                    throw new Error("No se pudo guardar la configuración");
                }
            } catch (error) {
                console.error("Error al guardar fondo:", error);
                alert(`Error al guardar el fondo: ${error.message}`);
                btnGuardar.disabled = false;
                btnGuardar.textContent = "Guardar Imagen de Fondo";
            }
        });
    }

    // --- IMPORTACIÓN MASIVA DE ASOCIACIONES ---
    function descargarPlantillaCSV() {
        const headers = "Nombre;Siglas;Logo_URL;Descripcion;Categoria;Etiquetas;Contactos;Cartera_Servicios;Videos_YouTube;Pais;Comunidad;Provincia;Municipio";
        const row1 = "Asociación Española Contra el Cáncer;AECC;https://aecc.es/logo.png;Ayuda y apoyo a enfermos de cáncer;Ayuda al Paciente;#Cáncer,#Ayuda,#Granada;email:info@aecc.es | web:https://aecc.es | facebook:https://facebook.com/aecc;Apoyo psicológico y social a enfermos y familiares;https://www.youtube.com/watch?v=Ejemplo1;España;Andalucía;Granada;Granada";
        const row2 = "Asociación Granadina de Fibromialgia;AGAF;;Apoyo a personas con fibromialgia en Granada;Ayuda al Paciente;#Fibromialgia,#Ayuda;email:agaf@gmail.com | telefono:958123456;Talleres de fisioterapia y apoyo emocional;;España;Andalucía;Granada;";
        
        const csvContent = "\ufeff" + headers + "\n" + row1 + "\n" + row2;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_importacion_asociaciones.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function inicializarImportacionMasiva() {
        const btnDescargar = document.getElementById('btn-descargar-plantilla');
        const dragArea = document.getElementById('drag-drop-area');
        const fileInput = document.getElementById('input-archivo-csv');
        const resultDiv = document.getElementById('resultado-importacion');
        const btnExportarCSV = document.getElementById('btn-exportar-csv');
        const btnExportarODS = document.getElementById('btn-exportar-ods');

        if (!btnDescargar || !dragArea || !fileInput || !resultDiv) return;

        btnDescargar.addEventListener('click', descargarPlantillaCSV);

        if (btnExportarCSV) {
            btnExportarCSV.addEventListener('click', () => descargarBackup('csv'));
        }
        if (btnExportarODS) {
            btnExportarODS.addEventListener('click', () => descargarBackup('ods'));
        }

        async function descargarBackup(formato) {
            try {
                const response = await fetch(`/api/exportar/${formato}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    alert("Tu sesión ha expirado.");
                    localStorage.removeItem('adminToken');
                    window.location.href = 'login.html';
                    return;
                }

                if (!response.ok) {
                    const data = await response.json().catch(()=>({}));
                    alert("Error al exportar: " + (data.detail || "Asegúrese de tener instaladas las librerías necesarias en el servidor."));
                    return;
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `backup_asociaciones.${formato}`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                alert("Error de conexión al exportar.");
                console.error(error);
            }
        }

        dragArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                procesarArchivoCSV(fileInput.files[0]);
            }
        });

        // Eventos drag-and-drop
        dragArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragArea.classList.add('drag-over');
        });

        ['dragleave', 'dragend'].forEach(type => {
            dragArea.addEventListener(type, () => {
                dragArea.classList.remove('drag-over');
            });
        });

        dragArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dragArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                procesarArchivoCSV(e.dataTransfer.files[0]);
            }
        });

        async function procesarArchivoCSV(file) {
            const fileName = file.name.toLowerCase();
            if (!fileName.endsWith('.csv') && !fileName.endsWith('.ods')) {
                mostrarResultado(false, "Error: El archivo debe tener formato .csv o .ods.");
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            
            // Leer configuración de la UI
            const modoElegido = document.querySelector('input[name="modo_importacion"]:checked');
            if (modoElegido) {
                formData.append('modo', modoElegido.value);
            } else {
                formData.append('modo', 'añadir');
            }
            
            const chkLogos = document.getElementById('chk_descargar_logos');
            if (chkLogos) {
                formData.append('descargar_logos', chkLogos.checked ? "true" : "false");
            }

            resultDiv.style.display = 'block';
            resultDiv.className = 'contenedor-resultado-importacion exito';
            resultDiv.textContent = "Procesando y validando archivo...";

            try {
                const response = await fetch('/api/importar', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.status === 401) {
                    alert("Tu sesión ha expirado.");
                    localStorage.removeItem('adminToken');
                    window.location.href = 'login.html';
                    return;
                }

                if (response.ok && data.status === 'success') {
                    mostrarResultado(true, `¡Éxito! Se han importado correctamente ${data.count} asociaciones al catálogo del portal.`);
                    fileInput.value = '';
                } else {
                    const errorDetail = data.detail || "Error desconocido durante la importación.";
                    mostrarResultado(false, `Error en la importación:\n${errorDetail}`);
                    fileInput.value = '';
                }
            } catch (error) {
                console.error("Error al importar masivamente:", error);
                mostrarResultado(false, `Error de conexión: No se pudo establecer contacto con el servidor.`);
                fileInput.value = '';
            }
        }

        function mostrarResultado(exito, mensaje) {
            resultDiv.style.display = 'block';
            if (exito) {
                resultDiv.className = 'contenedor-resultado-importacion exito';
                resultDiv.textContent = mensaje;
            } else {
                resultDiv.className = 'contenedor-resultado-importacion error';
                resultDiv.textContent = mensaje;
            }
        }
    }

    // --- DETONAR INICIALIZACIÓN ---
    inicializarFormulario();
    inicializarLogoTabs();
    inicializarGestionFondo();
    inicializarImportacionMasiva();
    inicializarGestionSolicitudes();
});

// --- GESTIÓN DE SOLICITUDES DE INCLUSIÓN (PANEL ADMIN) ---
// Nota: definida fuera del DOMContentLoaded para que tenga acceso al token del localStorage
function inicializarGestionSolicitudes() {
    const token = localStorage.getItem('adminToken');
    const listaSolicitudes = document.getElementById('lista-solicitudes');
    const badgePendientes = document.getElementById('badge-solicitudes-pendientes');
    const btnRecargar = document.getElementById('btn-recargar-solicitudes');
    const filtrosBtns = document.querySelectorAll('.filtro-estado-btn');

    if (!listaSolicitudes) return;

    let solicitudesData = [];
    let filtroActivo = '';

    const ESTADO_CONFIG = {
        pendiente:  { label: 'Pendiente',  cls: 'estado-pendiente' },
        revisada:   { label: 'Revisada',   cls: 'estado-revisada' },
        aprobada:   { label: 'Aprobada',   cls: 'estado-aprobada' },
        rechazada:  { label: 'Rechazada',  cls: 'estado-rechazada' }
    };

    async function cargarSolicitudes() {
        try {
            const res = await fetch('/api/solicitudes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) { listaSolicitudes.innerHTML = '<p style="color:var(--color-peligro);">Error al cargar solicitudes.</p>'; return; }
            solicitudesData = await res.json();
            actualizarBadgePendientes();
            renderizarSolicitudes();
        } catch (e) {
            listaSolicitudes.innerHTML = '<p style="color:var(--color-peligro);">No se pudo conectar con el servidor.</p>';
        }
    }

    function actualizarBadgePendientes() {
        const pendientes = solicitudesData.filter(s => s.estado === 'pendiente').length;
        if (badgePendientes) {
            if (pendientes > 0) {
                badgePendientes.textContent = `${pendientes} pendiente${pendientes > 1 ? 's' : ''}`;
                badgePendientes.style.display = 'inline-flex';
            } else {
                badgePendientes.style.display = 'none';
            }
        }
    }

    function renderizarSolicitudes() {
        const filtradas = filtroActivo
            ? solicitudesData.filter(s => s.estado === filtroActivo)
            : solicitudesData;

        if (filtradas.length === 0) {
            listaSolicitudes.innerHTML = `
                <div style="text-align:center; padding:3rem 0; color:#888;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;margin-bottom:1rem;opacity:0.4;">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <p>${filtroActivo ? `No hay solicitudes con estado "${ESTADO_CONFIG[filtroActivo]?.label || filtroActivo}".` : 'Aún no se ha recibido ninguna solicitud.'}</p>
                </div>
            `;
            return;
        }

        listaSolicitudes.innerHTML = '';
        // Ordenar: pendientes primero, luego por fecha desc
        const ordenadas = [...filtradas].sort((a, b) => {
            if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
            if (b.estado === 'pendiente' && a.estado !== 'pendiente') return 1;
            return new Date(b.fecha) - new Date(a.fecha);
        });

        ordenadas.forEach(sol => {
            const card = document.createElement('div');
            card.className = 'solicitud-card';
            card.dataset.id = sol.id;

            const ubi = sol.ubicacion;
            const ubiStr = ubi ? [ubi.municipio, ubi.provincia, ubi.comunidad, ubi.pais].filter(Boolean).join(' · ') : '';
            const fechaFormateada = sol.fecha ? new Date(sol.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha';
            const estadoCfg = ESTADO_CONFIG[sol.estado] || { label: sol.estado, cls: '' };

            card.innerHTML = `
                <div class="solicitud-card-header">
                    <div class="solicitud-card-titulo">
                        <h3 class="solicitud-nombre">${escapeHTMLSol(sol.nombre_asociacion)}</h3>
                        <span class="solicitud-siglas">${escapeHTMLSol(sol.siglas)}</span>
                        <span class="badge-estado ${estadoCfg.cls}">${estadoCfg.label}</span>
                    </div>
                    <div class="solicitud-meta">
                        <span>${fechaFormateada}</span>
                        ${ubiStr ? `<span>📍 ${escapeHTMLSol(ubiStr)}</span>` : ''}
                        ${sol.categoria_sugerida ? `<span>🏷 ${escapeHTMLSol(sol.categoria_sugerida)}</span>` : ''}
                    </div>
                </div>
                <div class="solicitud-card-body">
                    <div class="solicitud-info-col">
                        <p class="solicitud-desc">${escapeHTMLSol(sol.descripcion)}</p>
                        ${sol.mensaje ? `<p class="solicitud-mensaje"><em>${escapeHTMLSol(sol.mensaje)}</em></p>` : ''}
                        ${sol.web ? `<p class="solicitud-web"><a href="${escapeHTMLSol(sol.web)}" target="_blank" rel="noopener noreferrer">${escapeHTMLSol(sol.web)}</a></p>` : ''}
                    </div>
                    <div class="solicitud-contacto-col">
                        <p class="solicitud-representante">
                            <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                            <strong>${escapeHTMLSol(sol.representante?.nombre || '')}</strong> — ${escapeHTMLSol(sol.representante?.cargo || '')}
                        </p>
                        <p class="solicitud-email">
                            <a href="mailto:${escapeHTMLSol(sol.representante?.email || '')}">
                                <svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                                ${escapeHTMLSol(sol.representante?.email || '')}
                            </a>
                        </p>
                        ${sol.representante?.telefono ? `<p class="solicitud-tel">📞 ${escapeHTMLSol(sol.representante.telefono)}</p>` : ''}
                    </div>
                </div>
                <div class="solicitud-card-acciones">
                    <select class="select-estado-solicitud" data-id="${sol.id}">
                        <option value="pendiente" ${sol.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="revisada" ${sol.estado === 'revisada' ? 'selected' : ''}>Revisada</option>
                        <option value="aprobada" ${sol.estado === 'aprobada' ? 'selected' : ''}>Aprobada</option>
                        <option value="rechazada" ${sol.estado === 'rechazada' ? 'selected' : ''}>Rechazada</option>
                    </select>
                    <button class="btn-eliminar-solicitud btn-accion-detalle eliminar" data-id="${sol.id}" style="padding:0.5rem 1.2rem; font-size:0.85rem;">Eliminar</button>
                </div>
            `;

            // Evento cambio de estado
            card.querySelector('.select-estado-solicitud').addEventListener('change', async (e) => {
                const nuevoEstado = e.target.value;
                await cambiarEstado(sol.id, nuevoEstado, card);
            });

            // Evento eliminar
            card.querySelector('.btn-eliminar-solicitud').addEventListener('click', async () => {
                if (!confirm(`¿Eliminar la solicitud de "${sol.nombre_asociacion}"? Esta acción no se puede deshacer.`)) return;
                await eliminarSolicitud(sol.id, card);
            });

            listaSolicitudes.appendChild(card);
        });
    }

    async function cambiarEstado(id, nuevoEstado, card) {
        try {
            const res = await fetch(`/api/solicitudes/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (!res.ok) throw new Error('Error al actualizar');
            // Actualizar localmente
            const sol = solicitudesData.find(s => s.id === id);
            if (sol) sol.estado = nuevoEstado;
            // Actualizar badge del estado en la card
            const badge = card.querySelector('.badge-estado');
            if (badge) {
                const cfg = ESTADO_CONFIG[nuevoEstado] || { label: nuevoEstado, cls: '' };
                badge.textContent = cfg.label;
                badge.className = `badge-estado ${cfg.cls}`;
            }
            actualizarBadgePendientes();
        } catch (e) {
            alert('No se pudo actualizar el estado. Inténtalo de nuevo.');
        }
    }

    async function eliminarSolicitud(id, card) {
        try {
            const res = await fetch(`/api/solicitudes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al eliminar');
            solicitudesData = solicitudesData.filter(s => s.id !== id);
            card.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => { card.remove(); actualizarBadgePendientes(); }, 320);
        } catch (e) {
            alert('No se pudo eliminar la solicitud. Inténtalo de nuevo.');
        }
    }

    function escapeHTMLSol(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[tag] || tag));
    }

    // Filtros de estado
    filtrosBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filtrosBtns.forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            filtroActivo = btn.dataset.estado;
            renderizarSolicitudes();
        });
    });

    // Botón recargar
    if (btnRecargar) btnRecargar.addEventListener('click', cargarSolicitudes);

    // Carga inicial
    cargarSolicitudes();
}