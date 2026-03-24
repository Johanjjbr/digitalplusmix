# 🔧 INSTRUCCIONES PARA EJECUTAR EL SCRIPT SQL

## ⚠️ IMPORTANTE
Debes ejecutar el script SQL `ADD_CREDIT_BALANCE.sql` en tu base de datos de Supabase para que el sistema de saldo a favor funcione correctamente.

## 📋 Pasos para Ejecutar el Script

### 1. Abrir Supabase Dashboard
1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto

### 2. Ir al SQL Editor
1. En el menú lateral izquierdo, busca y haz clic en **"SQL Editor"**
2. Haz clic en **"New Query"** (Nueva Consulta)

### 3. Copiar y Pegar el Script
1. Abre el archivo `ADD_CREDIT_BALANCE.sql` que está en la raíz del proyecto
2. Copia TODO el contenido del archivo
3. Pega el contenido en el editor SQL de Supabase

### 4. Ejecutar el Script
1. Haz clic en el botón **"Run"** (Ejecutar) en la esquina inferior derecha
2. Espera a que aparezca el mensaje de confirmación verde
3. Deberías ver mensajes como:
   - ✓ Columna credit_balance agregada exitosamente
   - ✓ Columna credit_balance configurada correctamente
   - ✓ Todos los clientes tienen saldo a favor inicializado en 0

### 5. Verificar que Funcionó
1. Recarga esta aplicación web (presiona F5 o Ctrl+R)
2. Ve a un cliente y haz clic en "Crear Factura"
3. Registra un pago con un monto mayor al de la factura
4. Verás que el excedente se guarda como "Saldo a Favor"

## ❓ ¿Qué hace este script?

El script `ADD_CREDIT_BALANCE.sql`:

- ✅ Agrega una nueva columna llamada `credit_balance` a la tabla `clients`
- ✅ Inicializa todos los clientes existentes con saldo a favor de $0.00
- ✅ Crea un índice para mejorar el rendimiento de las consultas
- ✅ Es seguro ejecutarlo múltiples veces (no dará error si ya existe la columna)

## 🎯 Funcionalidades que se Activarán

Después de ejecutar el script, estas funcionalidades estarán disponibles:

### 1. Pagos con Excedente
- Cuando registres un pago mayor al monto de la factura
- El excedente se aplicará automáticamente a las siguientes facturas pendientes
- Si no hay más facturas pendientes, se guardará como **saldo a favor**

### 2. Saldo a Favor Automático
- Cuando crees una nueva factura para un cliente con saldo a favor
- El sistema aplicará automáticamente el saldo a favor a la nueva factura
- Si el saldo a favor cubre toda la factura, se marcará como pagada automáticamente
- Si el saldo a favor cubre solo parte de la factura, se descontará y quedará el balance pendiente

### 3. Visualización del Saldo a Favor
- En el perfil del cliente verás una tarjeta verde mostrando su saldo a favor actual
- El saldo se actualizará automáticamente después de cada pago o factura

## 🆘 Problemas Comunes

### Error: "column already exists"
- **Solución**: Esto significa que la columna ya existe. No hay problema, el script detecta esto y no hace cambios.

### Error: "permission denied"
- **Solución**: Asegúrate de que estás usando la cuenta correcta de Supabase y que tienes permisos de administrador en el proyecto.

### El script se ejecutó pero no funciona
- **Solución**: 
  1. Recarga completamente la aplicación web (Ctrl+Shift+R o Cmd+Shift+R)
  2. Cierra sesión y vuelve a iniciar sesión
  3. Revisa la consola del navegador (F12) para ver si hay errores

## 📞 Soporte

Si tienes problemas ejecutando el script:
1. Revisa el archivo `EJECUTAR_AHORA.txt` para instrucciones adicionales
2. Verifica que copiaste TODO el contenido del archivo `ADD_CREDIT_BALANCE.sql`
3. Asegúrate de estar en el proyecto correcto de Supabase

---

**Última actualización**: 10 de Febrero de 2026
