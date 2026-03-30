# Configuración de Facturación Automática Mensual

## Descripción

El sistema Digital+ ISP incluye facturación automática mensual que genera facturas para todos los clientes activos en una fecha específica de cada mes.

## Configuración en el Dashboard

1. **Ir a Configuración** (Settings)
2. En la sección **"Facturación Automática"**:
   - Activar/desactivar la generación automática de facturas
   - Configurar el **día del mes** (1-28) en que se generarán las facturas
   - Guardar la configuración

Por defecto:
- ✅ Facturación automática habilitada
- 📅 Día de facturación: 1 de cada mes

## Base de Datos

### Ejecutar el Script SQL

Ejecuta el archivo `database-schema-v4-final.sql` en tu base de datos Supabase:

```bash
# Desde el dashboard de Supabase SQL Editor
# O usando la CLI de Supabase:
supabase db push
```

Este script crea:
- ✅ Tabla `system_settings` para configuración
- ✅ Función `generate_monthly_invoices()` para generar facturas
- ✅ Función `update_delinquent_clients()` para actualizar morosos
- ✅ Índices para mejor rendimiento

### Funciones Principales

#### 1. `generate_monthly_invoices()`
```sql
SELECT * FROM generate_monthly_invoices();
```
- Genera facturas mensuales para todos los clientes activos
- Solo se ejecuta en el día configurado
- Verifica que no se hayan generado facturas duplicadas

#### 2. `update_delinquent_clients()`
```sql
SELECT * FROM update_delinquent_clients();
```
- Marca clientes con facturas vencidas como morosos
- Actualiza el estado de facturas pendientes a vencidas

## Opciones de Automatización

### Opción 1: Manual (Para Pruebas)

Ejecutar manualmente desde el SQL Editor de Supabase:

```sql
-- Generar facturas manualmente
SELECT * FROM generate_monthly_invoices();

-- Actualizar morosos
SELECT * FROM update_delinquent_clients();
```

### Opción 2: Edge Function con Cron Externo (Recomendado)

La Edge Function ya está creada en `/supabase/functions/monthly-billing/index.ts`

#### Desplegar la Edge Function:

```bash
# Instalar Supabase CLI si no la tienes
npm install -g supabase

# Login a Supabase
supabase login

# Desplegar la función
supabase functions deploy monthly-billing

# Obtener el secret para el cron (opcional pero recomendado)
supabase secrets set CRON_SECRET=tu_secret_aqui
```

#### Configurar con GitHub Actions:

Crea `.github/workflows/monthly-billing.yml`:

```yaml
name: Monthly Billing Cron

on:
  schedule:
    # Ejecutar diariamente a las 00:00 UTC
    - cron: '0 0 * * *'
  workflow_dispatch: # Permitir ejecución manual

jobs:
  billing:
    runs-on: ubuntu-latest
    steps:
      - name: Execute Monthly Billing
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://YOUR_PROJECT_REF.supabase.co/functions/v1/monthly-billing
```

#### Configurar con Vercel Cron:

Crea `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/billing",
    "schedule": "0 0 * * *"
  }]
}
```

Y crea `/api/cron/billing.ts`:

```typescript
export default async function handler(req, res) {
  const response = await fetch(
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/monthly-billing',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  res.status(200).json(data);
}
```

### Opción 3: Cron Job del Servidor

Si tienes acceso al servidor, configura un cron job:

```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar diariamente a las 00:00
0 0 * * * curl -X POST -H "Authorization: Bearer YOUR_SECRET" https://YOUR_PROJECT_REF.supabase.co/functions/v1/monthly-billing
```

### Opción 4: pg_cron (Si está disponible)

Si tu base de datos Supabase soporta `pg_cron`, descomenta las líneas en el script SQL:

```sql
-- Habilitar extensión
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar ejecución diaria
SELECT cron.schedule(
  'daily-billing',
  '0 0 * * *',
  $$SELECT generate_monthly_invoices()$$
);
```

## Verificación

### Ver Configuración Actual

```sql
SELECT * FROM system_settings;
```

### Ver Última Ejecución

```sql
SELECT 
  auto_generate_invoices,
  billing_day,
  last_billing_run,
  CASE 
    WHEN last_billing_run = CURRENT_DATE THEN 'Ejecutado hoy'
    WHEN last_billing_run IS NULL THEN 'Nunca ejecutado'
    ELSE 'Último: ' || last_billing_run::text
  END as status
FROM system_settings;
```

### Ver Dashboard de Facturación

```sql
SELECT * FROM billing_dashboard;
```

### Ver Facturas Generadas Hoy

```sql
SELECT 
  id,
  client_name,
  amount,
  status,
  created_at
FROM invoices
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

## Proceso de Facturación

1. **Verificación Diaria** (00:00 UTC)
   - Se ejecuta la función automáticamente

2. **Validaciones**
   - ✅ Verificar si la facturación automática está habilitada
   - ✅ Verificar si hoy es el día de facturación configurado
   - ✅ Verificar que no se haya ejecutado hoy

3. **Generación de Facturas**
   - Para cada cliente activo con `monthly_fee > 0`
   - Verificar que no exista factura del mes actual
   - Crear factura con:
     - Fecha: Fecha actual
     - Fecha de vencimiento: +15 días
     - Descripción: "Servicio mensual - [Plan] - [Mes Año]"
     - Monto: `monthly_fee` del cliente
     - Estado: `pending`

4. **Actualización de Morosos**
   - Marcar clientes con facturas vencidas como `delinquent`
   - Actualizar facturas pendientes vencidas a `overdue`

5. **Registro**
   - Guardar fecha de última ejecución
   - Registrar en audit logs

## Troubleshooting

### La facturación no se ejecuta

1. Verificar que `auto_generate_invoices = true`
2. Verificar que hoy sea el día configurado
3. Verificar que no se haya ejecutado hoy (`last_billing_run`)
4. Revisar logs de la Edge Function

### Facturas duplicadas

El sistema previene duplicados verificando:
- Mes y año de la factura
- Cliente específico

### Cambiar el día de facturación

Desde el dashboard de Configuración o directamente en SQL:

```sql
UPDATE system_settings 
SET billing_day = 5  -- Cambiar al día 5 de cada mes
WHERE id = (SELECT id FROM system_settings LIMIT 1);
```

## Monitoreo

### Ver Estadísticas de Facturación

```sql
SELECT 
  COUNT(*) as total_invoices,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue
FROM invoices
WHERE EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE);
```

## Soporte

Para más información o problemas:
- Revisar los logs de Supabase
- Verificar la configuración de la Edge Function
- Consultar la documentación de Supabase Cron Jobs
