# Configuración de GitHub Actions para Facturación Automática

Esta guía te ayudará a configurar GitHub Actions para ejecutar la facturación mensual automática.

## 📋 Requisitos Previos

1. Proyecto en Supabase configurado
2. Edge Function desplegada (`monthly-billing`)
3. Repositorio en GitHub
4. Acceso a configuración del repositorio

## 🔧 Paso 1: Desplegar la Edge Function

Primero, despliega la Edge Function de facturación:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login a Supabase
supabase login

# Link al proyecto (si aún no lo has hecho)
supabase link --project-ref YOUR_PROJECT_REF

# Desplegar la función
supabase functions deploy monthly-billing
```

## 🔐 Paso 2: Configurar Secrets en GitHub

Ve a tu repositorio en GitHub:

1. Ir a **Settings** > **Secrets and variables** > **Actions**
2. Clic en **New repository secret**
3. Agregar los siguientes secrets:

### Secret 1: SUPABASE_FUNCTION_URL
- **Name**: `SUPABASE_FUNCTION_URL`
- **Value**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1`
- Reemplaza `YOUR_PROJECT_REF` con tu referencia de proyecto

### Secret 2: CRON_SECRET
- **Name**: `CRON_SECRET`
- **Value**: Genera un token seguro (ejemplo: `my-super-secret-token-12345`)

También debes configurar este secret en Supabase:

```bash
# Configurar el secret en Supabase
supabase secrets set CRON_SECRET=my-super-secret-token-12345
```

## 📝 Paso 3: Crear el Workflow

El archivo `.github/workflows/monthly-billing.yml` ya está creado en el proyecto.

Contenido del workflow:
- ✅ Se ejecuta diariamente a las 00:00 UTC
- ✅ Puede ejecutarse manualmente
- ✅ Llama a la Edge Function con autenticación
- ✅ Valida la respuesta
- ✅ Notifica en caso de error

## ⚙️ Paso 4: Ajustar Zona Horaria (Opcional)

El cron está configurado para ejecutarse a las 00:00 UTC. Para ajustar a tu zona horaria:

### Ejemplos de Cron Schedule:

```yaml
# 00:00 UTC (medianoche UTC)
- cron: '0 0 * * *'

# 05:00 UTC (00:00 EST/CDT)
- cron: '0 5 * * *'

# 07:00 UTC (00:00 PST/PDT)
- cron: '0 7 * * *'

# 12:00 UTC (00:00 en Perú - PET)
- cron: '0 12 * * *'

# 03:00 UTC (00:00 en Argentina - ART)
- cron: '0 3 * * *'
```

Edita `.github/workflows/monthly-billing.yml` y cambia la línea del cron:

```yaml
on:
  schedule:
    - cron: '0 12 * * *'  # Para Perú (PET = UTC-5, entonces 00:00 PET = 05:00 UTC)
```

## 🧪 Paso 5: Probar la Configuración

### Prueba Manual

1. Ve a **Actions** en tu repositorio de GitHub
2. Selecciona el workflow **"Monthly Billing Automation"**
3. Clic en **"Run workflow"**
4. Selecciona la rama (main/master)
5. Clic en **"Run workflow"** nuevamente
6. Espera a que termine y revisa los logs

### Verificar Logs

```
- Checkout code: ✅
- Execute Monthly Billing Function: 
  - HTTP Status: 200 ✅
  - Response: {"success":true,"invoices_created":X,...}
- Send notification on success: ✅
```

### Si hay errores:

1. Verifica los secrets (nombres y valores)
2. Verifica que la Edge Function esté desplegada
3. Revisa los logs de Supabase Functions
4. Verifica la URL de la función

## 📊 Paso 6: Monitorear Ejecuciones

### Ver Historial
1. Ve a **Actions** en GitHub
2. Selecciona el workflow
3. Ve el historial de ejecuciones

### Logs de Supabase
1. Ve a tu proyecto en Supabase
2. **Edge Functions** > **monthly-billing**
3. Revisa los logs de ejecución

## 🔔 Paso 7: Configurar Notificaciones (Opcional)

### Notificaciones por Email

Agrega al final del workflow:

```yaml
- name: Send Email Notification
  if: always()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: Facturación Automática - ${{ job.status }}
    body: |
      Estado: ${{ job.status }}
      Workflow: ${{ github.workflow }}
      Fecha: ${{ github.event.repository.updated_at }}
    to: admin@tuempresa.com
    from: noreply@tuempresa.com
```

### Notificaciones a Slack

```yaml
- name: Send Slack Notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Facturación automática completada'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Notificaciones a Discord

```yaml
- name: Send Discord Notification
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "Facturación Automática"
    description: "Estado: ${{ job.status }}"
```

## 🛠️ Troubleshooting

### Error: "Resource not accessible by integration"
- Verifica permisos del workflow
- Ve a Settings > Actions > General
- Activa "Read and write permissions"

### Error: "Secret not found"
- Verifica que los secrets estén configurados correctamente
- Los nombres son case-sensitive

### Error 401 Unauthorized
- Verifica que CRON_SECRET coincida en GitHub y Supabase
- Verifica que el secret esté configurado en Supabase

### Error 404 Not Found
- Verifica la URL de la función
- Asegúrate de que la función esté desplegada
- Formato: `https://PROJECT_REF.supabase.co/functions/v1/monthly-billing`

### La facturación no se ejecuta
- Verifica la sintaxis del cron
- Espera a la hora programada (puede tomar hasta 15 min de delay)
- Ejecuta manualmente para probar

## ✅ Checklist de Configuración

- [ ] Edge Function desplegada en Supabase
- [ ] CRON_SECRET configurado en Supabase
- [ ] SUPABASE_FUNCTION_URL configurado en GitHub
- [ ] CRON_SECRET configurado en GitHub
- [ ] Workflow creado en `.github/workflows/`
- [ ] Cron ajustado a tu zona horaria
- [ ] Prueba manual exitosa
- [ ] Permisos de GitHub Actions habilitados
- [ ] Notificaciones configuradas (opcional)
- [ ] Monitoreo activo

## 📅 Calendario de Ejecución

El workflow se ejecuta:
- ✅ **Diariamente**: Verifica si es el día de facturación
- ✅ **Automáticamente**: Sin intervención manual
- ✅ **Manualmente**: Cuando lo necesites

La función de PostgreSQL (`generate_monthly_invoices`) se encarga de:
- Verificar si está habilitada la facturación automática
- Verificar si hoy es el día configurado
- Evitar duplicados
- Registrar la última ejecución

## 🎯 Próximos Pasos

1. ✅ Configura todo según esta guía
2. ✅ Realiza una prueba manual
3. ✅ Espera al día siguiente para verificar ejecución automática
4. ✅ Revisa los logs regularmente
5. ✅ Configura notificaciones
6. ✅ Documenta cualquier personalización

## 📚 Recursos Adicionales

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Cron Syntax Guide](https://crontab.guru/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

¿Necesitas ayuda? Revisa los logs o contacta al equipo de desarrollo.
