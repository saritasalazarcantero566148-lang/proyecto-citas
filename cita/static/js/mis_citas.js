// =============================================
//  mis_citas.js — HU4: Consultar Mis Citas
//  Depende de: JWT en localStorage ('access_token', 'nombre_usuario')
// =============================================

// ── Endpoints ──────────────────────────────────────────────────
// TODO: El GET de la lista (cargarCitas) sigue usando datos simulados.
// Cuando lo conectes, usa:
//   const resp = await fetch(API_CITAS, { headers: getAuthHeaders() });
//
// El endpoint de CANCELAR (HU5) ya está conectado al backend real.
// ──────────────────────────────────────────────────────────────

const API_CITAS         = '/auth/mis-citas/';
const API_CITA_DETALLE  = (id) => `/auth/mis-citas/${id}/`;
const API_CANCELAR_CITA = (id) => `/auth/mis-citas/${id}/cancelar/`;

// ── Estado global ──────────────────────────────────────────────
let todasLasCitas = [];
let filtroActual  = 'todas';
let citaActualDetalle = null;            // cita abierta en el modal de comprobante
let citaSeleccionadaParaCancelar = null; // cita pendiente de confirmar cancelación

// ── Referencias DOM ───────────────────────────────────────────
const loadingState   = document.getElementById('loadingState');
const emptyState     = document.getElementById('emptyState');
const tableWrapper   = document.getElementById('tableWrapper');
const citasBody      = document.getElementById('citasBody');
const countPendientes = document.getElementById('countPendientes');
const countRealizadas = document.getElementById('countRealizadas');
const countCanceladas = document.getElementById('countCanceladas');

// =============================================
//  INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacion();
    cargarNombreUsuario();
    cargarCitas();
    inicializarFiltros();
    inicializarModal();
    inicializarModalCancelacion();
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
});

// =============================================
//  AUTENTICACIÓN
// =============================================
function verificarAutenticacion() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login/';
    }
}

function cargarNombreUsuario() {
    const nombre = localStorage.getItem('nombre_usuario') || 'Usuario';
    document.getElementById('userName').textContent = nombre;

    // Avatar con inicial
    const avatar = document.getElementById('userAvatar');
    avatar.textContent = nombre.charAt(0).toUpperCase();
}

function cerrarSesion() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('nombre_usuario');
    window.location.href = '/login/';
}

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// =============================================
//  CARGA DE CITAS
// =============================================
async function cargarCitas(estado = null) {
    mostrarEstado('loading');

    // ── Datos simulados ────────────────────────────────────────
    // TODO: Reemplazar este bloque por:
    //
    //   const url = estado ? `${API_CITAS}?estado=${estado}` : API_CITAS;
    //   const resp = await fetch(url, { headers: getAuthHeaders() });
    //   if (!resp.ok) throw new Error('Error al cargar citas');
    //   const data = await resp.json();
    //   todasLasCitas = data;
    //
    // ──────────────────────────────────────────────────────────
    await simularDelay(600);

    // Fechas dinámicas para las citas "pendiente" simuladas, así siempre se
    // puede demostrar el caso cancelable (>24h) y el no-cancelable (<24h)
    // sin importar el día en que se pruebe.
    const enPocasHoras = new Date(Date.now() + 5 * 60 * 60 * 1000);   // dentro de 24h
    const enUnaSemana  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fuera de 24h
    const aFechaISO = (d) => d.toISOString().split('T')[0];
    const aHoraISO  = (d) => d.toTimeString().slice(0, 5);

    todasLasCitas = [
        {
            id: 1,
            fecha: aFechaISO(enPocasHoras),
            hora: aHoraISO(enPocasHoras),
            medico_nombre: 'Dr. Carlos Ramírez',
            especialidad_nombre: 'Cardiología',
            estado: 'pendiente',
            notas: 'Traer resultados de exámenes anteriores',
            direccion: 'Clínica Central, Piso 3, Consultorio 305',
            paciente_nombre: localStorage.getItem('nombre_usuario') || 'Paciente',
            numero_comprobante: 'CIT-00001',
        },
        {
            id: 2,
            fecha: aFechaISO(enUnaSemana),
            hora: aHoraISO(enUnaSemana),
            medico_nombre: 'Dra. María González',
            especialidad_nombre: 'Dermatología',
            estado: 'pendiente',
            notas: '',
            direccion: 'Clínica Norte, Piso 1, Consultorio 102',
            paciente_nombre: localStorage.getItem('nombre_usuario') || 'Paciente',
            numero_comprobante: 'CIT-00002',
        },
        {
            id: 3,
            fecha: '2025-06-20',
            hora: '10:00',
            medico_nombre: 'Dr. Luis Herrera',
            especialidad_nombre: 'Medicina General',
            estado: 'realizada',
            notas: 'Control anual completado',
            direccion: 'Clínica Central, Piso 2, Consultorio 210',
            paciente_nombre: localStorage.getItem('nombre_usuario') || 'Paciente',
            numero_comprobante: 'CIT-00003',
        },
        {
            id: 4,
            fecha: '2025-06-05',
            hora: '08:00',
            medico_nombre: 'Dra. Ana Morales',
            especialidad_nombre: 'Oftalmología',
            estado: 'cancelada',
            notas: 'Paciente canceló por viaje',
            direccion: 'Clínica Sur, Piso 4, Consultorio 401',
            paciente_nombre: localStorage.getItem('nombre_usuario') || 'Paciente',
            numero_comprobante: 'CIT-00004',
        },
        {
            id: 5,
            fecha: '2025-05-28',
            hora: '14:00',
            medico_nombre: 'Dr. Jorge Vargas',
            especialidad_nombre: 'Traumatología',
            estado: 'realizada',
            notas: '',
            direccion: 'Clínica Este, Piso 2, Consultorio 205',
            paciente_nombre: localStorage.getItem('nombre_usuario') || 'Paciente',
            numero_comprobante: 'CIT-00005',
        },
    ];

    actualizarContadores();
    renderizarTabla(filtroActual);
}

// =============================================
//  CONTADORES
// =============================================
function actualizarContadores() {
    countPendientes.textContent = todasLasCitas.filter(c => c.estado === 'pendiente').length;
    countRealizadas.textContent = todasLasCitas.filter(c => c.estado === 'realizada').length;
    countCanceladas.textContent = todasLasCitas.filter(c => c.estado === 'cancelada').length;
}

// =============================================
//  FILTROS
// =============================================
function inicializarFiltros() {
    // Tabs de filtro
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filtroActual = tab.dataset.estado;
            renderizarTabla(filtroActual);
        });
    });

    // Clic en tarjetas de resumen → filtrar directo
    document.querySelectorAll('.stat-card[data-filtro]').forEach(card => {
        card.addEventListener('click', () => {
            const estado = card.dataset.filtro;
            filtroActual = estado;
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            const tabTarget = document.querySelector(`.filter-tab[data-estado="${estado}"]`);
            if (tabTarget) tabTarget.classList.add('active');
            renderizarTabla(estado);
        });
    });
}

// =============================================
//  HU5 — REGLA DE LAS 24 HORAS
// =============================================
function puedeCancelarse(cita) {
    if (cita.estado !== 'pendiente') return false;

    const fechaHoraCita = new Date(`${cita.fecha}T${cita.hora}`);
    const horasRestantes = (fechaHoraCita - new Date()) / (1000 * 60 * 60);

    return horasRestantes >= 24;
}

// =============================================
//  RENDERIZADO DE TABLA
// =============================================
function renderizarTabla(estado) {
    const citas = estado === 'todas'
        ? todasLasCitas
        : todasLasCitas.filter(c => c.estado === estado);

    if (citas.length === 0) {
        mostrarEstado('empty');
        return;
    }

    citasBody.innerHTML = citas.map(cita => {
        const esPendiente = cita.estado === 'pendiente';
        const cancelable  = puedeCancelarse(cita);

        const botonCancelar = esPendiente ? `
            <button class="btn-cancelar"
                ${cancelable ? `onclick="abrirConfirmacionCancelacion(${cita.id})"` : 'disabled'}
                title="${cancelable ? 'Cancelar esta cita' : 'Solo se puede cancelar con 24h de anticipación'}">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Cancelar
            </button>` : '';

        return `
        <tr>
            <td class="fecha-cell">${formatearFecha(cita.fecha)}</td>
            <td class="hora-cell">${cita.hora}</td>
            <td>${cita.especialidad_nombre}</td>
            <td class="medico-cell">${cita.medico_nombre}</td>
            <td><span class="badge badge-${cita.estado}">${capitalizar(cita.estado)}</span></td>
            <td>
                <div class="acciones-cell">
                    <button class="btn-ver" onclick="abrirDetalle(${cita.id})">
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        Ver
                    </button>
                    ${botonCancelar}
                </div>
            </td>
        </tr>
    `;
    }).join('');

    mostrarEstado('table');
}

// =============================================
//  MODAL DETALLE / COMPROBANTE
// =============================================
function inicializarModal() {
    const modal = document.getElementById('modalDetalle');

    document.getElementById('btnCerrarModal').addEventListener('click', cerrarModal);
    document.getElementById('btnCerrarModal2').addEventListener('click', cerrarModal);
    document.getElementById('btnDescargarPDF').addEventListener('click', generarPDF);
    document.getElementById('btnCancelarDesdeModal').addEventListener('click', () => {
        cerrarModal();
        abrirConfirmacionCancelacion(citaActualDetalle);
    });

    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal();
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
}

// =============================================
//  HU5 — MODAL DE CONFIRMACIÓN DE CANCELACIÓN
// =============================================
function inicializarModalCancelacion() {
    const modal = document.getElementById('modalConfirmarCancelacion');

    document.getElementById('btnNoCancelar').addEventListener('click', cerrarModalCancelacion);
    document.getElementById('btnSiCancelar').addEventListener('click', ejecutarCancelacion);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalCancelacion();
    });
}

function abrirConfirmacionCancelacion(citaId) {
    citaSeleccionadaParaCancelar = citaId;
    document.getElementById('modalConfirmarCancelacion').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function cerrarModalCancelacion() {
    document.getElementById('modalConfirmarCancelacion').classList.remove('show');
    document.body.style.overflow = '';
    citaSeleccionadaParaCancelar = null;
}

async function ejecutarCancelacion() {
    if (!citaSeleccionadaParaCancelar) return;

    const citaId = citaSeleccionadaParaCancelar;
    const boton  = document.getElementById('btnSiCancelar');
    const textoOriginal = boton.textContent;

    boton.disabled = true;
    boton.textContent = 'Cancelando...';

    try {
        const resp = await fetch(API_CANCELAR_CITA(citaId), {
            method: 'POST',
            headers: getAuthHeaders()
        });

        const data = await resp.json();

        if (resp.ok && data.success) {
            // Actualiza la cita localmente para reflejar el cambio al instante
            const cita = todasLasCitas.find(c => c.id === citaId);
            if (cita) cita.estado = 'cancelada';

            actualizarContadores();
            renderizarTabla(filtroActual);
            cerrarModalCancelacion();
            mostrarToast('Cita cancelada correctamente. Revisa tu correo.', 'success');
        } else {
            mostrarToast(data.message || 'No se pudo cancelar la cita.', 'error');
        }
    } catch (error) {
        mostrarToast('Error de conexión al cancelar la cita.', 'error');
    } finally {
        boton.disabled = false;
        boton.textContent = textoOriginal;
    }
}

async function abrirDetalle(citaId) {
    // ── Búsqueda simulada ──────────────────────────────────────
    // TODO: Reemplazar por:
    //   const resp = await fetch(API_CITA_DETALLE(citaId), { headers: getAuthHeaders() });
    //   const cita = await resp.json();
    // ──────────────────────────────────────────────────────────
    const cita = todasLasCitas.find(c => c.id === citaId);
    if (!cita) return;

    citaActualDetalle = citaId;

    // Rellenar modal
    document.getElementById('comprobanteNumero').textContent = cita.numero_comprobante || `CIT-${String(cita.id).padStart(5, '0')}`;
    document.getElementById('detPaciente').textContent      = cita.paciente_nombre || '—';
    document.getElementById('detEspecialidad').textContent  = cita.especialidad_nombre;
    document.getElementById('detMedico').textContent        = cita.medico_nombre;
    document.getElementById('detFecha').textContent         = formatearFecha(cita.fecha);
    document.getElementById('detHora').textContent          = cita.hora;
    document.getElementById('detLugar').textContent         = cita.direccion || 'No especificado';

    // Badge de estado
    const badge = document.getElementById('comprobanteBadge');
    badge.textContent = capitalizar(cita.estado);
    badge.className = `badge badge-${cita.estado}`;

    // Notas
    const notasWrapper = document.getElementById('notasWrapper');
    const detNotas     = document.getElementById('detNotas');
    if (cita.notas) {
        detNotas.textContent = cita.notas;
        notasWrapper.classList.remove('hidden');
    } else {
        notasWrapper.classList.add('hidden');
    }

    // HU5: el botón "Cancelar Cita" se oculta solo si la cita ya no está
    // pendiente (ya fue cancelada/atendida). Si está pendiente pero falta
    // menos de 24h, se muestra DESHABILITADO (con tooltip) en vez de
    // ocultarse, para que sea claro que es la regla de las 24h y no un error.
    const btnCancelarModal = document.getElementById('btnCancelarDesdeModal');
    if (cita.estado !== 'pendiente') {
        btnCancelarModal.classList.add('hidden');
    } else {
        btnCancelarModal.classList.remove('hidden');
        const cancelableModal = puedeCancelarse(cita);
        btnCancelarModal.disabled = !cancelableModal;
        btnCancelarModal.title = cancelableModal
            ? 'Cancelar esta cita'
            : 'Solo se puede cancelar con un mínimo de 24 horas de anticipación';
    }

    // Abrir modal
    document.getElementById('modalDetalle').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    document.getElementById('modalDetalle').classList.remove('show');
    document.body.style.overflow = '';
}

// =============================================
//  GENERACIÓN DE PDF
// =============================================
function generarPDF() {
    const numero      = document.getElementById('comprobanteNumero').textContent;
    const paciente    = document.getElementById('detPaciente').textContent;
    const especialidad = document.getElementById('detEspecialidad').textContent;
    const medico      = document.getElementById('detMedico').textContent;
    const fecha       = document.getElementById('detFecha').textContent;
    const hora        = document.getElementById('detHora').textContent;
    const lugar       = document.getElementById('detLugar').textContent;
    const estado      = document.getElementById('comprobanteBadge').textContent;
    const notas       = document.getElementById('detNotas').textContent;
    const notasHidden = document.getElementById('notasWrapper').classList.contains('hidden');
    const fechaEmision = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

    const contenidoHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comprobante ${numero}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
  .header { display: flex; align-items: center; gap: 16px; padding-bottom: 20px;
            border-bottom: 2px solid #2563eb; margin-bottom: 28px; }
  .logo-box { width: 48px; height: 48px; background: linear-gradient(135deg, #2563eb, #3b82f6);
              border-radius: 10px; display: flex; align-items: center; justify-content: center;
              color: white; font-size: 22px; font-weight: 700; flex-shrink: 0; }
  .header-info h1 { font-size: 20px; font-weight: 700; color: #1e293b; }
  .header-info p  { font-size: 12px; color: #94a3b8; font-family: monospace; margin-top: 2px; }
  .badge { padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
           margin-left: auto; }
  .badge-pendiente  { background: #fef3c7; color: #d97706; }
  .badge-realizada  { background: #d1fae5; color: #059669; }
  .badge-cancelada  { background: #fee2e2; color: #dc2626; }
  .section-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;
                   letter-spacing: 0.08em; margin-bottom: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 30px; margin-bottom: 24px; }
  .item label { display: block; font-size: 11px; color: #94a3b8; font-weight: 600;
                text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
  .item span  { font-size: 14px; font-weight: 500; color: #1e293b; }
  .notas-box { background: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 28px; }
  .notas-box label { display: block; font-size: 11px; color: #94a3b8; font-weight: 600;
                     text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .notas-box p  { font-size: 13px; color: #64748b; line-height: 1.5; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0;
            font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo-box">M</div>
    <div class="header-info">
      <h1>Comprobante de Cita Médica</h1>
      <p>${numero}</p>
    </div>
    <span class="badge badge-${estado.toLowerCase()}">${estado}</span>
  </div>

  <div class="section-title">Datos de la Cita</div>
  <div class="grid">
    <div class="item"><label>Paciente</label><span>${paciente}</span></div>
    <div class="item"><label>Especialidad</label><span>${especialidad}</span></div>
    <div class="item"><label>Médico</label><span>${medico}</span></div>
    <div class="item"><label>Fecha</label><span>${fecha}</span></div>
    <div class="item"><label>Hora</label><span>${hora}</span></div>
    <div class="item"><label>Lugar</label><span>${lugar}</span></div>
  </div>

  ${!notasHidden ? `
  <div class="notas-box">
    <label>Indicaciones</label>
    <p>${notas}</p>
  </div>` : ''}

  <div class="footer">
    <span>Emitido el ${fechaEmision} · Sistema de Citas Médicas</span>
    <span>${numero}</span>
  </div>
</body>
</html>`;

    // Abrir en nueva ventana e imprimir como PDF
    const ventana = window.open('', '_blank');
    ventana.document.write(contenidoHTML);
    ventana.document.close();
    ventana.onload = () => {
        ventana.focus();
        ventana.print();
    };

    mostrarToast('Comprobante listo para descargar', 'success');
}

// =============================================
//  UTILIDADES
// =============================================
function mostrarEstado(estado) {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    tableWrapper.classList.add('hidden');

    if (estado === 'loading') loadingState.classList.remove('hidden');
    if (estado === 'empty')   emptyState.classList.remove('hidden');
    if (estado === 'table')   tableWrapper.classList.remove('hidden');
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '—';
    const [y, m, d] = fechaStr.split('-');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

function capitalizar(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function simularDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;

    const icono = tipo === 'success'
        ? `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
           </svg>`
        : `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
           </svg>`;

    toast.innerHTML = `${icono} ${mensaje}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}