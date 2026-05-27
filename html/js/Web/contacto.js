document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DEL FORMULARIO ---
    let pasoActual = 1;

    // --- ELEMENTOS DEL DOM ---
    const form = document.getElementById('form-solicitud');
    const btnPaso2 = document.getElementById('btn-paso-2');
    const btnVolver1 = document.getElementById('btn-volver-1');
    const confirmacionDiv = document.getElementById('confirmacion-envio');
    const mainContacto = document.getElementById('main-contacto');

    // Indicadores de paso
    const pasoInd1 = document.getElementById('paso-ind-1');
    const pasoInd2 = document.getElementById('paso-ind-2');
    const pasoInd3 = document.getElementById('paso-ind-3');

    // --- AUTENTICACIÓN (para mostrar/ocultar nav admin) ---
    const token = localStorage.getItem('adminToken');
    if (token) {
        document.querySelectorAll('.req-admin').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.req-publico').forEach(el => el.style.display = 'none');
    } else {
        document.querySelectorAll('.req-admin').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.req-publico').forEach(el => el.style.display = 'block');
    }

    // --- LOGOUT ---
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.reload();
        });
    }

    // --- CONTADOR DE CARACTERES EN DESCRIPCIÓN ---
    const descTextarea = document.getElementById('sol_descripcion');
    const contadorDesc = document.getElementById('contador-desc');
    if (descTextarea && contadorDesc) {
        descTextarea.addEventListener('input', () => {
            const len = descTextarea.value.length;
            contadorDesc.textContent = `${len} / 2000`;
            contadorDesc.style.color = len > 1800 ? 'var(--color-peligro)' : '#888';
        });
    }

    // --- CARGAR CATEGORÍAS DESDE LA API ---
    async function cargarCategorias() {
        try {
            const res = await fetch('/api/categorias');
            if (!res.ok) return;
            const categorias = await res.json();
            const select = document.getElementById('sol_categoria');
            if (!select || !categorias) return;
            categorias.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.nombre;
                opt.textContent = cat.nombre;
                select.appendChild(opt);
            });
        } catch (e) {
            console.warn('No se pudieron cargar las categorías:', e);
        }
    }
    cargarCategorias();

    // --- APLICAR FONDO GLOBAL ---
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
        } catch (e) {
            console.warn('No se pudo cargar el fondo global:', e);
        }
    }
    aplicarFondoGlobal();

    // --- GESTIÓN DE PASOS ---
    function irAPaso(numero) {
        // Ocultar todos los pasos
        document.querySelectorAll('.paso-formulario').forEach(p => p.classList.add('oculto'));
        // Mostrar el paso objetivo
        const pasoTarget = document.getElementById(`paso-form-${numero}`);
        if (pasoTarget) {
            pasoTarget.classList.remove('oculto');
            pasoTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Actualizar indicadores
        [pasoInd1, pasoInd2, pasoInd3].forEach((ind, i) => {
            if (!ind) return;
            ind.classList.remove('activo', 'completado');
            if (i + 1 < numero) ind.classList.add('completado');
            if (i + 1 === numero) ind.classList.add('activo');
        });
        pasoActual = numero;
    }

    // --- VALIDACIÓN DEL PASO 1 ---
    function validarPaso1() {
        const nombre = document.getElementById('sol_nombre').value.trim();
        const siglas = document.getElementById('sol_siglas').value.trim();
        const descripcion = document.getElementById('sol_descripcion').value.trim();
        const provincia = document.getElementById('sol_provincia').value.trim();

        if (!nombre) {
            mostrarErrorCampo('sol_nombre', 'El nombre de la asociación es obligatorio.');
            return false;
        }
        if (!siglas) {
            mostrarErrorCampo('sol_siglas', 'Las siglas son obligatorias.');
            return false;
        }
        if (!descripcion || descripcion.length < 20) {
            mostrarErrorCampo('sol_descripcion', 'Escribe una descripción de al menos 20 caracteres.');
            return false;
        }
        if (!provincia) {
            mostrarErrorCampo('sol_provincia', 'La provincia es obligatoria.');
            return false;
        }
        return true;
    }

    // --- VALIDACIÓN DEL PASO 2 ---
    function validarPaso2() {
        const nombreContacto = document.getElementById('sol_nombre_contacto').value.trim();
        const cargo = document.getElementById('sol_cargo').value.trim();
        const email = document.getElementById('sol_email').value.trim();
        const acepta = document.getElementById('sol_acepta_lopd').checked;

        if (!nombreContacto) {
            mostrarErrorCampo('sol_nombre_contacto', 'El nombre del representante es obligatorio.');
            return false;
        }
        if (!cargo) {
            mostrarErrorCampo('sol_cargo', 'El cargo es obligatorio.');
            return false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarErrorCampo('sol_email', 'Introduce un correo electrónico válido.');
            return false;
        }
        if (!acepta) {
            mostrarErrorCampo('sol_acepta_lopd', 'Debes aceptar la política de protección de datos.');
            return false;
        }
        return true;
    }

    function mostrarErrorCampo(id, mensaje) {
        const campo = document.getElementById(id);
        if (!campo) return;
        campo.classList.add('campo-error');
        // Eliminar error previo
        const prevError = campo.parentElement.querySelector('.mensaje-error-campo');
        if (prevError) prevError.remove();
        const errorSpan = document.createElement('span');
        errorSpan.className = 'mensaje-error-campo';
        errorSpan.textContent = mensaje;
        campo.parentElement.appendChild(errorSpan);
        campo.focus();
        campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Quitar error al corregir
        campo.addEventListener('input', () => {
            campo.classList.remove('campo-error');
            errorSpan.remove();
        }, { once: true });
        campo.addEventListener('change', () => {
            campo.classList.remove('campo-error');
            errorSpan.remove();
        }, { once: true });
    }

    // --- EVENTOS DE NAVEGACIÓN ENTRE PASOS ---
    if (btnPaso2) {
        btnPaso2.addEventListener('click', () => {
            if (validarPaso1()) irAPaso(2);
        });
    }

    if (btnVolver1) {
        btnVolver1.addEventListener('click', () => irAPaso(1));
    }

    // --- ENVÍO DEL FORMULARIO ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Comprobación honeypot anti-spam
            const honeypot = document.getElementById('honeypot');
            if (honeypot && honeypot.value.trim() !== '') {
                console.warn('Posible bot detectado. Envío bloqueado.');
                return;
            }

            if (!validarPaso2()) return;

            const btnEnviar = document.getElementById('btn-enviar-solicitud');
            btnEnviar.disabled = true;
            btnEnviar.textContent = 'Enviando...';

            const payload = {
                nombre_asociacion: document.getElementById('sol_nombre').value.trim(),
                siglas: document.getElementById('sol_siglas').value.trim(),
                descripcion: document.getElementById('sol_descripcion').value.trim(),
                categoria_sugerida: document.getElementById('sol_categoria').value.trim(),
                web: document.getElementById('sol_web').value.trim(),
                ubicacion: {
                    pais: document.getElementById('sol_pais').value.trim(),
                    comunidad: document.getElementById('sol_comunidad').value.trim(),
                    provincia: document.getElementById('sol_provincia').value.trim(),
                    municipio: document.getElementById('sol_municipio').value.trim()
                },
                mensaje: document.getElementById('sol_mensaje').value.trim(),
                representante: {
                    nombre: document.getElementById('sol_nombre_contacto').value.trim(),
                    cargo: document.getElementById('sol_cargo').value.trim(),
                    email: document.getElementById('sol_email').value.trim(),
                    telefono: document.getElementById('sol_telefono').value.trim()
                }
            };

            try {
                const response = await fetch('/api/solicitudes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || 'Error al enviar la solicitud');
                }

                const data = await response.json();

                // Mostrar confirmación
                form.classList.add('oculto');
                document.querySelector('.pasos-container').classList.add('oculto');
                document.querySelector('.contacto-hero').classList.add('oculto');
                document.querySelector('.aside-info-contacto')?.classList.add('oculto');

                // Actualizar indicador a paso 3
                [pasoInd1, pasoInd2].forEach(ind => {
                    if (ind) { ind.classList.remove('activo'); ind.classList.add('completado'); }
                });
                if (pasoInd3) pasoInd3.classList.add('activo');

                confirmacionDiv.classList.remove('oculto');
                if (data.id) {
                    const refEl = document.getElementById('confirmacion-ref');
                    if (refEl) refEl.textContent = `Número de referencia: #${data.id}`;
                }
                confirmacionDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

            } catch (error) {
                console.error('Error al enviar la solicitud:', error);
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = 'Enviar Solicitud';
                // Mostrar error general al usuario
                const errorGlobal = document.getElementById('error-global') || (() => {
                    const el = document.createElement('div');
                    el.id = 'error-global';
                    el.className = 'contenedor-resultado-importacion error';
                    el.style.display = 'block';
                    el.style.marginTop = '1rem';
                    form.appendChild(el);
                    return el;
                })();
                errorGlobal.textContent = `Error: ${error.message}. Por favor, inténtalo de nuevo o contacta directamente en info@husc.es`;
            }
        });
    }
});
