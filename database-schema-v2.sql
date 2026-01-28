-- =====================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS - VERSIÓN 2
-- Digital+ ISP - Sistema Completo con Autenticación y Logs
-- =====================================================

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

-- Índice para email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- 2. TABLA DE LOGS DE AUDITORÍA
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete'
  entity_type VARCHAR(50) NOT NULL, -- 'client', 'plan', 'invoice', 'user'
  entity_id UUID,
  entity_name VARCHAR(255),
  changes JSONB, -- Guarda los cambios realizados
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- 3. ACTUALIZAR TABLA DE PLANES (Añadir fecha de vencimiento)
-- =====================================================

ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- =====================================================
-- 4. ACTUALIZAR TABLA DE CLIENTES (Añadir GPS y otros campos)
-- =====================================================

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS next_billing_date DATE;

-- Índice geoespacial
CREATE INDEX IF NOT EXISTS idx_clients_location ON clients(latitude, longitude);

-- =====================================================
-- 5. ACTUALIZAR TABLA DE FACTURAS (Añadir campos adicionales)
-- =====================================================

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50), -- 'cash', 'card', 'transfer', 'other'
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_monthly_auto BOOLEAN DEFAULT false; -- Si es factura automática mensual

-- =====================================================
-- 6. FUNCIÓN PARA CREAR FACTURAS MENSUALES MASIVAS
-- =====================================================

CREATE OR REPLACE FUNCTION generate_monthly_invoices(cutoff_day INT DEFAULT 10)
RETURNS TABLE(
  invoice_id UUID,
  client_id UUID,
  client_name VARCHAR,
  amount DECIMAL,
  message TEXT
) AS $$
DECLARE
  current_month INT;
  current_year INT;
  due_date DATE;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Calcular fecha de vencimiento (día 10 del mes actual)
  due_date := DATE(current_year || '-' || current_month || '-' || cutoff_day);
  
  -- Si ya pasó el día 10 de este mes, la próxima factura es para el mes siguiente
  IF CURRENT_DATE > due_date THEN
    IF current_month = 12 THEN
      current_month := 1;
      current_year := current_year + 1;
    ELSE
      current_month := current_month + 1;
    END IF;
    due_date := DATE(current_year || '-' || current_month || '-' || cutoff_day);
  END IF;
  
  -- Crear facturas para todos los clientes activos
  RETURN QUERY
  INSERT INTO invoices (
    client_id,
    client_name,
    amount,
    description,
    status,
    due_date,
    is_monthly_auto
  )
  SELECT 
    c.id,
    c.name,
    c.monthly_fee,
    'Factura mensual de servicio - ' || TO_CHAR(due_date, 'YYYY-MM'),
    'pending',
    due_date,
    true
  FROM clients c
  WHERE c.status IN ('active', 'delinquent')
    AND c.monthly_fee IS NOT NULL
    AND c.monthly_fee > 0
    -- Evitar duplicados: no crear si ya existe una factura pendiente para este mes
    AND NOT EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.client_id = c.id
        AND i.due_date = due_date
        AND i.is_monthly_auto = true
    )
  RETURNING 
    id AS invoice_id,
    client_id,
    client_name,
    amount,
    'Factura creada exitosamente' AS message;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCIÓN PARA ACTUALIZAR ESTADO DE CLIENTES MOROSOS
-- =====================================================

CREATE OR REPLACE FUNCTION update_delinquent_clients()
RETURNS TABLE(
  client_id UUID,
  client_name VARCHAR,
  old_status VARCHAR,
  new_status VARCHAR,
  message TEXT
) AS $$
BEGIN
  -- Actualizar clientes a morosos si tienen facturas vencidas sin pagar
  RETURN QUERY
  UPDATE clients c
  SET status = 'delinquent'
  WHERE c.id IN (
    SELECT DISTINCT i.client_id
    FROM invoices i
    WHERE i.status IN ('pending', 'overdue')
      AND i.due_date < CURRENT_DATE
      AND i.client_id IS NOT NULL
  )
  AND c.status = 'active'
  RETURNING 
    c.id AS client_id,
    c.name AS client_name,
    'active' AS old_status,
    'delinquent' AS new_status,
    'Cliente marcado como moroso por factura vencida' AS message;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCIÓN PARA MARCAR FACTURAS COMO VENCIDAS
-- =====================================================

CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS TABLE(
  invoice_id UUID,
  client_name VARCHAR,
  amount DECIMAL,
  due_date DATE,
  message TEXT
) AS $$
BEGIN
  -- Marcar facturas como vencidas si pasó la fecha de vencimiento
  RETURN QUERY
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE
  RETURNING 
    id AS invoice_id,
    client_name,
    amount,
    due_date,
    'Factura marcada como vencida' AS message;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGER PARA ACTUALIZAR ESTADO DE CLIENTE AL PAGAR
-- =====================================================

CREATE OR REPLACE FUNCTION update_client_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la factura se marca como pagada
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- Verificar si el cliente tiene otras facturas pendientes
    IF NOT EXISTS (
      SELECT 1 FROM invoices
      WHERE client_id = NEW.client_id
        AND status IN ('pending', 'overdue')
        AND id != NEW.id
    ) THEN
      -- Si no tiene más facturas pendientes, cambiar a activo
      UPDATE clients
      SET 
        status = 'active',
        last_payment_date = NEW.paid_date
      WHERE id = NEW.client_id;
    ELSE
      -- Solo actualizar la fecha del último pago
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

-- =====================================================
-- 10. FUNCIÓN PARA REGISTRAR LOGS AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  action_type VARCHAR(10);
  changes_json JSONB;
BEGIN
  -- Determinar el tipo de acción
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
  
  -- Insertar log (el user_id se debe pasar desde la aplicación)
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

-- Aplicar triggers de auditoría a las tablas principales
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

-- =====================================================
-- 11. POLÍTICAS RLS PARA NUEVAS TABLAS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Permitir todas las operaciones en users (temporal, se debe refinar)
CREATE POLICY "Allow all operations on users" 
  ON users FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Permitir lectura de logs a todos
CREATE POLICY "Allow read access to audit_logs" 
  ON audit_logs FOR SELECT 
  USING (true);

-- Solo admins pueden insertar logs (esto se debe controlar desde la app)
CREATE POLICY "Allow insert on audit_logs" 
  ON audit_logs FOR INSERT 
  WITH CHECK (true);

-- =====================================================
-- 12. TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 13. CREAR USUARIO ADMINISTRADOR POR DEFECTO
-- =====================================================

-- Nota: La contraseña es "admin123" hasheada con bcrypt
-- En producción, cambiar esta contraseña inmediatamente
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@digitalplus.com',
  '$2a$10$K7SXZQgGfJ.zKJxz1Xj5xOYKGxGnYr7xUGp4rC8qVqm5wYJGzO7YG', -- admin123
  'Administrador',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Para ejecutar las funciones manualmente:
-- SELECT * FROM generate_monthly_invoices(10); -- Generar facturas con corte día 10
-- SELECT * FROM update_delinquent_clients(); -- Actualizar clientes morosos
-- SELECT * FROM update_overdue_invoices(); -- Marcar facturas vencidas
