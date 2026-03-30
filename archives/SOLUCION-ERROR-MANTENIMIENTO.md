# 🔧 Solución al Error de Mantenimiento

## ❌ Error Encontrado

```
Error running maintenance: {
  "code": "42702",
  "details": "It could refer to either a PL/pgSQL variable or a table column.",
  "hint": null,
  "message": "column reference \"due_date\" is ambiguous"
}
```

---

## 🎯 ¿Qué Causa Este Error?

El error ocurre en la función SQL `update_overdue_invoices()` cuando PostgreSQL no puede determinar si `due_date` se refiere a:
- Una columna de la tabla `invoices`
- Una variable definida en `RETURNS TABLE`

Este tipo de ambigüedad surge cuando los nombres coinciden exactamente y no se usan alias explícitos en el `RETURNING`.

---

## ✅ Solución Rápida (5 minutos)

### Opción 1: Ejecutar Script de Corrección

1. **Abre Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre SQL Editor**
   - En el menú lateral, haz clic en "SQL Editor"

3. **Ejecuta el Script**
   - Copia todo el contenido del archivo: `/FIX-MAINTENANCE-ERROR.sql`
   - Pégalo en el editor SQL
   - Haz clic en "Run" o presiona Ctrl+Enter

4. **Verifica que funcione**
   ```sql
   SELECT * FROM update_overdue_invoices();
   ```
   - Si no muestra error, ¡está corregido! ✅

---

### Opción 2: Script Manual

Si prefieres copiar y pegar directamente, ejecuta esto en SQL Editor:

```sql
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS TABLE(
  invoice_id UUID,
  client_name VARCHAR,
  amount DECIMAL,
  due_date DATE,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE invoices inv
  SET status = 'overdue'
  WHERE inv.status = 'pending'
    AND inv.due_date < CURRENT_DATE
  RETURNING 
    inv.id AS invoice_id,
    inv.client_name AS client_name,
    inv.amount AS amount,
    inv.due_date AS due_date,
    'Factura marcada como vencida'::TEXT AS message;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔍 ¿Qué se Corrigió?

### ❌ ANTES (Con Error):
```sql
RETURNING 
  inv.id,
  inv.client_name,
  inv.amount,
  inv.due_date,  -- ❌ Ambiguo: ¿columna o variable?
  'Factura marcada como vencida'::TEXT;
```

### ✅ DESPUÉS (Corregido):
```sql
RETURNING 
  inv.id AS invoice_id,
  inv.client_name AS client_name,
  inv.amount AS amount,
  inv.due_date AS due_date,  -- ✅ Alias explícito
  'Factura marcada como vencida'::TEXT AS message;
```

**Cambio clave**: Se agregaron alias explícitos (`AS invoice_id`, `AS due_date`, etc.) para que PostgreSQL sepa exactamente a qué columna nos referimos.

---

## 🧪 Cómo Probar que Funciona

1. **En la aplicación:**
   - Ve a "Configuración"
   - Haz clic en el botón **"🔧 Mantenimiento"**
   - Si se ejecuta sin errores, ¡está corregido! ✅

2. **En Supabase SQL Editor:**
   ```sql
   -- Probar cada función de mantenimiento
   SELECT * FROM update_overdue_invoices();
   SELECT * FROM update_delinquent_clients();
   SELECT * FROM generate_monthly_invoices(10);
   ```

---

## 📊 Otras Funciones Corregidas

Aproveché para revisar y asegurar que todas las funciones de mantenimiento usen alias explícitos:

### ✅ `update_delinquent_clients()` - OK
Ya usaba alias correctos:
```sql
RETURNING 
  c.id AS client_id,
  c.name AS client_name,
  ...
```

### ✅ `generate_monthly_invoices()` - OK
Ya usaba alias correctos:
```sql
RETURNING 
  id AS invoice_id,
  client_id,
  ...
```

### ✅ `update_overdue_invoices()` - CORREGIDO
Ahora usa alias explícitos en todas las columnas.

---

## 🚨 Si el Error Persiste

### 1. Verifica la Versión del Script
Asegúrate de usar el archivo actualizado:
- `/database-schema-v2.sql` (YA CORREGIDO)
- `/FIX-MAINTENANCE-ERROR.sql` (CORRECCIÓN RÁPIDA)

### 2. Refresca la Conexión
Después de ejecutar el script:
- Recarga la aplicación (F5)
- Cierra sesión y vuelve a iniciar
- Prueba el botón de Mantenimiento nuevamente

### 3. Revisa los Logs en Supabase
Si hay otro error:
- Ve a Supabase Dashboard → Database → Logs
- Busca errores relacionados con funciones
- Copia el mensaje de error completo

### 4. Revisa Otras Funciones
Ejecuta cada función manualmente para encontrar cuál falla:
```sql
-- Probar una por una
SELECT * FROM generate_monthly_invoices(10);
SELECT * FROM update_delinquent_clients();
SELECT * FROM update_overdue_invoices();
```

---

## 📋 Checklist de Verificación

- [ ] Ejecuté el script `/FIX-MAINTENANCE-ERROR.sql` en Supabase
- [ ] No hubo errores al ejecutar el script
- [ ] Recargué la aplicación
- [ ] Probé el botón de Mantenimiento en Configuración
- [ ] El mantenimiento se ejecutó exitosamente
- [ ] Se mostraron los resultados correctamente

---

## 💡 Prevención Futura

Para evitar este tipo de errores en el futuro:

1. **Siempre usa alias explícitos en RETURNING**
   ```sql
   RETURNING column_name AS alias_name
   ```

2. **Usa alias de tabla consistentes**
   ```sql
   UPDATE invoices inv  -- ✅ Consistente
   -- NO: UPDATE invoices i  -- ❌ Puede causar confusión
   ```

3. **Evita nombres idénticos**
   - Si `RETURNS TABLE` tiene `due_date DATE`
   - Y la tabla tiene `due_date`
   - Usa `RETURNING inv.due_date AS due_date` para claridad

---

## 🎓 Explicación Técnica (Opcional)

### ¿Por qué PostgreSQL no puede adivinar?

En PL/pgSQL, cuando defines:
```sql
RETURNS TABLE(due_date DATE, ...)
```

PostgreSQL crea una **variable local** llamada `due_date`.

Cuando escribes:
```sql
RETURNING due_date
```

PostgreSQL no sabe si te refieres a:
- `invoices.due_date` (columna de la tabla)
- `due_date` (variable de la función)

**Solución**: Usar alias explícito:
```sql
RETURNING inv.due_date AS due_date
```

Esto le dice a PostgreSQL: "Toma `inv.due_date` (columna) y devuélvela como `due_date` (variable)".

---

## ✅ Resultado Esperado

Después de aplicar la corrección, el botón de Mantenimiento debería:

1. ✅ Ejecutarse sin errores
2. ✅ Mostrar resultados de:
   - Facturas marcadas como vencidas
   - Clientes marcados como morosos
3. ✅ Actualizar el estado correctamente en la base de datos

---

**¿Necesitas ayuda adicional?** Revisa los archivos:
- `/database-schema-v2.sql` - Schema completo corregido
- `/FIX-MAINTENANCE-ERROR.sql` - Script de corrección rápida
