from django.contrib import admin
from .models import Usuario, Especialidad, Medico, Cita

admin.site.register(Usuario)
admin.site.register(Especialidad)
admin.site.register(Medico)
admin.site.register(Cita)
# Register your models here.
