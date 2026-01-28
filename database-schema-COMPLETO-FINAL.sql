-- =====================================================
-- SCRIPT COMPLETO Y FINAL DE BASE DE DATOS
-- Digital+ ISP - Sistema de Gestión Completo
-- Versión: FINAL CONSOLIDADA
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Ejecutar este script completo en el SQL Editor de Supabase
-- 2. Este script incluye TODAS las tablas necesarias
-- 3. Es idempotente (se puede ejecutar múltiples veces sin errores)
-- 
-- =====================================================

-- =====================================================
-- 0. FUNCIÓN AUXILIAR PARA updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 1. TABLA DE USUARIOS (Autenticación)
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'technician')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- 2. TABLA DE PLANES
-- =====================================================

CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  download_speed VARCHAR(50),
  upload_speed VARCHAR(50),
  features JSONB DEFAULT '[]'::jsonb,
  popular BOOLEAN DEFAULT false,
  expiration_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA DE ZONAS
-- =====================================================

CREATE TABLE IF NOT EXISTS zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3B82F6',
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zones_name ON zones(name);

-- =====================================================
-- 4. TABLA DE CLIENTES (ACTUALIZADA CON document_number)
-- =====================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  document_number VARCHAR(50), -- NUEVA COLUMNA
  address TEXT,
  ip_address VARCHAR(50),
  pole_number VARCHAR(50),
  neighborhood VARCHAR(100),
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  plan_name VARCHAR(255),
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'delinquent')),
  connection_status VARCHAR(20) DEFAULT 'offline' CHECK (connection_status IN ('online', 'offline')),
  monthly_fee DECIMAL(10, 2),
  join_date DATE DEFAULT CURRENT_DATE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  last_payment_date DATE,
  next_billing_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna document_number si no existe (para bases de datos existentes)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'document_number'
  ) THEN
    ALTER TABLE clients ADD COLUMN document_number VARCHAR(50);
  END IF;
END $$;

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_neighborhood ON clients(neighborhood);
CREATE INDEX IF NOT EXISTS idx_clients_plan_id ON clients(plan_id);
CREATE INDEX IF NOT EXISTS idx_clients_zone_id ON clients(zone_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_location ON clients(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_clients_document_number ON clients(document_number);

-- =====================================================
-- 5. TABLA DE FACTURAS
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  date DATE DEFAULT CURRENT_DATE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  due_date DATE,
  paid_date DATE,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  balance DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  is_monthly_auto BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para invoices
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON invoices(status, due_date);

-- =====================================================
-- 6. TABLA DE PAGOS
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100),
  notes TEXT,
  paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- =====================================================
-- 7. TABLA DE TICKETS
-- =====================================================

CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('technical', 'billing', 'complaint', 'installation', 'other')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  scheduled_visit_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- =====================================================
-- 8. TABLA DE COMENTARIOS DE TICKETS
-- =====================================================

CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at);

-- =====================================================
-- 9. TABLA DE LOGS DE AUDITORÍA
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  entity_name VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Renombrar tabla si existe con nombre antiguo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audits') THEN
    ALTER TABLE audits RENAME TO audit_logs;
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- =====================================================
-- 10. TABLA DE CONFIGURACIÓN DEL SISTEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_generate_invoices BOOLEAN DEFAULT true,
  billing_day INTEGER DEFAULT 1 CHECK (billing_day >= 1 AND billing_day <= 28),
  last_billing_run DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at 
  BEFORE UPDATE ON plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_zones_updated_at ON zones;
CREATE TRIGGER update_zones_updated_at 
  BEFORE UPDATE ON zones 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at 
  BEFORE UPDATE ON tickets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES DE NEGOCIO
-- =====================================================

-- Función para calcular el balance de facturas
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance := NEW.amount - COALESCE(NEW.amount_paid, 0);
  
  IF NEW.balance <= 0 THEN
    NEW.status := 'paid';
    IF NEW.paid_date IS NULL THEN
      NEW.paid_date := CURRENT_DATE;
    END IF;
  ELSIF NEW.balance < NEW.amount THEN
    NEW.status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_invoice_balance ON invoices;
CREATE TRIGGER trigger_calculate_invoice_balance
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_balance();

-- Función para actualizar el monto pagado de facturas cuando se registra un pago
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET amount_paid = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payments
    WHERE invoice_id = NEW.invoice_id
  )
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_paid_amount ON payments;
CREATE TRIGGER trigger_update_invoice_paid_amount
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_paid_amount();

-- Función para actualizar estado de cliente al pagar factura
CREATE OR REPLACE FUNCTION update_client_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    IF NOT EXISTS (
      SELECT 1 FROM invoices
      WHERE client_id = NEW.client_id
        AND status IN ('pending', 'overdue')
        AND id != NEW.id
    ) THEN
      UPDATE clients
      SET 
        status = 'active',
        last_payment_date = NEW.paid_date
      WHERE id = NEW.client_id;
    ELSE
      UPDATE clients
      SET last_payment_date = NEW.paid_date
      WHERE id = NEW.client_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_on_payment ON invoices;
CREATE TRIGGER trigger_update_client_on_payment
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_client_status_on_payment();

-- Función para registrar logs de auditoría
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  action_type VARCHAR(10);
  changes_json JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'create';
    changes_json := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
    changes_json := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
    changes_json := to_jsonb(OLD);
  END IF;
  
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    changes,
    created_at
  ) VALUES (
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    changes_json,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría
DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

DROP TRIGGER IF EXISTS audit_plans ON plans;
CREATE TRIGGER audit_plans
  AFTER INSERT OR UPDATE OR DELETE ON plans
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

DROP TRIGGER IF EXISTS audit_invoices ON invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

DROP TRIGGER IF EXISTS audit_zones ON zones;
CREATE TRIGGER audit_zones
  AFTER INSERT OR UPDATE OR DELETE ON zones
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

DROP TRIGGER IF EXISTS audit_tickets ON tickets;
CREATE TRIGGER audit_tickets
  AFTER INSERT OR UPDATE OR DELETE ON tickets
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

DROP TRIGGER IF EXISTS audit_payments ON payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- =====================================================
-- FUNCIONES DE FACTURACIÓN AUTOMÁTICA
-- =====================================================

-- Función para generar facturas mensuales
CREATE OR REPLACE FUNCTION generate_monthly_invoices()
RETURNS TABLE(
  invoices_created INTEGER,
  clients_billed INTEGER,
  total_amount DECIMAL
) AS $$
DECLARE
  v_settings RECORD;
  v_today DATE := CURRENT_DATE;
  v_invoices_created INTEGER := 0;
  v_clients_billed INTEGER := 0;
  v_total_amount DECIMAL := 0;
  v_client RECORD;
  v_invoice_id UUID;
BEGIN
  SELECT * INTO v_settings FROM system_settings LIMIT 1;
  
  IF NOT v_settings.auto_generate_invoices THEN
    RAISE NOTICE 'Facturación automática deshabilitada';
    RETURN QUERY SELECT 0, 0, 0::DECIMAL;
    RETURN;
  END IF;
  
  IF EXTRACT(DAY FROM v_today) != v_settings.billing_day THEN
    RAISE NOTICE 'Hoy no es día de facturación. Día configurado: %', v_settings.billing_day;
    RETURN QUERY SELECT 0, 0, 0::DECIMAL;
    RETURN;
  END IF;
  
  IF v_settings.last_billing_run = v_today THEN
    RAISE NOTICE 'Ya se ejecutó la facturación hoy';
    RETURN QUERY SELECT 0, 0, 0::DECIMAL;
    RETURN;
  END IF;
  
  FOR v_client IN 
    SELECT id, name, monthly_fee, plan_name 
    FROM clients 
    WHERE status = 'active' AND monthly_fee > 0
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM invoices 
      WHERE client_id = v_client.id 
        AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM v_today)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM v_today)
    ) THEN
      INSERT INTO invoices (
        client_id,
        client_name,
        date,
        due_date,
        description,
        amount,
        amount_paid,
        balance,
        status,
        is_monthly_auto
      ) VALUES (
        v_client.id,
        v_client.name,
        v_today,
        v_today + INTERVAL '15 days',
        'Servicio mensual - ' || v_client.plan_name || ' - ' || 
          TO_CHAR(v_today, 'Month YYYY'),
        v_client.monthly_fee,
        0,
        v_client.monthly_fee,
        'pending',
        true
      ) RETURNING id INTO v_invoice_id;
      
      v_invoices_created := v_invoices_created + 1;
      v_clients_billed := v_clients_billed + 1;
      v_total_amount := v_total_amount + v_client.monthly_fee;
      
      RAISE NOTICE 'Factura creada para cliente %: $%', v_client.name, v_client.monthly_fee;
    END IF;
  END LOOP;
  
  UPDATE system_settings 
  SET last_billing_run = v_today 
  WHERE id = v_settings.id;
  
  RAISE NOTICE 'Facturación completada: % facturas creadas, % clientes facturados, total $%', 
    v_invoices_created, v_clients_billed, v_total_amount;
  
  RETURN QUERY SELECT v_invoices_created, v_clients_billed, v_total_amount;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar clientes morosos
CREATE OR REPLACE FUNCTION update_delinquent_clients()
RETURNS TABLE(
  clients_updated INTEGER
) AS $$
DECLARE
  v_clients_updated INTEGER := 0;
  v_client RECORD;
BEGIN
  FOR v_client IN
    SELECT DISTINCT c.id, c.name
    FROM clients c
    INNER JOIN invoices i ON i.client_id = c.id
    WHERE c.status = 'active'
      AND i.status IN ('pending', 'overdue')
      AND i.due_date < CURRENT_DATE
  LOOP
    UPDATE clients 
    SET status = 'delinquent'
    WHERE id = v_client.id;
    
    v_clients_updated := v_clients_updated + 1;
    RAISE NOTICE 'Cliente marcado como moroso: %', v_client.name;
  END LOOP;
  
  UPDATE invoices 
  SET status = 'overdue'
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
  
  RETURN QUERY SELECT v_clients_updated;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

CREATE OR REPLACE VIEW billing_dashboard AS
SELECT
  COUNT(DISTINCT i.client_id) as total_clients_with_invoices,
  COUNT(i.id) as total_invoices,
  SUM(i.amount) as total_billed,
  SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN i.status IN ('pending', 'overdue') THEN i.balance ELSE 0 END) as total_pending,
  COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as invoices_paid,
  COUNT(CASE WHEN i.status = 'pending' THEN 1 END) as invoices_pending,
  COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) as invoices_overdue
FROM invoices i;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (ajustar según necesidades de seguridad)
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" 
  ON users FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on plans" ON plans;
CREATE POLICY "Allow all operations on plans" 
  ON plans FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on zones" ON zones;
CREATE POLICY "Allow all operations on zones" 
  ON zones FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
CREATE POLICY "Allow all operations on clients" 
  ON clients FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on invoices" ON invoices;
CREATE POLICY "Allow all operations on invoices" 
  ON invoices FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on payments" ON payments;
CREATE POLICY "Allow all operations on payments" 
  ON payments FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on tickets" ON tickets;
CREATE POLICY "Allow all operations on tickets" 
  ON tickets FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on ticket_comments" ON ticket_comments;
CREATE POLICY "Allow all operations on ticket_comments" 
  ON ticket_comments FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to audit_logs" ON audit_logs;
CREATE POLICY "Allow read access to audit_logs" 
  ON audit_logs FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow insert on audit_logs" ON audit_logs;
CREATE POLICY "Allow insert on audit_logs" 
  ON audit_logs FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on system_settings" ON system_settings;
CREATE POLICY "Allow all operations on system_settings" 
  ON system_settings FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Crear usuario administrador por defecto
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@digitalplus.com',
  '$2a$10$K7SXZQgGfJ.zKJxz1Xj5xOYKGxGnYr7xUGp4rC8qVqm5wYJGzO7YG',
  'Administrador',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Insertar configuración del sistema por defecto
INSERT INTO system_settings (auto_generate_invoices, billing_day, last_billing_run)
VALUES (true, 1, NULL)
ON CONFLICT DO NOTHING;

-- Insertar planes de ejemplo
INSERT INTO plans (name, price, download_speed, upload_speed, features, popular) VALUES
  ('50 Mbps', 29.99, '50 Mbps', '10 Mbps', '[\"50 Mbps de descarga\", \"10 Mbps de subida\", \"Soporte 24/7\"]'::jsonb, false),
  ('50 Mbps + TV', 44.99, '50 Mbps', '10 Mbps', '[\"50 Mbps de descarga\", \"10 Mbps de subida\", \"TV Básica (80+ canales)\", \"Soporte 24/7\"]'::jsonb, true),
  ('100 Mbps', 39.99, '100 Mbps', '20 Mbps', '[\"100 Mbps de descarga\", \"20 Mbps de subida\", \"Soporte 24/7\"]'::jsonb, false),
  ('100 Mbps + TV', 49.99, '100 Mbps', '20 Mbps', '[\"100 Mbps de descarga\", \"20 Mbps de subida\", \"TV Estándar (120+ canales)\", \"Soporte 24/7\"]'::jsonb, true),
  ('200 Mbps', 69.99, '200 Mbps', '40 Mbps', '[\"200 Mbps de descarga\", \"40 Mbps de subida\", \"Router de alta gama\", \"Soporte prioritario\"]'::jsonb, false),
  ('200 Mbps + TV Premium', 79.99, '200 Mbps', '40 Mbps', '[\"200 Mbps de descarga\", \"40 Mbps de subida\", \"TV Premium (180+ canales)\", \"HBO, Netflix incluido\", \"Router de alta gama\", \"Soporte prioritario\"]'::jsonb, false)
ON CONFLICT DO NOTHING;

-- Insertar zonas de ejemplo
INSERT INTO zones (name, description, color, center_latitude, center_longitude) VALUES
  ('Zona Norte', 'Área residencial norte de la ciudad', '#3B82F6', -12.020000, -77.030000),
  ('Zona Sur', 'Área comercial sur', '#10B981', -12.080000, -77.050000),
  ('Zona Este', 'Zona industrial este', '#F59E0B', -12.050000, -77.010000),
  ('Zona Oeste', 'Zona residencial oeste', '#EF4444', -12.060000, -77.070000),
  ('Centro', 'Área del centro histórico', '#8B5CF6', -12.046374, -77.042793)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Para ejecutar funciones manualmente:
-- SELECT * FROM generate_monthly_invoices();
-- SELECT * FROM update_delinquent_clients();
-- SELECT * FROM billing_dashboard;
