# Instrucciones para Configurar la Base de Datos

## ⚠️ IMPORTANTE: Script Completo y Actualizado

Se ha creado un script SQL consolidado y actualizado que incluye **TODAS** las tablas necesarias con sus columnas correctas.

**Archivo a ejecutar:** `database-schema-COMPLETO-FINAL.sql`

Este script reemplaza y consolida los siguientes archivos anteriores:
- ❌ `database-schema.sql` (versión 1 - obsoleta)
- ❌ `database-schema-v2.sql` (versión 2 - obsoleta)
- ❌ `database-schema-v3.sql` (versión 3 - obsoleta)
- ❌ `database-schema-v4-final.sql` (versión 4 - obsoleta)

## 🚨 SOLUCIÓN RÁPIDA: Error "credit_balance does not exist"

Si estás recibiendo el error sobre `credit_balance`, ejecuta este script primero:

**Archivo:** `ADD_CREDIT_BALANCE.sql`

1. Ve a Supabase Dashboard → SQL Editor
2. Copia y pega TODO el contenido de `ADD_CREDIT_BALANCE.sql`
3. Ejecuta el script (Run)
4. Verifica que ves el mensaje: "✓ Columna credit_balance configurada correctamente"

Este script agrega la columna `credit_balance` necesaria para el sistema de pagos con excedente.

## 📋 Pasos para Configurar la Base de Datos

### 1. Acceder a Supabase

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a la sección **SQL Editor** en el menú lateral

### 2. Ejecutar el Script Completo

1. Abre el archivo `database-schema-COMPLETO-FINAL.sql`
2. **Copia TODO el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en el botón **"Run"** o presiona `Ctrl + Enter`

El script es **idempotente**, lo que significa que:
- ✅ Puede ejecutarse múltiples veces sin causar errores
- ✅ Si las tablas ya existen, no las volverá a crear
- ✅ Agregará columnas faltantes automáticamente (como `document_number`)
- ✅ No perderás datos existentes

### 3. Verificar la Instalación

Después de ejecutar el script, verifica que se crearon todas las tablas ejecutando:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver las siguientes tablas:
- ✅ `users` - Usuarios del sistema
- ✅ `plans` - Planes de servicio
- ✅ `zones` - Zonas geográficas
- ✅ `clients` - Clientes (con columna `document_number`)
- ✅ `invoices` - Facturas
- ✅ `payments` - Pagos parciales
- ✅ `tickets` - Tickets de soporte
- ✅ `ticket_comments` - Comentarios de tickets
- ✅ `audit_logs` - Logs de auditoría
- ✅ `system_settings` - Configuración del sistema

## 🆕 Cambios Importantes en esta Versión

### Columna `credit_balance` Agregada

La tabla `clients` ahora incluye la columna `credit_balance` (saldo a favor) para soportar:
- ✅ Pagos que exceden el monto de la factura
- ✅ Aplicación automática del excedente a facturas pendientes
- ✅ Saldo a favor visible en el perfil del cliente

### Columna `document_number` Agregada

La tabla `clients` ahora incluye la columna `document_number` para almacenar:
- DNI
- Cédula
- Pasaporte
- Otros documentos de identidad

**Características:**
- ✅ Se puede buscar por número de documento en la gestión de clientes
- ✅ Visible en la tabla de gestión de clientes
- ✅ Incluido en el formulario de creación/edición de clientes
- ✅ Campo opcional (no requerido)

### Funcionalidades del Sistema

El script incluye:
1. **Todas las tablas principales** con relaciones correctas
2. **Triggers automáticos** para:
   - Actualizar `updated_at` automáticamente
   - Registrar logs de auditoría
   - Calcular balances de facturas
   - Actualizar estado de clientes al pagar
3. **Funciones de facturación automática**:
   - `generate_monthly_invoices()` - Generar facturas mensuales
   - `update_delinquent_clients()` - Marcar clientes morosos
4. **Políticas de seguridad (RLS)** configuradas
5. **Índices de rendimiento** para búsquedas rápidas
6. **Datos iniciales**:
   - Usuario administrador: `admin@digitalplus.com` / `admin123`
   - Planes de ejemplo
   - Zonas de ejemplo

## 🔧 Solución de Problemas

### Error: "column credit_balance does not exist"

**Solución:**
1. Ejecuta el script `ADD_CREDIT_BALANCE.sql` en el SQL Editor de Supabase
2. Este script agrega la columna faltante de forma segura
3. Es idempotente (se puede ejecutar múltiples veces)

### Error: "column does not exist"

Si recibes errores sobre columnas que no existen (especialmente `document_number`):

1. Ejecuta el script completo `database-schema-COMPLETO-FINAL.sql`
2. El script incluye código para agregar columnas faltantes automáticamente

### Error: "audits table does not exist"

El nombre de la tabla de auditoría cambió de `audits` a `audit_logs`. El script incluye código para renombrar automáticamente.

### Error en el Mapa (NetworkMap)

Si el mapa no carga:
1. Asegúrate de que los clientes tengan coordenadas GPS (`latitude` y `longitude`)
2. El mapa ahora maneja correctamente el caso cuando no hay clientes con coordenadas
3. Verifica que las dependencias de Leaflet estén instaladas: `leaflet` y `react-leaflet`

## 📊 Funciones Útiles

### Generar Facturas Mensuales Manualmente

```sql
SELECT * FROM generate_monthly_invoices();
```

### Actualizar Clientes Morosos

```sql
SELECT * FROM update_delinquent_clients();
```

### Ver Resumen de Facturación

```sql
SELECT * FROM billing_dashboard;
```

### Obtener Resumen de un Cliente

```sql
SELECT * FROM get_client_billing_summary('client-uuid-aqui');
```

## 🔐 Credenciales Iniciales

**Usuario Administrador:**
- Email: `admin@digitalplus.com`
- Contraseña: `admin123`

⚠️ **IMPORTANTE:** Cambia esta contraseña después del primer inicio de sesión en producción.

## 📝 Notas Adicionales

1. **Backup:** Antes de ejecutar el script en producción, haz un backup de tu base de datos
2. **Permisos:** Asegúrate de tener permisos de administrador en Supabase
3. **Tiempo de ejecución:** El script puede tardar 1-2 minutos en ejecutarse completamente
4. **Mensajes de éxito:** Verás mensajes como "CREATE TABLE", "CREATE INDEX", etc. Esto es normal

## 🎯 Próximos Pasos

Después de configurar la base de datos:

1. ✅ Ejecuta el script SQL completo
2. ✅ Verifica que todas las tablas se crearon correctamente
3. ✅ Inicia sesión con las credenciales de administrador
4. ✅ Cambia la contraseña del administrador
5. ✅ Comienza a agregar clientes, planes y configurar el sistema

## 📧 Soporte

Si encuentras algún problema:
1. Verifica que ejecutaste el script **COMPLETO**
2. Revisa los mensajes de error en el SQL Editor
3. Asegúrate de tener las últimas versiones de las dependencias instaladas

---

**Última actualización:** Enero 2026
**Versión del script:** COMPLETO-FINAL (Consolidado)