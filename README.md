# 🏥 Sistema de Citas Médicas

Proyecto académico que permite a pacientes registrarse, iniciar sesión, agendar citas médicas, consultar su historial de citas y cancelarlas. También incluye gestión de horarios médicos y administración del sistema.

---

## 📋 Descripción

El **Sistema de Citas Médicas** es una aplicación web desarrollada con Django y Django REST Framework en el backend, y HTML/CSS/JavaScript puro en el frontend (sin frameworks). Permite la gestión completa del flujo de citas médicas entre pacientes y médicos, con autenticación basada en JWT y notificaciones por correo electrónico.

El desarrollo se realizó de forma incremental, completando una **Historia de Usuario (HU)** a la vez antes de avanzar a la siguiente. El proyecto se encuentra **finalizado**, con todas las historias de usuario implementadas tanto en backend como en frontend.

---

## 🎯 Funcionalidades

### ✅ Implementadas (Completo)

| HU | Funcionalidad |
|----|----------------|
| HU1 | Registro de pacientes (modelo `Usuario` personalizado extendiendo `AbstractBaseUser`) |
| HU2 | Inicio de sesión con JWT, bloqueo tras 3 intentos fallidos y recuperación de contraseña por correo |
| HU3 | Agendamiento de citas médicas mediante asistente de 3 pasos, con validación de disponibilidad de horarios |
| HU4 | Visualización de citas (`mis_citas.html`) con filtros por estado y comprobante en PDF vía `window.print()` |
| HU5 | Cancelación de citas con validación de 24 horas, liberación del horario y modal de confirmación |
| HU6 | Gestión de horarios médicos — backend (modelo `HorarioMedico` con validación de solapamiento) y frontend (`gestion_horarios.html`) |
| HU7 | Administración del sistema (gestión de usuarios, médicos y citas desde un panel administrativo) |
| — | Landing page del sistema (`inicio.html`) |

El proyecto cuenta ahora con **todas sus vistas conectadas a la API real**, reemplazando los datos simulados (`// TODO`) que se usaban durante el desarrollo inicial del frontend.

---

## 🛠️ Tecnologías utilizadas

**Backend**
- Python / Django 6.0
- Django REST Framework
- `djangorestframework-simplejwt` (autenticación JWT)
- `django-cors-headers` (manejo de CORS)
- MySQL (gestionado con MySQL Workbench, vía `mysqlclient`)
- Gmail SMTP (envío de correos transaccionales)

**Frontend**
- HTML5, CSS3, JavaScript (vanilla, sin frameworks)

**Entorno de desarrollo**
- Visual Studio Code
- Sistema operativo: Windows

---

## 📁 Estructura del proyecto

```
PROYECTO/
│
├── .vscode/
│   └── launch.json
│
├── cita/                          # Aplicación principal (lógica de negocio)
│   ├── migrations/
│   ├── static/
│   │   ├── css/
│   │   │   ├── agendar_cita.css
│   │   │   ├── login.css
│   │   │   ├── medicitas.css
│   │   │   ├── mis_citas.css
│   │   │   ├── registro.css
│   │   │   ├── gestion_horarios.css
│   │   │   └── inicio.css
│   │   ├── img/
│   │   └── js/
│   │       ├── agendar_cita.js
│   │       ├── login.js
│   │       ├── medicitas.js
│   │       ├── mis_citas.js
│   │       ├── registro.js
│   │       ├── gestion_horarios.js
│   │       └── inicio.js
│   ├── templates/
│   │   └── cita/
│   │       ├── agendar_cita.html
│   │       ├── login.html
│   │       ├── medicitas.html
│   │       ├── mis_citas.html
│   │       ├── nueva_password.html
│   │       ├── registro.html
│   │       ├── gestion_horarios.html
│   │       ├── inicio.html
│   │       └── admin_panel.html
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py                   # Todas las vistas del backend están unificadas aquí
│
├── citas/                          # Configuración del proyecto Django
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── venv/                            # Entorno virtual
├── db.sqlite3                       # Residual de Django, sin uso (la BD real es MySQL)
├── requirements.txt
└── manage.py
```

---

## ⚙️ Requisitos previos

- Python 3.12 o superior (requerido por Django 6.0)
- MySQL Server + MySQL Workbench
- Cuenta de Gmail con contraseña de aplicación habilitada (para el envío de correos)
- pip / virtualenv

---

## 🚀 Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd PROYECTO

# 2. Crear y activar entorno virtual
python -m venv venv
venv\Scripts\activate      # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Crear la base de datos en MySQL Workbench
# crear una base de datos vacía, proyecto_citas

# 5. Aplicar migraciones
python manage.py makemigrations
python manage.py migrate

# 6. Crear superusuario (para acceder al panel de administración)
python manage.py createsuperuser

# 7. Ejecutar el servidor
python manage.py runserver
```

> ⚠️ Verifica que estos comandos coincidan con tu configuración real, en especial la conexión a MySQL en `citas/settings.py`.

---

## 🔐 Variables de entorno

El proyecto requiere configurar credenciales en `citas/settings.py` (o un archivo `.env` equivalente):

```env
# Base de datos
DB_NAME=citas_medicas_db
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# JWT
SECRET_KEY=

# Correo (Gmail SMTP)
EMAIL_HOST_USER = 'appcitas08@gmail.com'
EMAIL_HOST_PASSWORD = 'cnow wcbr djit aaev'

```

> ⚠️ Confirma los nombres exactos de las variables según cómo estén definidas en tu `citas/settings.py`.

---

## ▶️ Uso

1. Accede a `http://localhost:8000/` para ver la **página de inicio** (`inicio.html`).
2. Regístrate como paciente desde `registro.html`.
3. Inicia sesión (`login.html`) y agenda una cita siguiendo el asistente de 3 pasos (`agendar_cita.html`).
4. Consulta tus citas en `mis_citas.html`, descarga el comprobante en PDF o cancela una cita (si faltan más de 24h).
5. Si eres médico, gestiona tus horarios disponibles desde `gestion_horarios.html`.
6. Si eres administrador, accede al panel de administración del sistema para gestionar usuarios, médicos y citas.

---

## 🧠 Notas técnicas y aprendizajes del proyecto

- **Rutas duplicadas:** cuidado al combinar el prefijo `auth/` en `citas/urls.py` con otro `auth/` en `cita/urls.py`; genera rutas dobles rotas.
- **Montaje en raíz:** la app está montada en la raíz del dominio (no en `/citas/`), por lo que los endpoints deben definirse como `/auth/mis-citas/` y no `/citas/auth/mis-citas/`.
- **Consistencia de campos:** el campo `estado` se estandarizó en minúsculas usando `choices` de Django, para evitar discrepancias entre módulos.
- **UX en acciones restringidas:** en lugar de ocultar botones cuando aplica una regla de negocio (como la restricción de 24h para cancelar), se opta por mostrarlos deshabilitados, para mayor claridad para el usuario.
- **Caché de archivos estáticos:** evitar conflictos entre la carpeta `static/` de la app y una carpeta `staticfiles/` generada por `collectstatic`; en desarrollo se recomienda mantener `DEBUG=True`.
- **Diseño consistente:** las páginas nuevas (`gestion_horarios.html`, `inicio.html`) reutilizan las variables CSS definidas en `registro.css` para mantener una identidad visual unificada en todo el sistema.

---

## 👩‍💻 Autores

Proyecto desarrollado por **Sarita Salazar - Felipe Celis - Sharith Moreno - Johny Martínez** como trabajo académico.

---

## 📄 Licencia

Este proyecto fue desarrollado con fines educativos.