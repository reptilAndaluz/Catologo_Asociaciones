document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-login');
    const errorMsg = document.getElementById('error-msg');

    if (localStorage.getItem('adminToken')) {
        window.location.href = 'index.html';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';
        
        const usuario = document.getElementById('usuario').value;
        const password = document.getElementById('password').value;

        const formData = new URLSearchParams();
        formData.append('username', usuario);
        formData.append('password', password);

        try {
            const response = await fetch('/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (!response.ok) throw new Error('Credenciales incorrectas');

            const data = await response.json();
            localStorage.setItem('adminToken', data.access_token);
            window.location.href = 'index.html';
        } catch (error) {
            errorMsg.textContent = 'Error de autenticación. Verifica tus datos.';
            errorMsg.style.display = 'block';
        }
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
});