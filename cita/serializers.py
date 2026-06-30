import re
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario, Cita, HorarioMedico


class RegistroSerializer(serializers.ModelSerializer):

    contrasena = serializers.CharField(write_only=True, min_length=8)
    confirmar_contrasena = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            'correo',
            'contrasena',
            'confirmar_contrasena',
            'nombre_completo',
            'documento',
            'telefono',
            'fecha_nacimiento',
            'sexo',
            'eps',
            'alergias',
        ]

    def validate_correo(self, value):
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
            raise serializers.ValidationError('El formato del correo no es válido.')
        if Usuario.objects.filter(correo=value).exists():
            raise serializers.ValidationError('Este correo ya está registrado.')
        return value

    def validate_documento(self, value):
        if not value.isdigit() or len(value) < 5:
            raise serializers.ValidationError('Solo números, mínimo 5 dígitos.')
        if Usuario.objects.filter(documento=value).exists():
            raise serializers.ValidationError('Este documento ya está registrado.')
        return value

    def validate_contrasena(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Mínimo 8 caracteres.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Debe tener al menos 1 mayúscula.')
        if not re.search(r'\d', value):
            raise serializers.ValidationError('Debe tener al menos 1 número.')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/`~]', value):
            raise serializers.ValidationError('Debe tener al menos 1 carácter especial.')
        return value

    def validate(self, data):
        if data['contrasena'] != data['confirmar_contrasena']:
            raise serializers.ValidationError({
                'confirmar_contrasena': 'Las contraseñas no coinciden.'
            })
        return data

    def create(self, validated_data):
        validated_data.pop('confirmar_contrasena')
        password = validated_data.pop('contrasena')
        return Usuario.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):

    correo     = serializers.EmailField()
    contrasena = serializers.CharField(write_only=True)

    def validate(self, data):
        correo     = data.get('correo')
        contrasena = data.get('contrasena')

        try:
            usuario = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({
                'correo': 'No existe una cuenta con este correo.'
            })

        if usuario.esta_bloqueado():
            raise serializers.ValidationError({
                'bloqueado': 'Cuenta bloqueada por 15 minutos por múltiples intentos fallidos.'
            })

        if not usuario.check_password(contrasena):
            usuario.registrar_intento_fallido()
            intentos_restantes = 3 - usuario.intentos_fallidos
            if intentos_restantes <= 0:
                raise serializers.ValidationError({
                    'bloqueado': 'Cuenta bloqueada por 15 minutos.'
                })
            raise serializers.ValidationError({
                'contrasena': f'Contraseña incorrecta. Te quedan {intentos_restantes} intento(s).'
            })

        usuario.resetear_intentos()

        refresh = RefreshToken.for_user(usuario)

        data['tokens'] = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
        data['usuario'] = usuario
        return data


class CitaSerializer(serializers.ModelSerializer):
    medico_nombre       = serializers.SerializerMethodField()
    especialidad_nombre = serializers.SerializerMethodField()
    paciente_nombre     = serializers.SerializerMethodField()
    numero_comprobante  = serializers.SerializerMethodField()

    class Meta:
        model  = Cita
        fields = [
            'id',
            'fecha',
            'hora',
            'medico_nombre',
            'especialidad_nombre',
            'paciente_nombre',
            'numero_comprobante',
            'estado',
        ]

    def get_medico_nombre(self, obj):
        if obj.medico:
            return obj.medico.nombre
        return ""

    def get_especialidad_nombre(self, obj):
        if obj.medico and obj.medico.especialidad:
            return obj.medico.especialidad.nombre
        return ""

    def get_paciente_nombre(self, obj):
        if obj.paciente:
            return obj.paciente.nombre_completo or obj.paciente.correo
        return ""

    def get_numero_comprobante(self, obj):
        return f"CIT-{obj.id:05d}"


class HorarioMedicoSerializer(serializers.ModelSerializer):
    """
    HU6 - Serializer de horarios médicos.
    Valida que hora_fin > hora_inicio y que no se solape con otro
    horario activo del mismo médico en la misma fecha.
    """

    medico_nombre = serializers.CharField(source='medico.nombre', read_only=True)

    class Meta:
        model = HorarioMedico
        fields = [
            'id',
            'medico',
            'medico_nombre',
            'fecha',
            'hora_inicio',
            'hora_fin',
            'activo',
            'fecha_creacion',
        ]
        read_only_fields = ['fecha_creacion']

    def validate(self, data):
        hora_inicio = data.get('hora_inicio', getattr(self.instance, 'hora_inicio', None))
        hora_fin    = data.get('hora_fin', getattr(self.instance, 'hora_fin', None))
        medico      = data.get('medico', getattr(self.instance, 'medico', None))
        fecha       = data.get('fecha', getattr(self.instance, 'fecha', None))

        if hora_inicio and hora_fin and hora_fin <= hora_inicio:
            raise serializers.ValidationError({
                'hora_fin': 'La hora fin debe ser posterior a la hora inicio.'
            })

        if medico and fecha and hora_inicio and hora_fin:
            existentes = HorarioMedico.objects.filter(
                medico=medico,
                fecha=fecha,
                activo=True
            )

            if self.instance:
                existentes = existentes.exclude(pk=self.instance.pk)

            for h in existentes:
                if hora_inicio < h.hora_fin and hora_fin > h.hora_inicio:
                    raise serializers.ValidationError({
                        'hora_inicio': f'Este horario se solapa con uno existente ({h.hora_inicio.strftime("%H:%M")} - {h.hora_fin.strftime("%H:%M")}).'
                    })

        return data
    

class UsuarioAdminSerializer(serializers.ModelSerializer):
    """
    HU7 - Serializer para administración de usuarios (pacientes).
    No expone ni permite modificar la contraseña desde aquí.
    """

    class Meta:
        model = Usuario
        fields = [
            'id',
            'correo',
            'nombre_completo',
            'documento',
            'telefono',
            'fecha_nacimiento',
            'sexo',
            'eps',
            'alergias',
            'fecha_registro',
            'is_active',
        ]
        read_only_fields = ['correo', 'fecha_registro']

    def validate_documento(self, value):
        if not value.isdigit() or len(value) < 5:
            raise serializers.ValidationError('Solo números, mínimo 5 dígitos.')

        existe = Usuario.objects.filter(documento=value).exclude(pk=self.instance.pk if self.instance else None).exists()
        if existe:
            raise serializers.ValidationError('Este documento ya está registrado por otro usuario.')
        return value