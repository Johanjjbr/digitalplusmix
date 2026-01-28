# 📋 Instrucciones Paso a Paso - Digital+ ISP

## 🎯 Objetivo
Conectar tu aplicación con Supabase para que los datos se guarden en la base de datos.

---

## ✅ PASO 1: Crear las Tablas en Supabase

### 1.1 Abrir Supabase Dashboard
```
🌐 Ve a: https://supabase.com/dashboard
📂 Abre tu proyecto
```

### 1.2 Abrir SQL Editor
```
👉 En el menú lateral izquierdo, haz clic en "SQL Editor"
👉 Haz clic en el botón verde "New Query"
```

### 1.3 Copiar el Script SQL
```
📄 Abre el archivo: database-schema.sql
📋 Copia TODO el contenido (Ctrl+A, Ctrl+C)
```

### 1.4 Pegar y Ejecutar
```
📌 Pega el contenido en el SQL Editor de Supabase
▶️ Haz clic en el botón "Run" (o presiona Ctrl+Enter)
⏳ Espera a que termine (verás "Success. No rows returned")
```

### 1.5 Verificar que las Tablas se Crearon
```
👉 En el menú lateral, haz clic en "Table Editor"
✅ Deberías ver 3 tablas:
   • plans
   • clients
   • invoices
```

---

## ✅ PASO 2: Verificar la Conexión de Supabase

### 2.1 Verificar Credenciales
```
👉 En Figma Make, verifica que Supabase esté conectado
👉 Deberías ver tus credenciales de Supabase configuradas
```

### 2.2 Revisar Variables de Entorno (opcional)
```
Si estás trabajando localmente:
👉 Verifica que el archivo .env tenga:
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon-key
```

---

## ✅ PASO 3: Probar la Conexión con un Plan

### 3.1 Abrir la Sección de Planes
```
👉 En tu aplicación, haz clic en "Planes" en el menú lateral
```

### 3.2 Crear un Plan de Prueba
```
👉 Haz clic en el botón "Agregar Plan"
📝 Llena el formulario:

┌─────────────────────────────────────┐
│ Nombre del Plan                     │
│ ▸ 100 Mbps Básico                   │
├─────────────────────────────────────┤
│ Precio Mensual ($)                  │
│ ▸ 39.99                             │
├─────────────────────────────────────┤
│ Velocidad de Descarga               │
│ ▸ 100 Mbps                          │
├─────────────────────────────────────┤
│ Velocidad de Subida                 │
│ ▸ 20 Mbps                           │
├─────────────────────────────────────┤
│ Características                     │
│ ▸ Internet de alta velocidad        │
│ ▸ Soporte 24/7                      │
│ ▸ Router incluido                   │
└─────────────────────────────────────┘

👉 Haz clic en "Crear Plan"
✅ Deberías ver un mensaje: "Plan creado exitosamente"
```

### 3.3 Verificar en Supabase
```
🌐 Ve a Supabase Dashboard
👉 Table Editor → plans
✅ Deberías ver el plan "100 Mbps Básico" que acabas de crear
```

---

## ✅ PASO 4: Probar con un Cliente

### 4.1 Abrir la Sección de Clientes
```
👉 En tu aplicación, haz clic en "Clientes" en el menú lateral
```

### 4.2 Crear un Cliente de Prueba
```
👉 Haz clic en el botón azul "Agregar Cliente"
📝 Llena el formulario:

┌─────────────────────────────────────┐
│ Información Personal                │
├─────────────────────────────────────┤
│ Nombre Completo                     │
│ ▸ Juan Pérez Gómez                  │
├─────────────────────────────────────┤
│ Email                               │
│ ▸ juan.perez@ejemplo.com            │
├─────────────────────────────────────┤
│ Teléfono                            │
│ ▸ +1 555-0123                       │
├─────────────────────────────────────┤
│ Dirección                           │
│ ▸ Calle Principal 123, Apto 4B      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Información de Servicio             │
├─────────────────────────────────────┤
│ Dirección IP                        │
│ ▸ 192.168.1.100                     │
├─────────────────────────────────────┤
│ Número de Poste                     │
│ ▸ P-1001                            │
├─────────────────────────────────────┤
│ Barrio                              │
│ ▸ Centro                            │
├─────────────────────────────────────┤
│ Plan                                │
│ ▸ [Selecciona: 100 Mbps Básico]    │
├─────────────────────────────────────┤
│ Estado del Servicio                 │
│ ▸ [Selecciona: Al día]              │
└─────────────────────────────────────┘

👉 Haz clic en "Crear Cliente"
✅ Deberías ver un mensaje: "Cliente creado exitosamente"
```

### 4.3 Verificar en Supabase
```
🌐 Ve a Supabase Dashboard
👉 Table Editor → clients
✅ Deberías ver a "Juan Pérez Gómez" en la lista
```

---

## ✅ PASO 5: Verificar Todo Funciona

### 5.1 Verificación Visual
```
En tu aplicación:
✅ El plan aparece en la lista de Planes
✅ El cliente aparece en la lista de Clientes
✅ Puedes filtrar por barrio ("Centro")
✅ El badge muestra "Al día" (verde)
```

### 5.2 Verificación en Supabase
```
En Supabase Dashboard:
✅ Table Editor → plans tiene 1+ registros
✅ Table Editor → clients tiene 1+ registros
✅ Los datos son exactos (nombres, precios, etc.)
```

---

## 🎉 ¡ÉXITO! Todo Está Funcionando

Si completaste todos los pasos y:
- ✅ Los datos aparecen en la aplicación
- ✅ Los datos aparecen en Supabase
- ✅ No hay errores en la consola

**¡Tu aplicación está completamente conectada a Supabase!**

---

## 🧪 Pruebas Adicionales

### Editar un Cliente
```
1. En la lista de Clientes, haz clic en el ícono de lápiz (Editar)
2. Cambia el teléfono a: +1 555-9999
3. Guarda los cambios
4. Ve a Supabase y verifica que el teléfono se actualizó
```

### Eliminar un Plan
```
1. Crea un plan de prueba llamado "Plan Temporal"
2. Haz clic en el ícono de basura (Eliminar)
3. Confirma la eliminación
4. Ve a Supabase y verifica que ya no está
```

### Filtrar Clientes
```
1. Crea varios clientes en diferentes barrios
2. Usa el filtro de "Barrio" en la aplicación
3. Verifica que solo muestra los clientes del barrio seleccionado
```

---

## 🔍 Ver Datos con Consultas SQL

### Consultas Útiles

Ejecuta estas en **Supabase → SQL Editor**:

#### Ver todos los clientes con su plan
```sql
SELECT 
  c.name, 
  c.email, 
  c.status,
  c.neighborhood,
  p.name as plan_name,
  c.monthly_fee
FROM clients c
LEFT JOIN plans p ON c.plan_id = p.id
ORDER BY c.created_at DESC;
```

#### Contar clientes por barrio
```sql
SELECT 
  neighborhood,
  COUNT(*) as total_clientes
FROM clients
GROUP BY neighborhood
ORDER BY total_clientes DESC;
```

#### Ver planes ordenados por popularidad
```sql
SELECT 
  p.name,
  p.price,
  COUNT(c.id) as total_clientes
FROM plans p
LEFT JOIN clients c ON c.plan_id = p.id
GROUP BY p.id, p.name, p.price
ORDER BY total_clientes DESC;
```

#### Resumen financiero
```sql
SELECT 
  SUM(monthly_fee) as ingresos_mensuales_total,
  COUNT(*) as total_clientes_activos
FROM clients
WHERE status = 'active';
```

---

## 🚨 Solución de Problemas

### ❌ Error: "duplicate key value violates unique constraint"

**Problema**: Intentas crear un cliente con un email que ya existe.

**Solución**: 
```
✅ Cambia el email a uno diferente
✅ O elimina el cliente anterior con ese email
```

### ❌ Error: "relation does not exist"

**Problema**: Las tablas no se crearon en Supabase.

**Solución**:
```
1. Ve a Supabase → SQL Editor
2. Ejecuta de nuevo el script database-schema.sql completo
3. Verifica en Table Editor que las tablas aparezcan
```

### ❌ No aparecen datos en Supabase

**Problema**: La aplicación no está conectada a Supabase.

**Solución**:
```
1. Abre la consola del navegador (F12)
2. Busca errores en rojo
3. Verifica que Supabase esté conectado en Figma Make
4. Recarga la aplicación (F5)
```

### ❌ Error: "Invalid API key"

**Problema**: Las credenciales de Supabase son incorrectas.

**Solución**:
```
1. Ve a Supabase → Settings → API
2. Copia la Project URL y anon public key
3. Reconecta Supabase en Figma Make
```

---

## 📊 Monitoreo

### Ver Actividad en Tiempo Real

```
Supabase Dashboard → Database → Logs
👉 Verás todas las operaciones en tiempo real
👉 Útil para debug y monitoreo
```

### Configurar Backups

```
Supabase Dashboard → Database → Backups
👉 Activa backups automáticos diarios
👉 CRÍTICO antes de usar en producción
```

---

## 🎯 Checklist Final

Antes de considerar completada la configuración:

- [ ] ✅ Tablas creadas en Supabase (plans, clients, invoices)
- [ ] ✅ Creado al menos 1 plan de prueba
- [ ] ✅ Creado al menos 1 cliente de prueba
- [ ] ✅ Los datos aparecen en la aplicación
- [ ] ✅ Los datos aparecen en Supabase Table Editor
- [ ] ✅ Probado editar un cliente
- [ ] ✅ Probado eliminar un registro
- [ ] ✅ Probado filtros de búsqueda
- [ ] ✅ No hay errores en la consola del navegador

---

## 📚 Próximos Pasos

Una vez que todo funciona:

1. **Agregar datos reales** - Reemplaza los datos de prueba con datos reales
2. **Configurar backups** - En Supabase → Database → Backups
3. **Desplegar a producción** - Sigue la guía en `DEPLOYMENT_GUIDE.md`
4. **Configurar dominio** - Conecta tu dominio personalizado
5. **Monitorear uso** - Revisa las métricas en Supabase Dashboard

---

## 💡 Consejos

### Para Agregar Muchos Clientes
```
👉 Usa la interfaz de Table Editor en Supabase
👉 Puedes hacer "Insert row" múltiples veces
👉 O importar desde CSV (Table Editor → Import)
```

### Para Ver Estadísticas
```
👉 Usa SQL Editor para consultas personalizadas
👉 Exporta resultados a CSV para análisis
👉 Crea vistas (VIEWS) para reportes frecuentes
```

### Para Producción
```
⚠️ Activa backups automáticos
⚠️ Revisa las políticas de seguridad (RLS)
⚠️ Configura alertas de uso de cuota
⚠️ Monitorea logs regularmente
```

---

**¿Necesitas ayuda adicional?**

- 📖 Lee `CONEXION_RAPIDA.md` para más detalles
- 🚀 Lee `DEPLOYMENT_GUIDE.md` para desplegar
- 🗄️ Lee `SUPABASE_SETUP.md` para consultas SQL avanzadas

---

¡Buena suerte con tu sistema de gestión ISP! 🚀
