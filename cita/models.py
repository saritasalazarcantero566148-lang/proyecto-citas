from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from datetime import timedelta


class UsuarioManager(BaseUserManager):

    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError('El correo es obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(correo, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):

    correo            = models.EmailField(unique=True)
    nombre_completo   = models.CharField(max_length=150)
    documento         = models.CharField(max_length=20, unique=True)
    telefono          = models.CharField(max_length=15, blank=True, null=True)
    fecha_nacimiento  = models.DateField(blank=True, null=True)
    sexo              = models.CharField(
                            max_length=1,
                            choices=[('M','Masculino'),('F','Femenino'),('O','Otro')],
                            blank=True,
                            null=True
                        )
    eps               = models.CharField(max_length=100, blank=True, null=True)
    alergias          = models.TextField(blank=True, null=True)
    fecha_registro    = models.DateTimeField(auto_now_add=True)
    is_active         = models.BooleanField(default=True)
    is_staff          = models.BooleanField(default=False)
    intentos_fallidos = models.IntegerField(default=0)
    bloqueado_hasta   = models.DateTimeField(blank=True, null=True)

    USERNAME_FIELD  = 'correo'
    REQUIRED_FIELDS = ['nombre_completo', 'documento']

    objects = UsuarioManager() 

    def __str__(self):
        return self.correo

    def esta_bloqueado(self):
        if self.bloqueado_hasta:
            if timezone.now() < self.bloqueado_hasta:
                return True
        self.intentos_fallidos = 0
        self.bloqueado_hasta = None
        self.save()
        return False

    def registrar_intento_fallido(self):
        self.intentos_fallidos += 1
        if self.intentos_fallidos >= 3:
            self.bloqueado_hasta = timezone.now() + timedelta(minutes=15)
        self.save()

    def resetear_intentos(self):
        self.intentos_fallidos = 0
        self.bloqueado_hasta = None
        self.save()


class Especialidad(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre
    
class Medico(models.Model):
    nombre = models.CharField(max_length=150)

    especialidad = models.ForeignKey(
        Especialidad,
        on_delete=models.CASCADE
    )

    def __str__(self):
        return self.nombre
    
class Cita(models.Model):

    ESTADO_PENDIENTE = 'pendiente'
    ESTADO_REALIZADA = 'realizada'
    ESTADO_CANCELADA = 'cancelada'

    ESTADO_CHOICES = [
        (ESTADO_PENDIENTE, 'Pendiente'),
        (ESTADO_REALIZADA, 'Realizada'),
        (ESTADO_CANCELADA, 'Cancelada'),
    ]

    paciente = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE
    )

    medico = models.ForeignKey(
        Medico,
        on_delete=models.CASCADE
    )

    fecha = models.DateField()
    hora = models.TimeField()

    # HU5: se estandariza a minúsculas porque así es como el frontend
    # (badges, filtros, clases CSS) ya compara el estado.
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default=ESTADO_PENDIENTE
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.paciente.nombre_completo} - {self.fecha} {self.hora} ({self.estado})"


class HorarioMedico(models.Model):
    """
    HU6 - Gestión de horarios del médico.

    Cada registro es una franja horaria (rango) que el médico ofrece
    en un día puntual. Solo las franjas con activo=True se ofrecen
    a los pacientes al momento de agendar.
    """

    medico = models.ForeignKey(
        Medico,
        on_delete=models.CASCADE,
        related_name='horarios'
    )

    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    activo = models.BooleanField(default=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha', 'hora_inicio']

    def __str__(self):
        estado = 'activo' if self.activo else 'inactivo'
        return f"{self.medico.nombre} - {self.fecha} {self.hora_inicio}-{self.hora_fin} ({estado})"