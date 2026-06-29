const API_CITA = '/auth/agendar_cita/';


document
.getElementById('citaForm')
.addEventListener('submit', async function(e){

    e.preventDefault();

    clearErrors();

    const medico = document.getElementById('medico').value;
    const fecha  = document.getElementById('fecha').value;
    const hora   = document.getElementById('hora').value;

    let valid = true;

    if(!medico){
        showError('medico','Seleccione un médico');
        valid = false;
    }

    if(!fecha){
        showError('fecha','Seleccione una fecha');
        valid = false;
    }

    if(!hora){
        showError('hora','Seleccione una hora');
        valid = false;
    }

    if(!valid){
        shakeForm();
        return;
    }

    const btn = document.getElementById('btnAgendar');
    const txt = document.getElementById('btnAgendarText');

    btn.disabled = true;
    txt.innerHTML = '<div class="spinner"></div> Guardando...';

   try {

    const usuario = JSON.parse(
        localStorage.getItem('usuario')
    );

    const pacienteId = usuario.id;

    const response = await fetch(API_CITA,{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify({
            paciente: pacienteId,
            medico: medico,
            fecha: fecha,
            hora: hora
        })
    });

    const data = await response.json();

if(response.ok){
    console.log("CITA GUARDADA");

    const medicoSelect =
        document.getElementById('medico');

    const nombreMedico =
        medicoSelect.options[
            medicoSelect.selectedIndex
        ].text;

    mostrarModalCita(
        nombreMedico,
        fecha,
        hora
    );

}else{

    alert(data.message);
}

} catch(error){

    console.error(error);
    alert('Error de conexión');

}

finally{

    btn.disabled = false;
    txt.textContent = 'Agendar Cita';
}

});

function showError(field,message){

    const error =
        document.getElementById(`error-${field}`);

    error.textContent = message;
    error.classList.add('show');
}

function clearErrors(){

    document
    .querySelectorAll('.error-text')
    .forEach(el=>{

        el.textContent = '';
        el.classList.remove('show');

    });
}

window.onload = function() {

    const especialidad =
        document.getElementById('especialidad');

    const medico =
        document.getElementById('medico');

    console.log("Especialidad encontrada:", especialidad);
    console.log("Medico encontrado:", medico);

    especialidad.onchange = async function() {

        console.log("Evento ejecutado");
        console.log("ID especialidad:", this.value);

        const response = await fetch(
            `/medicos/?especialidad=${this.value}`
        );

        const medicos = await response.json();

        console.log("Médicos recibidos:", medicos);

        medico.innerHTML =
            '<option value="">Seleccione un médico</option>';

        medicos.forEach(item => {

            medico.innerHTML += `
                <option value="${item.id}">
                    ${item.nombre}
                </option>
            `;
        });
    };
};

function mostrarModalCita(medico, fecha, hora) {


    document.getElementById('modalMedico').textContent = medico;
    document.getElementById('modalFecha').textContent = fecha;
    document.getElementById('modalHora').textContent = hora;

    document.getElementById('modalCita').style.display = 'flex';
}

function cerrarModalCita() {

    document.getElementById(
        'modalCita'
    ).style.display = 'none';

    window.location.href = '/mis_citas/';
}

function cerrarModalCita() {

    document.getElementById(
        'modalCita'
    ).style.display = 'none';

    window.location.href = '/mis_citas/';
}