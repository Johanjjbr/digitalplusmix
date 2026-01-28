# 🏢 Digital+ ISP - Dashboard Administrativo

Sistema de gestión completo para proveedores de TV e Internet (ISP) construido con React, TypeScript, Tailwind CSS y Supabase.

---

## 🚀 Inicio Rápido

### 1. Configurar Base de Datos

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) y abre tu proyecto
2. Ve a **SQL Editor** → **New Query**
3. Copia y pega el contenido del archivo `database-schema.sql`
4. Haz clic en **Run**

### 2. La App Ya Está Conectada

✅ El código ya está actualizado para conectarse directamente con Supabase
✅ No necesitas desplegar Edge Functions
✅ Funciona inmediatamente con las credenciales de Supabase en Figma Make

### 3. Probar

1. Abre la aplicación
2. Ve a **Planes** → **Agregar Plan** y crea un plan de prueba
3. Ve a **Supabase Dashboard** → **Table Editor** → **plans**
4. Deberías ver el plan que acabas de crear

¡Eso es todo! 🎉

---

## 📚 Documentación

### 📄 Archivos de Guías

- **`CONEXION_RAPIDA.md`** ⭐ - **Empieza aquí** - Guía de 5 minutos para conectar todo
- **`database-schema.sql`** - Script SQL para crear las tablas en Supabase
- **`DEPLOYMENT_GUIDE.md`** - Guía completa para desplegar a producción (Vercel, Netlify, etc.)
- **`SUPABASE_SETUP.md`** - Guía detallada sobre Supabase y consultas SQL útiles
- **`EDGE_FUNCTIONS_SETUP.md`** - (Opcional) Si prefieres usar Edge Functions en lugar de API directa

---

## 🎯 Funcionalidades

### ✅ Gestión de Clientes
- Ver lista completa de clientes con filtros
- Agregar, editar y eliminar clientes
- Ver perfil detallado de cada cliente
- Filtrar por barrio, estado y búsqueda
- Badges de estado (Al día, Moroso, Suspendido)

### ✅ Gestión de Planes
- Crear y gestionar planes de internet y TV
- Precios y características personalizables
- Velocidades de descarga/subida
- Marcar planes como "populares"

### ✅ Facturación
- Ver historial completo de facturas
- Crear facturas para clientes
- Estados: Pagado, Pendiente, Vencido
- Filtrar por estado y cliente
- Imprimir facturas (próximamente)

### ✅ Dashboard
- Resumen de métricas clave
- Estadísticas de clientes activos/morosos
- Ingresos totales
- Gráficos y visualizaciones

### ✅ Otras Secciones
- Mapa de Red (en desarrollo)
- Configuración (en desarrollo)

---

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

#### `plans` - Planes de servicio
```sql
id, name, price, download_speed, upload_speed, features, popular
```

#### `clients` - Clientes
```sql
id, name, email, phone, address, ip_address, pole_number,
neighborhood, plan_id, status, connection_status, monthly_fee
```

#### `invoices` - Facturas
```sql
id, client_id, client_name, amount, description, status,
due_date, paid_date
```

Ver consultas SQL útiles en `SUPABASE_SETUP.md`.

---

## 💻 Tecnologías

- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS v4
- **Routing**: React Router v7
- **Backend**: Supabase (PostgreSQL)
- **UI Components**: shadcn/ui
- **Iconos**: Lucide React
- **Notificaciones**: Sonner
- **Deployment**: Vercel / Netlify

---

## 🔒 Seguridad

- ✅ Row Level Security (RLS) habilitado en Supabase
- ✅ Políticas de acceso configuradas
- ✅ Variables de entorno para credenciales
- ✅ Validación de datos en frontend
- ⚠️ No almacenar información sensible o PII sin las medidas de seguridad adecuadas

---

## 📦 Estructura del Proyecto

```
/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Componente principal
│   │   ├── routes.ts            # Configuración de rutas
│   │   └── components/          # Componentes React
│   │       ├── Clients.tsx      # Gestión de clientes
│   │       ├── Plans.tsx        # Gestión de planes
│   │       ├── Billing.tsx      # Facturación
│   │       ├── Dashboard.tsx    # Dashboard principal
│   │       └── ...
│   ├── lib/
│   │   ├── supabase.ts         # Cliente de Supabase
│   │   ├── api.ts              # API calls (CONECTADO DIRECTAMENTE)
│   │   └── initData.ts         # Inicialización de datos
│   └── styles/                  # Estilos CSS
├── database-schema.sql          # Script SQL para Supabase
├── CONEXION_RAPIDA.md          # 🌟 Guía de inicio rápido
├── DEPLOYMENT_GUIDE.md          # Guía de despliegue
├── SUPABASE_SETUP.md           # Guía completa de Supabase
└── README.md                    # Este archivo
```

---

## 🚀 Desplegar a Producción

Sigue la guía detallada en **`DEPLOYMENT_GUIDE.md`** que incluye:

- Despliegue en Vercel (gratis)
- Despliegue en Netlify (gratis)
- Hosting tradicional (cPanel, FTP)
- Configuración de variables de entorno
- Dominio personalizado
- SSL/HTTPS

---

## 🐛 Solución de Problemas Comunes

### Los datos no se guardan en Supabase

1. Verifica que las tablas existan (ejecuta `database-schema.sql`)
2. Abre la consola del navegador (F12) y busca errores
3. Verifica que Supabase esté conectado en Figma Make

### Error: "duplicate key value"

Estás usando un email que ya existe. Cada cliente debe tener un email único.

### Error: "relation does not exist"

Las tablas no se crearon. Ejecuta el script SQL completo en Supabase.

### Más problemas?

Consulta la sección de "Solución de Problemas" en:
- `CONEXION_RAPIDA.md`
- `DEPLOYMENT_GUIDE.md`
- `SUPABASE_SETUP.md`

---

## 📊 Ver Datos en Supabase

### Desde Table Editor (Visual)

1. **Supabase Dashboard** → **Table Editor**
2. Selecciona una tabla
3. Ver, editar, agregar o eliminar datos

### Desde SQL Editor (Consultas)

```sql
-- Ver todos los clientes con su plan
SELECT 
  c.name, 
  c.email, 
  c.status,
  p.name as plan_name
FROM clients c
LEFT JOIN plans p ON c.plan_id = p.id;
```

Ver más consultas útiles en `SUPABASE_SETUP.md`.

---

## 🔄 Flujo de Trabajo Recomendado

1. **Crear Planes** - Define tus planes de servicio
2. **Agregar Clientes** - Asigna clientes a planes
3. **Generar Facturas** - Crea facturas para cada cliente
4. **Monitorear** - Usa el dashboard para ver métricas
5. **Gestionar** - Actualiza estados, planes, etc.

---

## 📈 Próximas Mejoras Sugeridas

- [ ] Autenticación de usuarios con Supabase Auth
- [ ] Roles y permisos (Admin, Técnico, etc.)
- [ ] Exportar reportes a PDF/Excel
- [ ] Mapa de red interactivo
- [ ] Notificaciones automáticas por email
- [ ] Dashboard de métricas avanzadas
- [ ] App móvil (React Native)

---

## 📞 Recursos

- **Supabase**: https://supabase.com/dashboard
- **Documentación Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com
- **Netlify**: https://netlify.com
- **Tailwind CSS**: https://tailwindcss.com
- **React Router**: https://reactrouter.com

---

## 📝 Notas Importantes

⚠️ **Este sistema NO está diseñado para almacenar información personal identificable (PII) o datos sensibles sin las medidas de seguridad apropiadas.**

⚠️ **Asegúrate de configurar backups regulares en Supabase antes de usar en producción.**

⚠️ **Revisa y ajusta las políticas de seguridad (RLS) según tus necesidades.**

---

## 🎓 Cómo Empezar

1. Lee **`CONEXION_RAPIDA.md`** (5 minutos)
2. Ejecuta el script SQL en Supabase
3. Prueba crear un plan y un cliente
4. Verifica que aparezcan en Supabase
5. Cuando estés listo, lee **`DEPLOYMENT_GUIDE.md`** para publicar

---

**¡Listo para empezar! 🚀**

Si tienes problemas, revisa las guías detalladas en los archivos `.md` incluidos en el proyecto.
