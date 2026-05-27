document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    const path = window.location.pathname;
    
    const isLoginPage = path.endsWith('login.html');
    const isPublicPage = path.endsWith('index.html') || path === '/' || path.endsWith('/');

    if (!token && !isLoginPage && !isPublicPage) {
        window.location.href = 'login.html';
        return;
    }

    if (token) {
        document.querySelectorAll('.req-admin').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.req-publico').forEach(el => el.style.display = 'none');
    } else {
        document.querySelectorAll('.req-admin').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.req-publico').forEach(el => el.style.display = 'block');
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('adminToken');
            window.location.href = 'index.html';
        });
    }
});