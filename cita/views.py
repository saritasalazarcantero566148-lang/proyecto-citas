from datetime import datetime, timedelta
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status

from .serializers import RegistroSerializer, LoginSerializer, CitaSerializer, HorarioMedicoSerializer, UsuarioAdminSerializer
from .models import Usuario, Medico, Cita, Especialidad, HorarioMedico
from django.db import models


def inicio_view(request):
    return render(request, "cita/medicitas.html")


def login_view(request):
    return render(request, 'cita/login.html')


def registro_view(request):
    return render(request, 'cita/registro.html')


class RegistroAPIView(APIView):

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)

        if serializer.is_valid():
            usuario = serializer.save()

            try:
                send_mail(
                    subject='¡Bienvenido al Sistema de Citas Médicas!',
                    message=(
                        f'Hola {usuario.nombre_completo},\n\n'
                        f'Tu cuenta fue creada exitosamente.\n'
                        f'Ya puedes iniciar sesión con: {usuario.correo}\n\n'
                        f'Saludos,\nEquipo de Citas Médicas'
                    ),
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[usuario.correo],
                    fail_silently=False,
                )
            except Exception as e:
                print(f'Error enviando correo: {e}')

            return Response({
                'success': True,
                'message': 'Usuario registrado correctamente.',
                'data': {'correo': usuario.correo}
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Corrige los errores.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginAPIView(APIView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            tokens  = serializer.validated_data['tokens']
            usuario = serializer.validated_data['usuario']

            return Response({
                'success': True,
                'message': f'Bienvenido, {usuario.nombre_completo}',
                'tokens': tokens,
                'data': {
                    'id': usuario.id,
                    'correo': usuario.correo,
                    'nombre': usuario.nombre_completo,
                    'is_staff': usuario.is_staff,
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'Error al iniciar sesión.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class RecuperarContrasenaAPIView(APIView):

    def post(self, request):
        correo = request.data.get('correo', '').strip()

        if not correo:
            return Response({
                'success': False,
                'message': 'El correo es obligatorio.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.get(correo=correo)
            token   = default_token_generator.make_token(usuario)
            uid     = urlsafe_base64_encode(force_bytes(usuario.pk))
            link    = f'http://127.0.0.1:8000/restablecer/{uid}/{token}/'

            send_mail(
                subject='Recuperación de contraseña',
                message=(
                    f'Hola {usuario.nombre_completo},\n\n'
                    f'Haz clic en el siguiente enlace para restablecer tu contraseña:\n'
                    f'{link}\n\n'
                    f'Este enlace expira en 24 horas.\n\n'
                    f'Si no solicitaste esto, ignora este correo.'
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[usuario.correo],
                fail_silently=False,
            )
        except Usuario.DoesNotExist:
            pass

        return Response({
            'success': True,
            'message': 'Si el correo existe, recibirás las instrucciones.'
        }, status=status.HTTP_200_OK)


class AgendarCitaAPIView(APIView):

    def post(self, request):

        paciente_id = request.data.get('paciente')
        medico_id = request.data.get('medico')
        fecha = request.data.get('fecha')
        hora = request.data.get('hora')

        try:
            paciente = Usuario.objects.get(id=paciente_id)
            medico = Medico.objects.get(id=medico_id)

            existe = Cita.objects.filter(
                medico=medico,
                fecha=fecha,
                hora=hora
            ).exclude(estado=Cita.ESTADO_CANCELADA).exists()

            if existe:
                return Response({
                    'success': False,
                    'message': 'Horario no disponible'
                }, status=status.HTTP_400_BAD_REQUEST)

            cita = Cita.objects.create(
                paciente=paciente,
                medico=medico,
                fecha=fecha,
                hora=hora,
                estado=Cita.ESTADO_PENDIENTE
            )

            send_mail(
                subject='Confirmación de cita médica',
                message=(
                    f'Hola {paciente.nombre_completo}\n\n'
                    f'Su cita ha sido registrada correctamente.\n\n'
                    f'Médico: {medico.nombre}\n'
                    f'Especialidad: {medico.especialidad.nombre}\n'
                    f'Fecha: {fecha}\n'
                    f'Hora: {hora}'
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[paciente.correo],
                fail_silently=False,
            )

            return Response({
                'success': True,
                'message': 'Cita agendada correctamente',
                'cita_id': cita.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


def obtener_medicos(request):

    especialidad_id = request.GET.get('especialidad')

    medicos = Medico.objects.filter(
        especialidad_id=especialidad_id
    )

    data = []

    for medico in medicos:
        data.append({
            'id': medico.id,
            'nombre': medico.nombre
        })

    return JsonResponse(data, safe=False)


def agendar_cita_view(request):

    especialidades = Especialidad.objects.all()
    medicos = Medico.objects.all()

    return render(
        request,
        'cita/agendar_cita.html',
        {
            'especialidades': especialidades,
            'medicos': medicos
        }
    )


def mis_citas_view(request):
    return render(request, 'cita/mis_citas.html')


def gestion_horarios_view(request):
    """
    HU6 - Página de gestión de horarios médicos.
    Solo es accesible para administradores; el control de acceso real
    (rechazo de peticiones) ocurre en las vistas de API mediante
    IsAdminUser. Aquí solo se entrega la página, y el JS valida
    el rol guardado en localStorage para redirigir si no es admin.
    """
    especialidades = Especialidad.objects.all()

    return render(
        request,
        'cita/gestion_horarios.html',
        {'especialidades': especialidades}
    )


def restablecer_password(request, uidb64, token):

    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        usuario = Usuario.objects.get(pk=uid)

    except Exception:
        return HttpResponse("Enlace inválido")

    if not default_token_generator.check_token(usuario, token):
        return HttpResponse("El enlace ha expirado o es inválido")

    if request.method == 'POST':

        password = request.POST.get('password')
        password2 = request.POST.get('password2')

        if password != password2:
            return render(
                request,
                'cita/nueva_password.html',
                {'error': 'Las contraseñas no coinciden'}
            )

        usuario.set_password(password)
        usuario.save()

        return redirect('login_view')

    return render(
        request,
        'cita/nueva_password.html'
    )


class MisCitasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        citas = Cita.objects.filter(
            paciente=request.user
        ).order_by('-fecha', '-hora')

        serializer = CitaSerializer(citas, many=True)

        return Response(serializer.data)


class DetalleCitaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, cita_id):
        cita = get_object_or_404(
            Cita,
            id=cita_id,
            paciente=request.user
        )

        serializer = CitaSerializer(cita)

        return Response(serializer.data)


class CancelarCitaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, cita_id):
        cita = get_object_or_404(
            Cita,
            id=cita_id,
            paciente=request.user
        )

        if cita.estado != Cita.ESTADO_PENDIENTE:
            return Response({
                'success': False,
                'message': 'Esta cita no se puede cancelar porque ya fue cancelada o ya fue atendida.'
            }, status=status.HTTP_400_BAD_REQUEST)

        fecha_hora_cita = datetime.combine(cita.fecha, cita.hora)
        if timezone.is_naive(fecha_hora_cita):
            fecha_hora_cita = timezone.make_aware(fecha_hora_cita)

        limite_cancelacion = timezone.now() + timedelta(hours=24)

        if fecha_hora_cita < limite_cancelacion:
            return Response({
                'success': False,
                'message': 'Solo puedes cancelar una cita con un mínimo de 24 horas de anticipación.'
            }, status=status.HTTP_400_BAD_REQUEST)

        cita.estado = Cita.ESTADO_CANCELADA
        cita.save()

        try:
            send_mail(
                subject='Cancelación de cita médica',
                message=(
                    f'Hola {cita.paciente.nombre_completo},\n\n'
                    f'Tu cita ha sido cancelada correctamente.\n\n'
                    f'Médico: {cita.medico.nombre}\n'
                    f'Especialidad: {cita.medico.especialidad.nombre}\n'
                    f'Fecha: {cita.fecha}\n'
                    f'Hora: {cita.hora}\n\n'
                    f'El horario ha quedado disponible para otros pacientes.\n\n'
                    f'Saludos,\nEquipo de Citas Médicas'
                ),
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[cita.paciente.correo],
                fail_silently=False,
            )
        except Exception as e:
            print(f'Error enviando correo de cancelación: {e}')

        return Response({
            'success': True,
            'message': 'Cita cancelada correctamente. Se ha liberado el horario.'
        }, status=status.HTTP_200_OK)


class HorarioMedicoListCreateAPIView(APIView):
   
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        medico_id = request.GET.get('medico')

        if not medico_id:
            return Response({
                'success': False,
                'message': 'Debe indicar un médico.'
            }, status=status.HTTP_400_BAD_REQUEST)

        horarios = HorarioMedico.objects.filter(medico_id=medico_id)
        serializer = HorarioMedicoSerializer(horarios, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = HorarioMedicoSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Horario creado correctamente.',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Corrige los errores.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class HorarioMedicoDetailAPIView(APIView):
   
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, horario_id):
        horario = get_object_or_404(HorarioMedico, id=horario_id)
        serializer = HorarioMedicoSerializer(horario, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Horario actualizado correctamente.',
                'data': serializer.data
            })

        return Response({
            'success': False,
            'message': 'Corrige los errores.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, horario_id):
        horario = get_object_or_404(HorarioMedico, id=horario_id)
        horario.delete()

        return Response({
            'success': True,
            'message': 'Horario eliminado correctamente.'
        })
    


class UsuarioAdminListAPIView(APIView):
    """
    HU7 - Listar todos los pacientes registrados.
    Soporta búsqueda simple por nombre, correo o documento (?q=texto).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        usuarios = Usuario.objects.filter(is_staff=False).order_by('-fecha_registro')

        q = request.GET.get('q', '').strip()
        if q:
            usuarios = usuarios.filter(
                models.Q(nombre_completo__icontains=q) |
                models.Q(correo__icontains=q) |
                models.Q(documento__icontains=q)
            )

        serializer = UsuarioAdminSerializer(usuarios, many=True)
        return Response(serializer.data)


class UsuarioAdminDetailAPIView(APIView):
    """
    HU7 - Editar, activar/desactivar o eliminar un usuario puntual.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, usuario_id):
        usuario = get_object_or_404(Usuario, id=usuario_id, is_staff=False)
        serializer = UsuarioAdminSerializer(usuario, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Usuario actualizado correctamente.',
                'data': serializer.data
            })

        return Response({
            'success': False,
            'message': 'Corrige los errores.',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, usuario_id):
        usuario = get_object_or_404(Usuario, id=usuario_id, is_staff=False)

        if usuario.id == request.user.id:
            return Response({
                'success': False,
                'message': 'No puedes eliminar tu propia cuenta.'
            }, status=status.HTTP_400_BAD_REQUEST)

        usuario.delete()

        return Response({
            'success': True,
            'message': 'Usuario eliminado correctamente.'
        })
    
def gestion_usuarios_view(request):
    return render(request, 'cita/gestion_usuarios.html')