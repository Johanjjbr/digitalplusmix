-- =====================================================
-- SCRIPT DE ACTUALIZACIÓN V3 - Tickets y Zonas
-- Digital+ ISP - Sistema Completo
-- =====================================================

-- =====================================================
-- 1. TABLA DE ZONAS
-- =====================================================

CREATE TABLE IF NOT EXISTS zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3B82F6', -- Color para el mapa
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para zonas
CREATE INDEX IF NOT EXISTS idx_zones_name ON zones(name);

-- =====================================================
-- 2. AÑADIR CAMPO DE ZONA A CLIENTES
-- =====================================================

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_zone_id ON clients(zone_id);

-- =====================================================
-- 3. TABLA DE TICKETS
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

-- Índices para tickets
CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- =====================================================
-- 4. TABLA DE COMENTARIOS DE TICKETS
-- =====================================================

CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Si es nota interna o visible al cliente
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at);

-- =====================================================
-- 5. ACTUALIZAR TABLA DE FACTURAS PARA PAGOS PARCIALES
-- =====================================================

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2);

-- Función para calcular el balance
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance := NEW.amount - COALESCE(NEW.amount_paid, 0);
  
  -- Si el balance es 0 o negativo, marcar como pagado
  IF NEW.balance <= 0 THEN
    NEW.status := 'paid';
    IF NEW.paid_date IS NULL THEN
      NEW.paid_date := CURRENT_DATE;
    END IF;
  ELSIF NEW.balance < NEW.amount THEN
    -- Pago parcial, mantener como pending
    NEW.status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular balance automáticamente
DROP TRIGGER IF EXISTS trigger_calculate_invoice_balance ON invoices;
CREATE TRIGGER trigger_calculate_invoice_balance
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_balance();

-- =====================================================
-- 6. TABLA DE PAGOS (HISTORIAL DE PAGOS PARCIALES)
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

-- Trigger para actualizar el monto pagado de la factura
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar amount_paid de la factura sumando todos los pagos
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

-- =====================================================
-- 7. TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================

DROP TRIGGER IF EXISTS update_zones_updated_at ON zones;
CREATE TRIGGER update_zones_updated_at 
  BEFORE UPDATE ON zones 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at 
  BEFORE UPDATE ON tickets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. TRIGGERS DE AUDITORÍA PARA NUEVAS TABLAS
-- =====================================================

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
-- 9. POLÍTICAS RLS
-- =====================================================

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on zones" 
  ON zones FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on tickets" 
  ON tickets FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on ticket_comments" 
  ON ticket_comments FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Allow all operations on payments" 
  ON payments FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- 10. FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener estadísticas de tickets
CREATE OR REPLACE FUNCTION get_ticket_stats()
RETURNS TABLE(
  total_tickets BIGINT,
  open_tickets BIGINT,
  in_progress_tickets BIGINT,
  resolved_tickets BIGINT,
  avg_resolution_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
    COUNT(*) FILTER (WHERE status = 'resolved' OR status = 'closed') as resolved_tickets,
    AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time
  FROM tickets;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener clientes por zona
CREATE OR REPLACE FUNCTION get_clients_by_zone(zone_id_param UUID)
RETURNS TABLE(
  client_id UUID,
  client_name VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  status VARCHAR,
  plan_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id as client_id,
    name as client_name,
    latitude,
    longitude,
    status,
    plan_name
  FROM clients
  WHERE zone_id = zone_id_param
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. DATOS DE EJEMPLO PARA ZONAS
-- =====================================================

INSERT INTO zones (name, description, color, center_latitude, center_longitude) VALUES
  ('Zona Norte', 'Área residencial norte de la ciudad', '#3B82F6', -12.020000, -77.030000),
  ('Zona Sur', 'Área comercial sur', '#10B981', -12.080000, -77.050000),
  ('Zona Este', 'Zona industrial este', '#F59E0B', -12.050000, -77.010000),
  ('Zona Oeste', 'Zona residencial oeste', '#EF4444', -12.060000, -77.070000),
  ('Centro', 'Área del centro histórico', '#8B5CF6', -12.046374, -77.042793)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FIN DEL SCRIPT V3
-- =====================================================

-- Para ejecutar funciones manualmente:
-- SELECT * FROM get_ticket_stats();
-- SELECT * FROM get_clients_by_zone('zone-uuid-here');
