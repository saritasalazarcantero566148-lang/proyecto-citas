const API_HORARIOS = '/auth/horarios/';
const API_MEDICOS  = '/medicos/';

let medicoSeleccionado = null;

// ============ AUTENTICACIÓN ============
function getUsuario() {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
}

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const usuario = getUsuario();

    if (!usuario || !usuario.is_staff) {
        alert('No tienes permisos para acceder a esta sección.');
        window.location.href = '/login/';
        return;
    }

    document.getElementById('especialidad').addEventListener('change', cargarMedicos);
    document.getElementById('medico').addEventListener('change', seleccionarMedico);
    document.getElementById('formHorario').addEventListener('submit', agregarHorario);
    document.getElementById('editForm').addEventListener('submit', guardarEdicion);
});

// ============ CARGA DE MÉDICOS ============
async function cargarMedicos() {
    const especialidadId = document.getElementById('especialidad').value;
    const medicoSelect = document.getElementById('medico');

    medicoSelect.innerHTML = '<option value="">Seleccione un médico</option>';
    medicoSelect.disabled = true;
    document.getElementById('horariosCard').style.display = 'none';

    if (!especialidadId) return;

    try {
        const response = await fetch(`${API_MEDICOS}?especialidad=${especialidadId}`);
        const medicos = await response.json();

        medicos.forEach(m => {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = m.nombre;
            medicoSelect.appendChild(option);
        });

        medicoSelect.disabled = false;
    } catch (error) {
        console.error(error);
        mostrarToast('Error cargando médicos', 'error');
    }
}

function seleccionarMedico() {
    const medicoId = document.getElementById('medico').value;

    if (!medicoId) {
        document.getElementById('horariosCard').style.display = 'none';
        return;
    }

    medicoSeleccionado = medicoId;
    document.getElementById('horariosCard').style.display = 'block';
    cargarHorarios();
}

// ============ LISTAR HORARIOS ============
async function cargarHorarios() {
    try {
        const response = await fetch(`${API_HORARIOS}?medico=${medicoSeleccionado}`, {
            headers: authHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            mostrarToast('No tienes permisos de administrador', 'error');
            return;
        }

        const horarios = await response.json();
        renderizarTabla(horarios);

    } catch (error) {
        console.error(error);
        mostrarToast('Error cargando horarios', 'error');
    }
}

function renderizarTabla(horarios) {
    const body = document.getElementById('horariosBody');
    const empty = document.getElementById('emptyMessage');

    body.innerHTML = '';

    if (!horarios.length) {
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    horarios.forEach(h => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${h.fecha}</td>
            <td>${h.hora_inicio}</td>
            <td>${h.hora_fin}</td>
            <td><span class="gh-badge ${h.activo ? 'activo' : 'inactivo'}">${h.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <div class="gh-actions">
                    <button class="gh-btn-toggle" onclick="toggleActivo(${h.id}, ${!h.activo})">
                        ${h.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="gh-btn-edit" onclick="abrirModalEditar(${h.id}, '${h.fecha}', '${h.hora_inicio}', '${h.hora_fin}')">Editar</button>
                    <button class="gh-btn-delete" onclick="eliminarHorario(${h.id})">Eliminar</button>
                </div>
            </td>
        `;

        body.appendChild(tr);
    });
}

// ============ AGREGAR HORARIO ============
async function agregarHorario(e) {
    e.preventDefault();
    clearErrors();

    const fecha = document.getElementById('fecha').value;
    const hora_inicio = document.getElementById('hora_inicio').value;
    const hora_fin = document.getElementById('hora_fin').value;

    let valid = true;

    if (!fecha) { showError('fecha', 'Seleccione una fecha'); valid = false; }
    if (!hora_inicio) { showError('hora_inicio', 'Seleccione hora de inicio'); valid = false; }
    if (!hora_fin) { showError('hora_fin', 'Seleccione hora de fin'); valid = false; }

    if (!valid) return;

    const btn = document.getElementById('btnAgregar');
    const txt = document.getElementById('btnAgregarText');

    btn.disabled = true;
    txt.innerHTML = '<div class="spinner"></div> Guardando...';

    try {
        const response = await fetch(API_HORARIOS, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                medico: medicoSeleccionado,
                fecha, hora_inicio, hora_fin
            })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast('Horario agregado correctamente', 'success');
            document.getElementById('formHorario').reset();
            cargarHorarios();
        } else {
            const mensaje = extraerPrimerError(data.errors) || data.message || 'No se pudo crear el horario';
            mostrarToast(mensaje, 'error');
        }

    } catch (error) {
        console.error(error);
        mostrarToast('Error de conexión', 'error');
    } finally {
        btn.disabled = false;
        txt.textContent = 'Agregar Horario';
    }
}

// ============ ACTIVAR / DESACTIVAR ============
async function toggleActivo(id, nuevoEstado) {
    try {
        const response = await fetch(`${API_HORARIOS}${id}/`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ activo: nuevoEstado })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast(nuevoEstado ? 'Horario activado' : 'Horario desactivado', 'success');
            cargarHorarios();
        } else {
            mostrarToast(data.message || 'No se pudo actualizar', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarToast('Error de conexión', 'error');
    }
}

// ============ EDITAR ============
function abrirModalEditar(id, fecha, hora_inicio, hora_fin) {
    document.getElementById('editId').value = id;
    document.getElementById('editFecha').value = fecha;
    document.getElementById('editHoraInicio').value = hora_inicio;
    document.getElementById('editHoraFin').value = hora_fin;
    document.getElementById('editModal').classList.add('show');
}

function cerrarModalEditar() {
    document.getElementById('editModal').classList.remove('show');
}

async function guardarEdicion(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const fecha = document.getElementById('editFecha').value;
    const hora_inicio = document.getElementById('editHoraInicio').value;
    const hora_fin = document.getElementById('editHoraFin').value;

    try {
        const response = await fetch(`${API_HORARIOS}${id}/`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ fecha, hora_inicio, hora_fin })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast('Horario actualizado', 'success');
            cerrarModalEditar();
            cargarHorarios();
        } else {
            const mensaje = extraerPrimerError(data.errors) || data.message || 'No se pudo actualizar';
            mostrarToast(mensaje, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarToast('Error de conexión', 'error');
    }
}

// ============ ELIMINAR ============
async function eliminarHorario(id) {
    if (!confirm('¿Seguro que deseas eliminar este horario?')) return;

    try {
        const response = await fetch(`${API_HORARIOS}${id}/`, {
            method: 'DELETE',
            headers: authHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast('Horario eliminado', 'success');
            cargarHorarios();
        } else {
            mostrarToast(data.message || 'No se pudo eliminar', 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarToast('Error de conexión', 'error');
    }
}

// ============ UTILIDADES ============
function showError(field, message) {
    const error = document.getElementById(`error-${field}`);
    if (error) {
        error.textContent = message;
        error.classList.add('show');
    }
}

function clearErrors() {
    document.querySelectorAll('.error-text').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
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