import re
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Usuario


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

        # Verificar bloqueo
        if usuario.esta_bloqueado():
            raise serializers.ValidationError({
                'bloqueado': 'Cuenta bloqueada por 15 minutos por múltiples intentos fallidos.'
            })

        # Verificar contraseña
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

        # Login exitoso
        usuario.resetear_intentos()

        refresh = RefreshToken.for_user(usuario)

        data['tokens'] = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
        data['usuario'] = usuario
        return data

    from rest_framework import serializers
from .models import Cita
 
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
            'estado',       # 'pendiente' | 'realizada' | 'cancelada'
            'notas',
            'direccion',
        ]
 
    def get_medico_nombre(self, obj):
        if obj.medico:
            return f"{obj.medico.nombre} {obj.medico.apellido}"
        return ""
 
    def get_especialidad_nombre(self, obj):
        if obj.medico and obj.medico.especialidad:
            return obj.medico.especialidad.nombre
        return ""
 
    def get_paciente_nombre(self, obj):
        if obj.paciente:
            return obj.paciente.get_full_name() or obj.paciente.correo
        return ""
 
    def get_numero_comprobante(self, obj):
        return f"CIT-{obj.id:05d}"    