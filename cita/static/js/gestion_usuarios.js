const API_USUARIOS = '/auth/usuarios/';

let timeoutBusqueda = null;

function getUsuarioSesion() {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const usuario = getUsuarioSesion();

    if (!usuario || !usuario.is_staff) {
        alert('No tienes permisos para acceder a esta sección.');
        window.location.href = '/login/';
        return;
    }

    cargarUsuarios();

    document.getElementById('buscador').addEventListener('input', (e) => {
        clearTimeout(timeoutBusqueda);
        timeoutBusqueda = setTimeout(() => cargarUsuarios(e.target.value), 400);
    });

    document.getElementById('editForm').addEventListener('submit', guardarEdicion);
});

async function cargarUsuarios(q = '') {
    try {
        const url = q ? `${API_USUARIOS}?q=${encodeURIComponent(q)}` : API_USUARIOS;
        const response = await fetch(url, { headers: authHeaders() });

        if (response.status === 401 || response.status === 403) {
            mostrarToast('No tienes permisos de administrador', 'error');
            return;
        }

        const usuarios = await response.json();
        renderizarTabla(usuarios);

    } catch (error) {
        console.error(error);
        mostrarToast('Error cargando usuarios', 'error');
    }
}

function renderizarTabla(usuarios) {
    const body = document.getElementById('usuariosBody');
    const empty = document.getElementById('emptyMessage');

    body.innerHTML = '';

    if (!usuarios.length) {
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    usuarios.forEach(u => {
        const tr = document.createElement('tr');
        const fecha = u.fecha_registro ? u.fecha_registro.split('T')[0] : '—';

        tr.innerHTML = `
            <td>${u.nombre_completo}</td>
            <td>${u.correo}</td>
            <td>${u.documento}</td>
            <td>${fecha}</td>
            <td><span class="gh-badge ${u.is_active ? 'activo' : 'inactivo'}">${u.is_active ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <div class="gh-actions">
                    <button class="gh-btn-toggle" onclick="toggleActivo(${u.id}, ${!u.is_active})">
                        ${u.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="gh-btn-edit" onclick='abrirModalEditar(${JSON.stringify(u)})'>Editar</button>
                    <button class="gh-btn-delete" onclick="eliminarUsuario(${u.id})">Eliminar</button>
                </div>
            </td>
        `;

        body.appendChild(tr);
    });
}

async function toggleActivo(id, nuevoEstado) {
    try {
        const response = await fetch(`${API_USUARIOS}${id}/`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ is_active: nuevoEstado })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast(nuevoEstado ? 'Usuario activado' : 'Usuario desactivado', 'success');
            cargarUsuarios(document.getElementById('buscador').value);
        } else {
            mostrarToast(data.message || 'No se pudo actualizar', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarToast('Error de conexión', 'error');
    }
}

function abrirModalEditar(u) {
    document.getElementById('editId').value = u.id;
    document.getElementById('editNombre').value = u.nombre_completo || '';
    document.getElementById('editDocumento').value = u.documento || '';
    document.getElementById('editTelefono').value = u.telefono || '';
    document.getElementById('editEps').value = u.eps || '';
    document.getElementById('editSexo').value = u.sexo || '';
    document.getElementById('editAlergias').value = u.alergias || '';
    document.getElementById('editModal').classList.add('show');
}

function cerrarModalEditar() {
    document.getElementById('editModal').classList.remove('show');
    document.querySelectorAll('.error-text').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
}

async function guardarEdicion(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;

    const payload = {
        nombre_completo: document.getElementById('editNombre').value.trim(),
        documento: document.getElementById('editDocumento').value.trim(),
        telefono: document.getElementById('editTelefono').value.trim(),
        eps: document.getElementById('editEps').value.trim(),
        sexo: document.getElementById('editSexo').value,
        alergias: document.getElementById('editAlergias').value.trim(),
    };

    try {
        const response = await fetch(`${API_USUARIOS}${id}/`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast('Usuario actualizado', 'success');
            cerrarModalEditar();
            cargarUsuarios(document.getElementById('buscador').value);
        } else {
            const mensaje = extraerPrimerError(data.errors) || data.message || 'No se pudo actualizar';
            mostrarToast(mensaje, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarToast('Error de conexión', 'error');
    }
}

async function eliminarUsuario(id) {
    if (!confirm('¿Seguro que deseas eliminar este usuario? Esta acción es permanente y también eliminará sus citas asociadas.')) return;

    try {
        const response = await fetch(`${API_USUARIOS}${id}/`, {
            method: 'DELETE',
            headers: authHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast('Usuario eliminado', 'success');
            cargarUsuarios(document.getElementById('buscador').value);
        } else {
            mostrarToast(data.message || 'No se pudo eliminar', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarToast('Error de conexión', 'error');
    }
}

function extraerPrimerError(errors) {
    if (!errors) return null;
    const firstKey = Object.keys(errors)[0];
    const value = errors[firstKey];
    return Array.isArray(value) ? value[0] : value;
}

function mostrarToast(mensaje, tipo) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}