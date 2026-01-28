# 🚀 Guía Rápida de Despliegue - Digital+ ISP Dashboard

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Configurar Base de Datos en Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Abre tu proyecto
3. Click en **"SQL Editor"** en el menú lateral
4. Click en **"New Query"**
5. Copia TODO el contenido del archivo `database-schema.sql`
6. Pega en el editor y haz click en **"Run"**
7. Ve a **"Table Editor"** para verificar que se crearon las tablas: `plans`, `clients`, `invoices`

### 2️⃣ Obtener Credenciales de Supabase

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia estos dos valores:
   - **Project URL** (ejemplo: `https://abcdefgh.supabase.co`)
   - **anon public key** (una clave larga que empieza con `eyJ...`)

### 3️⃣ Desplegar en Vercel (Gratis)

**Opción A: Desde GitHub (Recomendado)**

1. Sube tu código a GitHub
2. Ve a [https://vercel.com](https://vercel.com) y crea una cuenta
3. Click en **"Import Project"**
4. Selecciona tu repositorio de GitHub
5. En **"Environment Variables"** agrega:
   ```
   VITE_SUPABASE_URL = tu-project-url
   VITE_SUPABASE_ANON_KEY = tu-anon-key
   ```
6. Click en **"Deploy"**
7. ¡Listo! Tu app estará en línea en `https://tu-proyecto.vercel.app`

**Opción B: Desde tu Computadora**

1. Descarga Node.js: [https://nodejs.org](https://nodejs.org)
2. Abre terminal en la carpeta del proyecto
3. Ejecuta:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```
4. Sigue las instrucciones y agrega las variables de entorno cuando te lo pida

---

## 📁 Estructura del Proyecto

```
tu-proyecto/
├── src/
│   ├── app/
│   │   ├── App.tsx                 # Componente principal
│   │   ├── routes.ts               # Configuración de rutas
│   │   └── components/             # Componentes React
│   ├── lib/
│   │   ├── supabase.ts            # Cliente de Supabase
│   │   └── api.ts                 # API calls
│   └── styles/                     # Estilos CSS
├── database-schema.sql             # Script SQL para crear tablas
├── SUPABASE_SETUP.md              # Guía detallada de Supabase
└── package.json                    # Dependencias del proyecto
```

---

## 🔧 Configuración Local (Desarrollo)

### Requisitos
- Node.js 18+ ([descargar](https://nodejs.org))
- Git ([descargar](https://git-scm.com))

### Pasos

1. **Clonar/Descargar el proyecto**
   ```bash
   # Si está en GitHub
   git clone tu-repositorio
   cd tu-proyecto
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Crear archivo .env**
   Crea un archivo llamado `.env` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon-key
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173)

5. **Construir para producción**
   ```bash
   npm run build
   ```
   Los archivos listos para producción estarán en la carpeta `dist/`

---

## 🌐 Opciones de Hosting

### ✅ Vercel (Recomendado)
- **Costo**: Gratis
- **SSL**: Automático
- **Dominio**: `tu-proyecto.vercel.app` (o dominio personalizado)
- **Despliegue**: Automático desde Git
- **Guía**: [Ver arriba](#3️⃣-desplegar-en-vercel-gratis)

### ✅ Netlify
- **Costo**: Gratis
- **SSL**: Automático
- **Dominio**: `tu-proyecto.netlify.app`
- **Despliegue**: 
  ```bash
  npm install -g netlify-cli
  netlify login
  netlify deploy --prod
  ```

### ✅ Hosting Tradicional (cPanel, FTP)

1. Construir el proyecto:
   ```bash
   npm run build
   ```

2. Subir el contenido de la carpeta `dist/` a tu servidor

3. Crear archivo `.htaccess` (para Apache):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

4. Configurar variables de entorno en tu hosting

---

## 📊 Ver y Gestionar Datos en Supabase

### Interfaz Visual (Table Editor)

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Abre tu proyecto
3. Click en **"Table Editor"** en el menú lateral
4. Selecciona una tabla: `plans`, `clients`, o `invoices`
5. Puedes:
   - Ver todos los registros
   - Agregar nuevos registros (botón **"Insert row"**)
   - Editar registros (click en cualquier celda)
   - Eliminar registros (click en el ícono de basura)
   - Filtrar y buscar datos

### Consultas SQL Útiles

Ejecuta estas consultas en **SQL Editor**:

```sql
-- Ver todos los clientes con su plan
SELECT 
  c.name, 
  c.email, 
  c.status, 
  c.neighborhood,
  c.ip_address,
  p.name as plan_name,
  c.monthly_fee
FROM clients c
LEFT JOIN plans p ON c.plan_id = p.id
ORDER BY c.name;

-- Ver facturas pendientes
SELECT 
  i.*, 
  c.name as client_name 
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.status IN ('pending', 'overdue')
ORDER BY i.created_at DESC;

-- Resumen financiero
SELECT 
  COUNT(*) as total_facturas,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as ingresos,
  SUM(CASE WHEN status IN ('pending', 'overdue') THEN amount ELSE 0 END) as pendiente
FROM invoices;

-- Clientes por estado
SELECT 
  status,
  COUNT(*) as total
FROM clients
GROUP BY status;

-- Planes más populares
SELECT 
  p.name,
  p.price,
  COUNT(c.id) as total_clientes
FROM plans p
LEFT JOIN clients c ON c.plan_id = p.id
GROUP BY p.id, p.name, p.price
ORDER BY total_clientes DESC;
```

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE: No Subas Estas Cosas a GitHub Público

Crea un archivo `.gitignore`:
```
node_modules/
dist/
.env
.env.local
.env.production
.vercel
```

### Variables de Entorno

- **NUNCA** pongas tus claves directamente en el código
- Usa variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- En producción, configúralas en tu plataforma de hosting

### Supabase Security

- Las políticas RLS ya están configuradas en el script SQL
- Usa la `anon` key para el frontend
- La `service_role` key solo para backend/servidor

---

## 🐛 Solución de Problemas

### Error: "relation does not exist"
**Solución**: Las tablas no se crearon. Ve a Supabase SQL Editor y ejecuta el script `database-schema.sql` completo.

### Error: "Invalid API key"
**Solución**: 
1. Verifica que las variables de entorno estén correctas
2. En Supabase, ve a Settings → API y copia nuevamente las claves
3. Asegúrate de usar la `anon` key, no la `service_role` key

### No aparecen datos
**Solución**: 
1. Ve a Supabase Table Editor
2. Verifica que las tablas tengan datos
3. Ejecuta la sección de "DATOS DE EJEMPLO" del script SQL

### Página en blanco después del despliegue
**Solución**:
1. Abre la consola del navegador (F12) para ver errores
2. Verifica que las variables de entorno estén configuradas en tu hosting
3. Verifica que las reglas de reescritura estén configuradas (`.htaccess` o configuración de Vercel/Netlify)

### Error de CORS
**Solución**: No deberías tener este error si usas las políticas RLS del script SQL. Si ocurre, ve a Supabase Settings → API y verifica la configuración.

---

## 📈 Monitoreo y Mantenimiento

### Supabase Dashboard

- **Database → Backups**: Configura backups automáticos
- **Logs**: Ver logs de errores y consultas
- **Reports**: Ver uso de recursos

### Vercel Dashboard

- **Analytics**: Ver visitas y rendimiento
- **Logs**: Ver errores de la aplicación
- **Deployments**: Historial de despliegues

---

## 🎯 Checklist de Producción

- [ ] ✅ Tablas creadas en Supabase
- [ ] ✅ Datos de prueba cargados (opcional)
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Aplicación desplegada en Vercel/Netlify
- [ ] ✅ SSL/HTTPS activo
- [ ] ✅ Dominio personalizado configurado (opcional)
- [ ] ✅ Backups automáticos activados en Supabase
- [ ] ✅ `.gitignore` configurado correctamente
- [ ] ✅ Aplicación probada en producción

---

## 📞 Recursos y Enlaces

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentación Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com
- **Netlify**: https://netlify.com
- **Node.js**: https://nodejs.org

---

## 💡 Próximos Pasos

1. **Dominio Personalizado**: Conecta tu dominio (ej: `admin.tuisp.com`)
2. **Autenticación**: Agrega login con Supabase Auth
3. **Backups**: Configura backups diarios en Supabase
4. **Monitoring**: Instala herramientas de monitoreo
5. **Analytics**: Agrega Google Analytics o similar

---

¿Necesitas ayuda? Revisa la guía completa en `SUPABASE_SETUP.md`
