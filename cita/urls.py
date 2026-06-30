from django.urls import path
from . import views

urlpatterns = [
    # ── Páginas (HTML) ──
    path('', views.inicio_view, name='inicio'),
    path('registro/', views.registro_view, name='registro_view'),
    path('login/', views.login_view, name='login_view'),
    path('agendar-cita/', views.agendar_cita_view, name='agendar_cita_view'),
    path('mis_citas/', views.mis_citas_view, name='mis_citas'),
    path('restablecer/<uidb64>/<token>/', views.restablecer_password, name='restablecer_password'),
    path('gestion-horarios/', views.gestion_horarios_view, name='gestion_horarios_view'),
    path('medicos/', views.obtener_medicos, name='obtener_medicos'),
    path('gestion-usuarios/', views.gestion_usuarios_view, name='gestion_usuarios_view'),

    # ── API (todas bajo auth/ para no chocar con las rutas de página) ──
    path('auth/register/', views.RegistroAPIView.as_view(), name='registro'),
    path('auth/login/', views.LoginAPIView.as_view(), name='login'),
    path('auth/recuperar/', views.RecuperarContrasenaAPIView.as_view(), name='recuperar'),
    path('auth/agendar_cita/', views.AgendarCitaAPIView.as_view(), name='agendar_cita'),
    path('auth/mis_citas/', views.MisCitasView.as_view(), name='mis_citas'),
    path('auth/miscitas/<int:cita_id>/', views.DetalleCitaView.as_view(), name='detalle-cita'),
    path('auth/mis-citas/<int:cita_id>/cancelar/', views.CancelarCitaAPIView.as_view(), name='cancelar-cita'),
    path('auth/horarios/', views.HorarioMedicoListCreateAPIView.as_view(), name='horarios-list-create'),
    path('auth/horarios/<int:horario_id>/', views.HorarioMedicoDetailAPIView.as_view(), name='horario-detail'),
    path('auth/usuarios/', views.UsuarioAdminListAPIView.as_view(), name='usuarios-list'),
    path('auth/usuarios/<int:usuario_id>/', views.UsuarioAdminDetailAPIView.as_view(), name='usuario-detail'),
]