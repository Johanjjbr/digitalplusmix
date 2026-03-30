# 📝 Guía Paso a Paso: Ejecutar Script SQL en Supabase

## Para resolver el error "credit_balance does not exist"

### Paso 1: Acceder a Supabase

1. Abre tu navegador web
2. Ve a: https://supabase.com/dashboard
3. Inicia sesión con tu cuenta
4. Selecciona tu proyecto (el que usas para esta aplicación)

### Paso 2: Abrir el SQL Editor

1. En el menú lateral izquierdo, busca **"SQL Editor"**
2. Haz clic en **"SQL Editor"**
3. Haz clic en el botón **"+ New query"** (Nueva consulta)

### Paso 3: Preparar el Script

**Opción A: Script Rápido (Solo credit_balance)**
1. Abre el archivo: `ADD_CREDIT_BALANCE.sql`
2. Selecciona TODO el contenido (`Ctrl + A` o `Cmd + A`)
3. Copia el contenido (`Ctrl + C` o `Cmd + C`)

**Opción B: Script Completo (Todas las actualizaciones)**
1. Abre el archivo: `database-schema-COMPLETO-FINAL.sql`
2. Selecciona TODO el contenido (`Ctrl + A` o `Cmd + A`)
3. Copia el contenido (`Ctrl + C` o `Cmd + C`)

### Paso 4: Pegar el Script

1. Vuelve a la pestaña de Supabase
2. Haz clic dentro del editor SQL (la caja grande blanca)
3. Pega el contenido (`Ctrl + V` o `Cmd + V`)
4. Verifica que se pegó TODO el script (desplázate hacia abajo para confirmar)

### Paso 5: Ejecutar el Script

1. Busca el botón **"Run"** en la esquina inferior derecha
   - O presiona `Ctrl + Enter` (Windows/Linux)
   - O presiona `Cmd + Enter` (Mac)
2. Haz clic en **"Run"**
3. Espera a que se ejecute (puede tardar 5-30 segundos)

### Paso 6: Verificar el Resultado

**Si todo salió bien, verás:**

✅ Mensajes en verde que dicen "Success"  
✅ El mensaje: `Columna credit_balance agregada exitosamente`  
✅ El mensaje: `✓ Columna credit_balance configurada correctamente`  
✅ No hay mensajes de error en rojo

**Si ves errores:**

❌ Verifica que copiaste TODO el script (desde la primera línea hasta la última)  
❌ Asegúrate de que estás usando el proyecto correcto de Supabase  
❌ Verifica que tienes permisos de administrador

### Paso 7: Recargar la Aplicación

1. Vuelve a tu aplicación
2. Recarga la página completa (`F5` o `Ctrl + R`)
3. Intenta usar la funcionalidad de pagos
4. Los errores deberían haber desaparecido

## Verificación Extra (Opcional)

Para confirmar que la columna se creó correctamente:

1. En el SQL Editor, borra el contenido anterior
2. Pega esta consulta:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'credit_balance';
```

3. Ejecuta (Run)
4. Deberías ver una fila con:
   - `column_name`: credit_balance
   - `data_type`: numeric
   - `column_default`: 0

## Problemas Comunes

### "Permission denied"
**Solución:** Asegúrate de tener permisos de administrador en el proyecto de Supabase

### "relation clients does not exist"
**Solución:** Estás en el proyecto equivocado de Supabase, o no has ejecutado el script inicial de la base de datos

### "column credit_balance already exists"
**Solución:** ¡Perfecto! La columna ya existe. Simplemente recarga tu aplicación.

### El script se queda "cargando" indefinidamente
**Solución:** Refresca la página de Supabase e intenta de nuevo

## Tiempo Estimado

⏱️ **2-3 minutos** en total

## ¿Necesitas Ayuda?

Si después de seguir estos pasos sigues teniendo problemas:

1. Toma una captura de pantalla del error que ves en Supabase
2. Toma una captura de pantalla del error en tu aplicación
3. Verifica que ejecutaste el script correcto
4. Asegúrate de que estás en el proyecto correcto de Supabase

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0
