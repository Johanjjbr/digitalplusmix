# 📘 Guía de Configuración de Supabase y Despliegue

## 🗄️ PARTE 1: Crear las Tablas en Supabase

### Paso 1: Acceder al Editor SQL de Supabase

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
3. Haz clic en **"New Query"**
4. Copia y pega el siguiente código SQL completo

### Paso 2: Ejecutar el Script SQL

```sql
-- =====================================================
-- SCRIPT DE CREACIÓN DE TABLAS PARA DIGITAL+ ISP
-- =====================================================

-- 1. Tabla de Planes
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  download_speed VARCHAR(50),
  upload_speed VARCHAR(50),
  features JSONB DEFAULT '[]'::jsonb,
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  ip_address VARCHAR(50),
  pole_number VARCHAR(50),
  neighborhood VARCHAR(100),
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  plan_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'delinquent')),
  connection_status VARCHAR(20) DEFAULT 'offline' CHECK (connection_status IN ('online', 'offline')),
  monthly_fee DECIMAL(10, 2),
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Facturas
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- =====================================================

-- Índices para la tabla clients
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_neighborhood ON clients(neighborhood);
CREATE INDEX IF NOT EXISTS idx_clients_plan_id ON clients(plan_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Índices para la tabla invoices
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para plans
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at 
  BEFORE UPDATE ON plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública de plans
CREATE POLICY "Allow public read access to plans" 
  ON plans FOR SELECT 
  USING (true);

-- Política para permitir todas las operaciones en plans (para el backend)
CREATE POLICY "Allow all operations on plans" 
  ON plans FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Política para permitir todas las operaciones en clients
CREATE POLICY "Allow all operations on clients" 
  ON clients FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Política para permitir todas las operaciones en invoices
CREATE POLICY "Allow all operations on invoices" 
  ON invoices FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar planes de ejemplo
INSERT INTO plans (name, price, download_speed, upload_speed, features, popular) VALUES
  ('50 Mbps', 29.99, '50 Mbps', '10 Mbps', '["50 Mbps de descarga", "10 Mbps de subida", "Soporte 24/7"]'::jsonb, false),
  ('50 Mbps + TV', 44.99, '50 Mbps', '10 Mbps', '["50 Mbps de descarga", "10 Mbps de subida", "TV Básica (80+ canales)", "Soporte 24/7"]'::jsonb, true),
  ('100 Mbps', 39.99, '100 Mbps', '20 Mbps', '["100 Mbps de descarga", "20 Mbps de subida", "Soporte 24/7"]'::jsonb, false),
  ('100 Mbps + TV', 49.99, '100 Mbps', '20 Mbps', '["100 Mbps de descarga", "20 Mbps de subida", "TV Estándar (120+ canales)", "Soporte 24/7"]'::jsonb, true),
  ('200 Mbps', 69.99, '200 Mbps', '40 Mbps', '["200 Mbps de descarga", "40 Mbps de subida", "Router de alta gama", "Soporte prioritario"]'::jsonb, false),
  ('200 Mbps + TV Premium', 79.99, '200 Mbps', '40 Mbps', '["200 Mbps de descarga", "40 Mbps de subida", "TV Premium (180+ canales)", "HBO, Netflix incluido", "Router de alta gama", "Soporte prioritario"]'::jsonb, false)
ON CONFLICT DO NOTHING;
```

### Paso 3: Verificar que las Tablas se Crearon

1. Haz clic en **"Run"** (o presiona `Ctrl + Enter`)
2. Deberías ver el mensaje: **"Success. No rows returned"**
3. En el menú lateral, haz clic en **"Table Editor"**
4. Deberías ver las 3 tablas: `plans`, `clients`, `invoices`

### Paso 4: Ver los Datos

Para ver los datos en tus tablas:

1. Ve a **"Table Editor"** en el menú lateral
2. Selecciona cada tabla (`plans`, `clients`, `invoices`)
3. Podrás ver, editar, agregar y eliminar datos directamente desde la interfaz

**Consultas SQL útiles para ver datos:**

```sql
-- Ver todos los planes
SELECT * FROM plans ORDER BY price;

-- Ver todos los clientes con su plan
SELECT 
  c.name, 
  c.email, 
  c.status, 
  c.neighborhood,
  p.name as plan_name,
  c.monthly_fee
FROM clients c
LEFT JOIN plans p ON c.plan_id = p.id;

-- Ver facturas pendientes
SELECT 
  i.*, 
  c.name as client_name 
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.status = 'pending' OR i.status = 'overdue';

-- Resumen financiero
SELECT 
  COUNT(*) as total_invoices,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN status = 'pending' OR status = 'overdue' THEN amount ELSE 0 END) as total_pending
FROM invoices;
```

---

## 🚀 PARTE 2: Descargar y Desplegar a Producción

### Opción 1: Despliegue en Vercel (Recomendado - Gratis)

#### Paso 1: Descargar el Código

Actualmente, Figma Make no tiene una función de descarga directa, pero tienes varias opciones:

**Método A: Copiar archivo por archivo**
1. Copia cada archivo desde Figma Make
2. Créalos localmente en tu computadora con la misma estructura

**Método B: Usar Git (si tienes acceso al repositorio)**
```bash
git clone <tu-repositorio>
cd <nombre-proyecto>
```

#### Paso 2: Instalar Dependencias Localmente

```bash
# Instalar Node.js si no lo tienes (https://nodejs.org)

# Instalar dependencias
npm install
```

#### Paso 3: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-key
```

Para obtener estas credenciales:
1. Ve a tu proyecto en Supabase
2. Click en **"Settings"** → **"API"**
3. Copia la **Project URL** y **anon public key**

#### Paso 4: Probar Localmente

```bash
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

#### Paso 5: Desplegar en Vercel

1. **Crear cuenta en Vercel** (gratis): [https://vercel.com](https://vercel.com)

2. **Instalar Vercel CLI**:
```bash
npm install -g vercel
```

3. **Hacer login**:
```bash
vercel login
```

4. **Desplegar**:
```bash
vercel --prod
```

5. **Configurar Variables de Entorno en Vercel**:
   - Ve a tu proyecto en Vercel Dashboard
   - Click en **"Settings"** → **"Environment Variables"**
   - Agrega:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

### Opción 2: Despliegue en Netlify (También Gratis)

#### Paso 1-4: Igual que Vercel

#### Paso 5: Desplegar en Netlify

1. **Crear cuenta en Netlify**: [https://netlify.com](https://netlify.com)

2. **Crear archivo `netlify.toml` en la raíz**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

3. **Instalar Netlify CLI**:
```bash
npm install -g netlify-cli
```

4. **Hacer login**:
```bash
netlify login
```

5. **Desplegar**:
```bash
netlify deploy --prod
```

6. **Configurar Variables de Entorno**:
   - Ve a tu sitio en Netlify Dashboard
   - Click en **"Site settings"** → **"Environment variables"**
   - Agrega las variables de Supabase

### Opción 3: Despliegue Manual (Cualquier Hosting)

#### Paso 1: Construir el Proyecto

```bash
npm run build
```

Esto creará una carpeta `dist/` con todos los archivos estáticos.

#### Paso 2: Subir a tu Hosting

Sube todo el contenido de la carpeta `dist/` a tu servidor web (cPanel, FTP, etc.)

**Configuración importante para React Router:**

Si usas Apache, crea un archivo `.htaccess` en `dist/`:
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

Si usas Nginx, agrega a tu configuración:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 📊 PARTE 3: Monitoreo y Mantenimiento

### Ver Datos en Tiempo Real

1. **Supabase Dashboard → Table Editor**: Ver y editar datos directamente
2. **Supabase Dashboard → Logs**: Ver logs de errores y actividad
3. **Supabase Dashboard → Database → Backups**: Configurar backups automáticos

### Consultas Útiles de Monitoreo

```sql
-- Clientes activos vs morosos
SELECT 
  status,
  COUNT(*) as total
FROM clients
GROUP BY status;

-- Ingresos mensuales
SELECT 
  DATE_TRUNC('month', created_at) as month,
  SUM(amount) as total
FROM invoices
WHERE status = 'paid'
GROUP BY month
ORDER BY month DESC;

-- Planes más populares
SELECT 
  p.name,
  COUNT(c.id) as total_clients
FROM plans p
LEFT JOIN clients c ON c.plan_id = p.id
GROUP BY p.name
ORDER BY total_clients DESC;
```

---

## 🔒 SEGURIDAD EN PRODUCCIÓN

### Variables de Entorno

**NUNCA** subas al repositorio público:
- Claves de API de Supabase
- URLs de conexión
- Cualquier credencial

Crea un archivo `.gitignore`:
```
node_modules/
dist/
.env
.env.local
.env.production
```

### Supabase RLS (Row Level Security)

Las políticas ya están configuradas en el SQL proporcionado, pero puedes ajustarlas según tus necesidades en:
**Supabase Dashboard → Authentication → Policies**

---

## 📝 Resumen de URLs Importantes

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel**: https://vercel.com
- **Netlify**: https://netlify.com
- **Node.js**: https://nodejs.org

---

## ❓ Solución de Problemas

### Error: "relation does not exist"
- Las tablas no se crearon correctamente en Supabase
- Vuelve a ejecutar el script SQL en el SQL Editor

### Error: "Invalid API key"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de usar la `anon` key, no la `service_role` key

### Error: "No data appearing"
- Ejecuta la sección de "DATOS DE EJEMPLO" del script SQL
- O usa la aplicación para crear datos manualmente

### Página en blanco después del despliegue
- Verifica que configuraste las variables de entorno en tu plataforma de hosting
- Revisa la consola del navegador para errores
- Asegúrate de que las reglas de reescritura (redirects) estén configuradas

---

## 💡 Próximos Pasos Recomendados

1. **Backup Regular**: Configura backups automáticos en Supabase
2. **Dominio Personalizado**: Conecta tu dominio en Vercel/Netlify
3. **SSL/HTTPS**: Automático en Vercel/Netlify
4. **Monitoreo**: Configura alertas en Supabase para uso de cuota
5. **Analytics**: Considera agregar Google Analytics o similar

---

¿Necesitas ayuda con algún paso específico? ¡Avísame!
