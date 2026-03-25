-- =====================================================
-- SCRIPT DE CREACIÓN DE TABLAS PARA DIGITAL+ ISP
-- Ejecutar este script completo en Supabase SQL Editor
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
-- Puedes comentar esta sección si no quieres datos de prueba
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
