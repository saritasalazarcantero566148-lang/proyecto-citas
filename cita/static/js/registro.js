
        // ===== CONFIGURACIÓN =====
        const API_URL = 'http://localhost:8000/auth/register/';
        let currentStep = 1;

        // ===== NAVEGACIÓN ENTRE PASOS =====
        function showStep(step) {
            // Ocultar todas las secciones
            document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`section${step}`).classList.add('active');

            // Actualizar stepper
            for (let i = 1; i <= 3; i++) {
                const num = document.getElementById(`step${i}Num`);
                const label = document.getElementById(`step${i}Label`);
                
                if (i < step) {
                    num.className = 'step-number completed';
                    num.innerHTML = '✓';
                    label.className = 'step-label';
                } else if (i === step) {
                    num.className = 'step-number active';
                    num.innerHTML = i;
                    label.className = 'step-label active';
                } else {
                    num.className = 'step-number pending';
                    num.innerHTML = i;
                    label.className = 'step-label';
                }
            }

            // Actualizar líneas
            document.getElementById('line1').className = step > 1 ? 'step-line completed' : 'step-line';
            document.getElementById('line2').className = step > 2 ? 'step-line completed' : 'step-line';

            currentStep = step;
        }

        function nextStep(step) {
            if (validateStep(currentStep)) {
                showStep(step);
            }
        }

        function prevStep(step) {
            showStep(step);
        }

        // ===== VALIDACIÓN POR PASO =====
        function validateStep(step) {
            let valid = true;
            clearErrors();

            if (step === 1) {
                // Validar correo
                const correo = document.getElementById('correo').value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!correo) {
                    showError('correo', 'El correo electrónico es obligatorio.');
                    valid = false;
                } else if (!emailRegex.test(correo)) {
                    showError('correo', 'Ingresa un correo electrónico válido.');
                    valid = false;
                }

                // Validar contraseña
                const pass = document.getElementById('contrasena').value;
                if (!pass) {
                    showError('contrasena', 'La contraseña es obligatoria.');
                    valid = false;
                } else if (!isPasswordValid(pass)) {
                    showError('contrasena', 'La contraseña no cumple con los requisitos.');
                    valid = false;
                }

                // Validar confirmación
                const confirm = document.getElementById('confirmar_contrasena').value;
                if (!confirm) {
                    showError('confirmar', 'Debes confirmar tu contraseña.');
                    valid = false;
                } else if (pass !== confirm) {
                    showError('confirmar', 'Las contraseñas no coinciden.');
                    valid = false;
                }
            }

            if (step === 2) {
                // Validar nombre
                const nombre = document.getElementById('nombre_completo').value.trim();
                if (!nombre) {
                    showError('nombre', 'El nombre completo es obligatorio.');
                    valid = false;
                } else if (nombre.length < 3) {
                    showError('nombre', 'El nombre debe tener al menos 3 caracteres.');
                    valid = false;
                }

                // Validar documento
                const doc = document.getElementById('documento').value.trim();
                if (!doc) {
                    showError('documento', 'El documento es obligatorio.');
                    valid = false;
                } else if (!/^\d{5,}$/.test(doc)) {
                    showError('documento', 'El documento debe contener solo números (mín. 5 dígitos).');
                    valid = false;
                }
            }

            if (!valid) {
                shakeForm();
            }

            return valid;
        }

        // ===== VALIDACIÓN DE CONTRASEÑA EN TIEMPO REAL =====
        document.getElementById('contrasena').addEventListener('input', function() {
            const pass = this.value;
            const reqs = {
                length: pass.length >= 8,
                mayus: /[A-Z]/.test(pass),
                num: /\d/.test(pass),
                esp: /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/`~]/.test(pass)
            };

            // Actualizar requisitos visuales
            updateReq('req-length', reqs.length);
            updateReq('req-mayus', reqs.mayus);
            updateReq('req-num', reqs.num);
            updateReq('req-esp', reqs.esp);

            // Calcular fortaleza
            const met = Object.values(reqs).filter(v => v).length;
            const segments = ['seg1', 'seg2', 'seg3', 'seg4'];
            const texts = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
            const colors = ['', 'weak', 'fair', 'good', 'strong'];

            segments.forEach((id, i) => {
                const el = document.getElementById(id);
                el.className = 'strength-segment';
                if (i < met) {
                    el.classList.add(colors[met]);
                }
            });

            document.getElementById('strengthText').textContent = texts[met];
            document.getElementById('strengthText').style.color = 
                met === 0 ? 'var(--text-muted)' :
                met <= 2 ? 'var(--error)' :
                met === 3 ? 'var(--warning)' : 'var(--success)';
        });

        function updateReq(id, met) {
            const el = document.getElementById(id);
            if (met) {
                el.classList.add('met');
                el.querySelector('svg').innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path><circle cx="12" cy="12" r="10" stroke-width="2"></circle>';
            } else {
                el.classList.remove('met');
                el.querySelector('svg').innerHTML = '<circle cx="12" cy="12" r="10" stroke-width="2"></circle>';
            }
        }

        function isPasswordValid(pass) {
            return pass.length >= 8 && 
                   /[A-Z]/.test(pass) && 
                   /\d/.test(pass) && 
                   /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/`~]/.test(pass);
        }

        // ===== ENVÍO DEL FORMULARIO =====
        document.getElementById('registroForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            // Validar paso 3
            if (!validateStep(3)) return;

            // Validar términos
            if (!document.getElementById('terminos').checked) {
                showError('terminos', 'Debes aceptar los términos y condiciones.');
                shakeForm();
                return;
            }

            // Preparar datos
            const formData = {
                correo: document.getElementById('correo').value.trim(),
                contrasena: document.getElementById('contrasena').value,
                confirmar_contrasena: document.getElementById('confirmar_contrasena').value,
                nombre_completo: document.getElementById('nombre_completo').value.trim(),
                documento: document.getElementById('documento').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                fecha_nacimiento: document.getElementById('fecha_nacimiento').value || null,
                sexo: document.getElementById('sexo').value || null,
                eps: document.getElementById('eps').value.trim() || null,
                alergias: document.getElementById('alergias').value.trim() || null
            };

            // Limpiar nulls vacíos
            Object.keys(formData).forEach(key => {
                if (formData[key] === null) delete formData[key];
            });

            // Mostrar loading
            const btn = document.getElementById('btnSubmit');
            const btnText = document.getElementById('btnText');
            const originalText = btnText.textContent;
            btn.disabled = true;
            btnText.innerHTML = '<div class="spinner"></div> Registrando...';

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Éxito
                    showToast('¡Registro exitoso! Revisa tu correo.', 'success');
                    document.getElementById('modalEmail').textContent = data.data.correo;
                    document.getElementById('successModal').classList.add('show');
                } else {
                    // Error del servidor
                    const errors = data.errors || {};
                    let errorMsg = data.message || 'Error al registrar. Intenta de nuevo.';
                    
                    // Mostrar errores específicos de campos
                    if (errors.correo) showError('correo', errors.correo[0]);
                    if (errors.documento) showError('documento', errors.documento[0]);
                    if (errors.contrasena) showError('contrasena', errors.contrasena[0]);
                    if (errors.confirmar_contrasena) showError('confirmar', errors.confirmar_contrasena[0]);
                    if (errors.non_field_errors) errorMsg = errors.non_field_errors[0];
                    
                    showAlert('error', errorMsg);
                    shakeForm();
                }

            } catch (error) {
                showAlert('error', 'Error de conexión. Verifica que el servidor esté corriendo.');
                console.error('Error:', error);
            } finally {
                btn.disabled = false;
                btnText.textContent = originalText;
            }
        });

        // ===== UTILIDADES =====
        function showError(field, message) {
            const input = document.getElementById(field === 'confirmar' ? 'confirmar_contrasena' : 
                                                  field === 'terminos' ? 'terminos' : field);
            const errorEl = document.getElementById(`error-${field}`);
            
            if (input && input.tagName !== 'INPUT') {
                // Para checkbox
                errorEl.textContent = message;
                errorEl.classList.add('show');
                return;
            }
            
            if (input) {
                input.classList.add('error');
                input.classList.remove('success');
            }
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
            document.querySelectorAll('input, select, textarea').forEach(el => {
                el.classList.remove('error');
            });
            document.getElementById('errorAlert').classList.remove('show');
        }

        function showAlert(type, message) {
            const alert = document.getElementById(`${type}Alert`);
            document.getElementById(`${type}Text`).textContent = message;
            alert.classList.add('show');
            setTimeout(() => alert.classList.remove('show'), 5000);
        }

        function showToast(message, type) {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = 'toast toast-${type}';
            toast.innerHTML = `
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' 
                        ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
                        : 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
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

        // ===== LIMPIAR ERRORES AL ESCRIBIR =====
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const errorEl = document.getElementById(`error-${this.id}`);
                if (errorEl) {
                    errorEl.textContent = '';
                    errorEl.classList.remove('show');
                }
            });
        });

        // ===== ENTER PARA AVANZAR =====
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentStep < 3) {
                        nextStep(currentStep + 1);
                    }
                }
            });
        });
