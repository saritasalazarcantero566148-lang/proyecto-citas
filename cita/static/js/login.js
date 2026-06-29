const API_LOGIN = '/auth/login/';
const API_RECUPERAR = '/auth/recuperar/';

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    clearErrors();

    const correo     = document.getElementById('correo').value.trim();
    const contrasena = document.getElementById('contrasena').value;

    let valid = true;

    if (!correo) {
        showError('correo', 'El correo es obligatorio.');
        valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        showError('correo', 'Ingresa un correo válido.');
        valid = false;
    }

    if (!contrasena) {
        showError('contrasena', 'La contraseña es obligatoria.');
        valid = false;
    }

    if (!valid) {
        shakeForm();
        return;
    }

    const btn     = document.getElementById('btnLogin');
    const btnText = document.getElementById('btnLoginText');
    btn.disabled  = true;
    btnText.innerHTML = '<div class="spinner"></div> Ingresando...';

    try {
        const response = await fetch(API_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem('access_token', data.tokens.access);
            localStorage.setItem('refresh_token', data.tokens.refresh);
            localStorage.setItem('usuario', JSON.stringify(data.data));
            localStorage.setItem('usuario_id', data.data.id);
            localStorage.setItem('nombre_usuario', data.data.nombre);

            showToast(`¡Bienvenido, ${data.data.nombre}!`, 'success');

            setTimeout(() => {
                // HU5: el login ahora redirige a Mis Citas, no a Agendar Cita.
                // Ruta ABSOLUTA (con "/" inicial) para que no dependa de
                // desde qué URL se cargó la página de login.
                
                window.location.href = '/mis_citas/';
            }, 1500);

        } else {
            const errors = data.errors || {};

            if (errors.correo)     showError('correo', errors.correo[0]);
            if (errors.contrasena) {
                showError('contrasena', errors.contrasena[0]);
                const w = document.getElementById('intentosWarning');
                w.textContent = errors.contrasena[0];
                w.classList.add('show');
            }
            if (errors.bloqueado) {
                showAlert('error', errors.bloqueado[0]);
            } else {
                showAlert('error', data.message || 'Error al iniciar sesión.');
            }
            shakeForm();
        }

    } catch (error) {
        showAlert('error', 'Error de conexión. Verifica que el servidor esté corriendo.');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Iniciar Sesión';
    }
});

// ===== RECUPERAR CONTRASEÑA =====
function abrirModalRecuperar() {
    document.getElementById('modalRecuperar').classList.add('show');
}

function cerrarModalRecuperar() {
    document.getElementById('modalRecuperar').classList.remove('show');
    document.getElementById('correoRecuperar').value = '';
    const errorEl = document.getElementById('error-correoRecuperar');
    errorEl.textContent = '';
    errorEl.classList.remove('show');
}

function cerrarModalExitoRecuperar() {
    document.getElementById('modalRecuperarExito').classList.remove('show');
}

async function enviarRecuperacion() {
    const correo  = document.getElementById('correoRecuperar').value.trim();
    const errorEl = document.getElementById('error-correoRecuperar');

    if (!correo) {
        errorEl.textContent = 'El correo es obligatorio.';
        errorEl.classList.add('show');
        return;
    }

    const btn     = document.getElementById('btnRecuperar');
    const btnText = document.getElementById('btnRecuperarText');
    btn.disabled  = true;
    btnText.innerHTML = '<div class="spinner"></div> Enviando...';

    try {
        await fetch(API_RECUPERAR, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo })
        });

        cerrarModalRecuperar();
        document.getElementById('modalRecuperarExito').classList.add('show');

    } catch (error) {
        showAlert('error', 'Error de conexión.');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Enviar enlace';
    }
}

// ===== UTILIDADES =====
function showError(field, message) {
    const input   = document.getElementById(field);
    const errorEl = document.getElementById(`error-${field}`);
    if (input)   input.classList.add('error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

function clearErrors() {
    document.querySelectorAll('.error-text').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
    document.getElementById('errorAlert').classList.remove('show');
    document.getElementById('intentosWarning').classList.remove('show');
}

function showAlert(type, message) {
    const alert = document.getElementById(`${type}Alert`);
    document.getElementById(`${type}Text`).textContent = message;
    alert.classList.add('show');
    setTimeout(() => alert.classList.remove('show'), 5000);
}

function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast     = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        ${message}
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function shakeForm() {
    const card = document.querySelector('.card');
    card.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => card.style.animation = '', 500);
}

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
        this.classList.remove('error');
        const errorEl = document.getElementById(`error-${this.id}`);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }
    });
});