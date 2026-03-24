# 🚨 Solución Rápida: Error "credit_balance does not exist"

## Problema
Tu aplicación está mostrando estos errores:
```
Error: column clients.credit_balance does not exist
```

## Causa
La columna `credit_balance` (saldo a favor del cliente) no existe en tu tabla `clients` en Supabase.

## Solución (2 minutos)

### Opción 1: Script Rápido (RECOMENDADO)

1. **Abre Supabase Dashboard**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto
   - Haz clic en "SQL Editor" en el menú lateral

2. **Ejecuta el Script**
   - Abre el archivo `ADD_CREDIT_BALANCE.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor
   - Presiona el botón **"Run"** (o `Ctrl + Enter`)

3. **Verifica el Resultado**
   - Deberías ver el mensaje: `✓ Columna credit_balance configurada correctamente`
   - Si ves este mensaje, ¡todo está listo!

### Opción 2: Script Completo

Si prefieres ejecutar el script completo con todas las actualizaciones:

1. Abre el archivo `database-schema-COMPLETO-FINAL.sql`
2. Copia TODO el contenido (es más largo)
3. Pégalo en el SQL Editor de Supabase
4. Ejecuta (Run)

Este script incluye la columna `credit_balance` más todas las demás actualizaciones.

## ¿Qué hace el script?

- ✅ Agrega la columna `credit_balance` a la tabla `clients`
- ✅ Inicializa todos los clientes existentes con saldo a favor = 0
- ✅ Crea un índice para mejorar el rendimiento
- ✅ Es seguro ejecutarlo múltiples veces (no causa errores si ya existe)

## Después de ejecutar el script

1. Recarga tu aplicación
2. Los errores deberían desaparecer
3. El sistema de pagos con excedente funcionará correctamente

## ¿Qué es credit_balance?

La columna `credit_balance` almacena el **saldo a favor del cliente**. Esto permite:

- 💰 Registrar pagos mayores al monto de la factura
- 🔄 Aplicar automáticamente el excedente a facturas pendientes
- 📊 Visualizar el saldo a favor en el perfil del cliente
- ✨ Gestionar créditos y pagos adelantados

## Verificación Manual

Para verificar que la columna se creó correctamente, ejecuta:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'credit_balance';
```

Deberías ver:
- `column_name`: credit_balance
- `data_type`: numeric
- `column_default`: 0

## Soporte

Si después de ejecutar el script sigues teniendo problemas:

1. Verifica que ejecutaste el script completo (sin cortar nada)
2. Revisa la consola del SQL Editor para ver mensajes de error
3. Asegúrate de que tienes permisos de administrador en Supabase
4. Recarga la aplicación después de ejecutar el script

---

**Tiempo estimado:** 2 minutos  
**Dificultad:** Fácil  
**Requiere reiniciar la app:** Sí (solo recargar la página)
