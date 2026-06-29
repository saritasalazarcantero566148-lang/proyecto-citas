from datetime import datetime, timedelta
from django.shortcuts import render
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
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
 
from .serializers import RegistroSerializer, LoginSerializer, CitaSerializer
from .models import Usuario, Medico, Cita, Especialidad
 


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
                    'id' : usuario.id,
                    'correo': usuario.correo,
                    'nombre': usuario.nombre_completo,
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
 
            # HU5: las citas canceladas NO deben bloquear el horario.
            # Por eso se excluyen explícitamente de la validación de disponibilidad.
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
    """
    HU5 - Cancelar cita.
 
    Reglas:
    - Solo el paciente dueño de la cita puede cancelarla.
    - Solo se puede cancelar si está 'pendiente' (no si ya está realizada/cancelada).
    - Debe faltar mínimo 24 horas para la fecha/hora de la cita.
    - Al cancelar: cambia el estado (libera el horario para otros pacientes)
      y se envía un correo de confirmación.
    """
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
 
        # Se combinan fecha y hora de la cita en un datetime "aware" para
        # poder compararlo correctamente contra la hora actual del servidor.
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