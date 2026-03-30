# Digital+ ISP - Sistema de Gestión Completo

Sistema administrativo completo para proveedores de Internet y TV por cable (ISP/CATV) similar a WispHub, desarrollado con React, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características Principales

### ✅ Gestión de Clientes
- Tabla completa con filtros por barrio, estado y búsqueda
- Vista de detalle con información personal y suscripción
- Edición de perfiles
- Cambio de planes
- Suspensión de servicios
- Generación manual de facturas
- Creación de tickets desde el perfil
- Coordenadas GPS para ubicación en mapa

### ✅ Gestión de Planes
- Crear, editar y eliminar planes de servicio
- Definir velocidades (descarga/subida)
- Establecer precios mensuales
- Vista en tarjetas con información detallada

### ✅ Sistema de Facturación
- **Facturación Manual**: Generar facturas individuales
- **Facturación Automática Mensual**: Programada por día del mes
- **Pagos Parciales**: Registrar abonos a facturas
- **Pagos Adelantados**: Aplicar créditos a futuras facturas
- Vista de detalle de facturas con historial de pagos
- Impresión de facturas individuales
- Impresión de estados de cuenta mensuales
- Dashboard con estadísticas de facturación

### ✅ Sistema de Tickets
- Crear y gestionar tickets de soporte
- Categorías: Técnico, Facturación, Reclamo, Instalación, Otro
- Prioridades: Baja, Media, Alta, Urgente
- Estados: Abierto, En Progreso, Resuelto, Cerrado, Cancelado
- Sistema de comentarios internos y externos
- Vista de detalle con línea de tiempo
- Filtros por estado, categoría y búsqueda
- Asignación a técnicos
- Programación de visitas

### ✅ Mapa de Red Interactivo
- Visualización de clientes en mapa con Leaflet
- Marcadores codificados por estado (activo, moroso, suspendido)
- Círculos de zonas geográficas
- Popups con información del cliente
- Estadísticas de red en tiempo real
- Capa de zonas toggle

### ✅ Gestión de Zonas
- Crear y administrar zonas geográficas
- Definir coordenadas centrales
- Asignar colores para visualización en mapa
- Ver clientes por zona

### ✅ Logs de Auditoría
- Registro automático de todas las acciones
- Seguimiento por usuario
- Historial de cambios en clientes, facturas, pagos, tickets
- Filtros por tipo de acción y entidad

### ✅ Autenticación y Seguridad
- Sistema de login completo
- Protección de rutas
- Roles de usuario (admin, user, technician)
- Gestión de sesiones

### ✅ Configuración del Sistema
- **Editar Perfil**: Cambiar nombre del usuario
- **Cambiar Contraseña**: Actualización segura de contraseña
- **Facturación Automática**: 
  - Activar/desactivar generación automática
  - Configurar día del mes (1-28)
  - Ver última ejecución
- Preferencias de notificaciones
- Configuración de apariencia

### ✅ Dashboard Principal
- Estadísticas en tiempo real
- KPIs principales
- Gráficos de ingresos y clientes
- Alertas de facturas vencidas
- Resumen de tickets

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router v7
- **Mapas**: React-Leaflet + Leaflet
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticación**: Supabase Auth (custom implementation)
- **Estado**: React Hooks
- **Iconos**: Lucide React
- **Notificaciones**: Sonner

## 📋 Estructura de la Base de Datos

### Tablas Principales
- `users` - Usuarios del sistema
- `clients` - Clientes del ISP
- `plans` - Planes de servicio
- `invoices` - Facturas
- `payments` - Historial de pagos
- `tickets` - Tickets de soporte
- `ticket_comments` - Comentarios de tickets
- `zones` - Zonas geográficas
- `audit_logs` - Logs de auditoría
- `system_settings` - Configuración del sistema

### Scripts SQL Disponibles
1. `database-schema.sql` - Schema básico inicial
2. `database-schema-v2.sql` - Con auditoría y funciones
3. `database-schema-v3.sql` - Con tickets, zonas y pagos
4. `database-schema-v4-final.sql` - **COMPLETO** con facturación automática

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd digital-plus-isp
```

### 2. Instalar Dependencias

```bash
npm install
# o
pnpm install
```

### 3. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Copiar las credenciales del proyecto
3. Crear archivo `utils/supabase/info.tsx`:

```typescript
export const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 4. Ejecutar Scripts de Base de Datos

Desde el SQL Editor de Supabase, ejecutar en orden:

1. `database-schema-v4-final.sql` (contiene todo lo necesario)

O ejecutar los scripts en orden si prefieres versiones anteriores.

### 5. Crear Usuario Administrador

```sql
-- Crear usuario admin (la contraseña es 'admin123')
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@digitalplus.com',
  'e99a18c428cb38d5f260853678922e03', -- hash de 'admin123'
  'Administrador',
  'admin',
  true
);
```

### 6. Iniciar la Aplicación

```bash
npm run dev
# o
pnpm dev
```

La aplicación estará disponible en `http://localhost:5173`

### 7. Login

- **Email**: `admin@digitalplus.com`
- **Contraseña**: `admin123`

## 📱 Uso del Sistema

### Gestión de Clientes

1. Ir a **Clientes** en el menú lateral
2. Crear nuevo cliente con el botón **"Nuevo Cliente"**
3. Completar información:
   - Datos personales (nombre, email, teléfono)
   - Dirección completa
   - IP asignada
   - Número de poste
   - Barrio
   - Plan seleccionado
   - Coordenadas GPS (opcional, para el mapa)
4. Guardar

### Facturación

#### Manual
1. Ir al perfil del cliente
2. Clic en **"Generar Factura"**
3. Se crea automáticamente con el monto del plan

#### Automática
1. Ir a **Configuración**
2. Sección **"Facturación Automática"**
3. Activar y configurar día del mes
4. Guardar configuración
5. Ver instrucciones en `FACTURACION_AUTOMATICA.md`

### Registrar Pagos

1. Ir a **Facturación**
2. Seleccionar una factura
3. Clic en **"Registrar Pago"**
4. Completar:
   - Monto (puede ser parcial)
   - Método de pago
   - Referencia
   - Notas
5. Guardar

### Crear Tickets

1. Desde el perfil del cliente, clic en **"Crear Ticket"**
   O ir a **Tickets** > **"Crear Ticket"**
2. Completar:
   - Título y descripción
   - Categoría y prioridad
   - Cliente relacionado
   - Fecha de visita (opcional)
3. Guardar

### Gestionar Tickets

1. Ir a la vista de tickets
2. Filtrar por estado/categoría
3. Clic en un ticket para ver detalles
4. Agregar comentarios
5. Cambiar estado/prioridad

### Mapa de Red

1. Ir a **Mapa de Red**
2. Ver clientes ubicados geográficamente
3. Toggle zonas con el botón **"Mostrar/Ocultar Zonas"**
4. Clic en marcadores para ver información
5. Los colores indican:
   - 🟢 Verde: Cliente activo
   - 🔴 Rojo: Cliente moroso
   - 🟠 Naranja: Cliente suspendido

### Gestión de Zonas

1. Ir a **Zonas**
2. Crear nueva zona
3. Definir:
   - Nombre y descripción
   - Color para el mapa
   - Coordenadas del centro (opcional)
4. Guardar

## 🔧 Configuración de Facturación Automática

Ver guía completa en: `FACTURACION_AUTOMATICA.md`

### Opciones de Automatización:

1. **Manual** (para pruebas)
2. **Edge Function + GitHub Actions** (recomendado)
3. **Edge Function + Vercel Cron**
4. **Cron Job del servidor**
5. **pg_cron** (si está disponible)

## 📊 Funciones SQL Útiles

```sql
-- Generar facturas manualmente
SELECT * FROM generate_monthly_invoices();

-- Actualizar clientes morosos
SELECT * FROM update_delinquent_clients();

-- Ver dashboard de facturación
SELECT * FROM billing_dashboard;

-- Resumen de facturación de un cliente
SELECT * FROM get_client_billing_summary('client-uuid');

-- Ver estadísticas de tickets
SELECT * FROM get_ticket_stats();

-- Ver clientes en una zona
SELECT * FROM get_clients_by_zone('zone-uuid');
```

## 🎨 Personalización

### Cambiar Colores del Tema

Editar `/src/styles/theme.css`

### Modificar Logo/Nombre

Editar `/src/app/components/Sidebar.tsx`:

```typescript
<h1 className="text-xl font-semibold">Tu Empresa</h1>
<p className="text-sm text-blue-200 mt-1">Tu Slogan</p>
```

## 📝 Notas Importantes

### Seguridad

- ⚠️ El sistema de autenticación actual es simplificado
- ✅ Para producción, usar Supabase Auth completo
- ✅ Implementar RLS (Row Level Security) completo
- ✅ No almacenar datos sensibles sin cifrado

### Performance

- Índices creados para optimizar consultas frecuentes
- Funciones PostgreSQL para operaciones complejas
- Lazy loading en componentes pesados

### Backup

- Configurar backups automáticos en Supabase
- Exportar datos regularmente
- Mantener versiones del schema

## 🐛 Troubleshooting

### Error de conexión a Supabase
- Verificar credenciales en `utils/supabase/info.tsx`
- Verificar que el proyecto de Supabase esté activo

### Mapas no se muestran
- Verificar que React-Leaflet esté instalado
- Verificar que el CSS de Leaflet se importe correctamente

### Facturas no se generan automáticamente
- Verificar configuración en Settings
- Verificar que la Edge Function esté desplegada
- Ver `FACTURACION_AUTOMATICA.md`

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [React Router](https://reactrouter.com/)
- [Leaflet](https://leafletjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👥 Soporte

Para preguntas o problemas:
- Abrir un issue en GitHub
- Contactar al equipo de desarrollo

---

**Digital+** - Sistema de Gestión para ISP/CATV
Desarrollado con ❤️ usando React, TypeScript y Supabase
