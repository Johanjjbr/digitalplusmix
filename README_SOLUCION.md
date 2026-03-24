# 🔧 Solución al Error: "credit_balance does not exist"

## 📌 Resumen del Problema

Tu sistema de pagos con excedente está funcionando correctamente en el código, pero la base de datos de Supabase no tiene la columna `credit_balance` necesaria para almacenar el saldo a favor de los clientes.

## ✅ Solución Inmediata

### Archivo a Ejecutar: `ADD_CREDIT_BALANCE.sql`

Este script:
- ✅ Agrega la columna `credit_balance` a la tabla `clients`
- ✅ Inicializa todos los clientes con saldo a favor = $0
- ✅ Crea índices para mejorar el rendimiento
- ✅ Es seguro ejecutarlo múltiples veces
- ✅ No elimina ni modifica datos existentes

### Pasos Rápidos (2 minutos)

1. **Abrir Supabase**
   - Ir a: https://supabase.com/dashboard
   - Seleccionar tu proyecto
   - Clic en "SQL Editor" en el menú lateral

2. **Ejecutar Script**
   - Abrir el archivo `ADD_CREDIT_BALANCE.sql`
   - Copiar TODO el contenido
   - Pegar en el SQL Editor
   - Presionar "Run" (o Ctrl + Enter)

3. **Verificar**
   - Ver el mensaje: "✓ Columna credit_balance configurada correctamente"
   - Recargar tu aplicación
   - ¡Listo!

## 📚 Archivos Disponibles

### 1. `ADD_CREDIT_BALANCE.sql` ⭐ RECOMENDADO
**Qué hace:** Agrega solo la columna `credit_balance`  
**Cuándo usar:** Para solucionar rápidamente este error específico  
**Tiempo:** ~10 segundos de ejecución

### 2. `database-schema-COMPLETO-FINAL.sql`
**Qué hace:** Script completo con TODAS las tablas y columnas actualizadas  
**Cuándo usar:** Si quieres asegurarte de tener todo actualizado  
**Tiempo:** ~30-60 segundos de ejecución

### 3. `SOLUCION_RAPIDA.md`
**Qué es:** Guía de solución rápida en español  
**Para quién:** Usuarios que quieren resolver el problema ahora mismo

### 4. `PASOS_EJECUTAR_SQL.md`
**Qué es:** Tutorial detallado paso a paso con capturas  
**Para quién:** Usuarios que nunca han usado SQL Editor

### 5. `INSTRUCCIONES_BASE_DE_DATOS.md`
**Qué es:** Documentación completa de la base de datos  
**Para quién:** Referencia general del sistema

## 🎯 Flujo Recomendado

```
1. Leer SOLUCION_RAPIDA.md (1 min)
   ↓
2. Ejecutar ADD_CREDIT_BALANCE.sql (2 min)
   ↓
3. Recargar aplicación (30 seg)
   ↓
4. ✅ Sistema funcionando
```

## 🔍 ¿Qué Cambia con credit_balance?

### Antes (Sin credit_balance)
- ❌ No se puede registrar un pago mayor al monto de la factura
- ❌ No se pueden aplicar excedentes a facturas futuras
- ❌ No se visualiza el saldo a favor del cliente
- ❌ Sistema limitado a pagos exactos o parciales

### Después (Con credit_balance)
- ✅ Se pueden registrar pagos mayores al monto de la factura
- ✅ El excedente se aplica automáticamente a facturas pendientes
- ✅ Se visualiza el saldo a favor en el perfil del cliente
- ✅ Gestión completa de créditos y pagos adelantados

## 💡 Ejemplo de Uso

### Escenario:
- Cliente tiene una factura de $50
- Registras un pago de $150

### Lo que sucede:
1. Se paga la factura de $50 ✅
2. Quedan $100 de excedente
3. Sistema busca otras facturas pendientes del cliente
4. Si hay facturas pendientes, las paga automáticamente
5. Si aún queda dinero, se guarda como `credit_balance`
6. Cliente ve su saldo a favor en su perfil

## 🛠️ Verificación Técnica

Para verificar que todo funciona:

```sql
-- 1. Verificar que la columna existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'credit_balance';

-- 2. Ver clientes con saldo a favor
SELECT id, name, credit_balance 
FROM clients 
WHERE credit_balance > 0;

-- 3. Actualizar saldo de un cliente (ejemplo)
UPDATE clients 
SET credit_balance = 100.00 
WHERE id = 'uuid-del-cliente';
```

## ⚠️ Importante

- **No modifiques** el archivo SQL antes de ejecutarlo
- **Copia TODO** el contenido (desde la primera hasta la última línea)
- **Espera** a que el script termine de ejecutarse
- **Recarga** la aplicación después de ejecutar el script
- **Verifica** el mensaje de éxito antes de continuar

## 🐛 Si algo sale mal

### Error: "permission denied"
**Causa:** No tienes permisos de administrador  
**Solución:** Contacta al administrador del proyecto de Supabase

### Error: "relation clients does not exist"
**Causa:** Estás en el proyecto equivocado o no has creado las tablas  
**Solución:** Ejecuta primero `database-schema-COMPLETO-FINAL.sql`

### Error: "column already exists"
**Causa:** La columna ya fue creada  
**Solución:** ¡Perfecto! Solo recarga tu aplicación

### El error persiste después de ejecutar el script
**Causa:** La aplicación tiene la base de datos en caché  
**Solución:**
1. Cierra TODAS las pestañas de la aplicación
2. Abre una nueva ventana del navegador
3. Vuelve a acceder a la aplicación

## 📊 Estado del Sistema

### Funcionalidades Implementadas ✅
- [x] Sistema de pagos con excedente
- [x] Aplicación automática a facturas pendientes
- [x] Visualización de saldo a favor
- [x] Modal de pago con previsualización
- [x] Notificaciones detalladas

### Requiere Actualización de BD ⚠️
- [ ] Ejecutar `ADD_CREDIT_BALANCE.sql`
- [ ] Verificar columna creada
- [ ] Recargar aplicación

## 📞 Soporte

Si después de seguir esta guía sigues teniendo problemas:

1. ✅ Verifica que ejecutaste el script completo
2. ✅ Confirma que ves el mensaje de éxito
3. ✅ Asegúrate de haber recargado la aplicación
4. ✅ Revisa la consola del navegador para errores adicionales

---

**Versión:** 1.0  
**Fecha:** Febrero 10, 2026  
**Sistema:** Digital+ ISP Dashboard  
**Módulo:** Pagos con Excedente y Saldo a Favor
