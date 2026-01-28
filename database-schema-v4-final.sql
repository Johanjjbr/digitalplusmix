-- =====================================================
-- SCRIPT DE ACTUALIZACIÓN V4 FINAL
-- Digital+ ISP - Sistema Completo con Facturación Automática
-- =====================================================

-- =====================================================
-- 1. TABLA DE CONFIGURACIÓN DEL SISTEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_generate_invoices BOOLEAN DEFAULT true,
  billing_day INTEGER DEFAULT 1 CHECK (billing_day >= 1 AND billing_day <= 28),
  last_billing_run DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar configuración por defecto si no existe
INSERT INTO system_settings (auto_generate_invoices, billing_day, last_billing_run)
VALUES (true, 1, NULL)
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on system_settings" 
  ON system_settings FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- 2. FUNCIÓN PARA GENERAR FACTURAS MENSUALES AUTOMÁTICAMENTE
-- =====================================================

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
  -- Obtener configuración del sistema
  SELECT * INTO v_settings FROM system_settings LIMIT 1;
  
  -- Verificar si la facturación automática está habilitada
  IF NOT v_settings.auto_generate_invoices THEN
    RAISE NOTICE 'Facturación automática deshabilitada';
    RETURN QUERY SELECT 0, 0, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar si hoy es el día de facturación
  IF EXTRACT(DAY FROM v_today) != v_settings.billing_day THEN
    RAISE NOTICE 'Hoy no es día de facturación. Día configurado: %', v_settings.billing_day;
    RETURN QUERY SELECT 0, 0, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar si ya se ejecutó hoy
  IF v_settings.last_billing_run = v_today THEN
    RAISE NOTICE 'Ya se ejecutó la facturación hoy';
    RETURN QUERY SELECT 0, 0, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Generar facturas para todos los clientes activos
  FOR v_client IN 
    SELECT id, name, monthly_fee, plan_name 
    FROM clients 
    WHERE status = 'active' AND monthly_fee > 0
  LOOP
    -- Verificar si ya existe una factura para este mes
    IF NOT EXISTS (
      SELECT 1 FROM invoices 
      WHERE client_id = v_client.id 
        AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM v_today)
        AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM v_today)
    ) THEN
      -- Crear factura
      INSERT INTO invoices (
        client_id,
        client_name,
        date,
        due_date,
        description,
        amount,
        amount_paid,
        balance,
        status
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
        'pending'
      ) RETURNING id INTO v_invoice_id;
      
      v_invoices_created := v_invoices_created + 1;
      v_clients_billed := v_clients_billed + 1;
      v_total_amount := v_total_amount + v_client.monthly_fee;
      
      RAISE NOTICE 'Factura creada para cliente %: $%', v_client.name, v_client.monthly_fee;
    END IF;
  END LOOP;
  
  -- Actualizar última ejecución
  UPDATE system_settings 
  SET last_billing_run = v_today 
  WHERE id = v_settings.id;
  
  RAISE NOTICE 'Facturación completada: % facturas creadas, % clientes facturados, total $%', 
    v_invoices_created, v_clients_billed, v_total_amount;
  
  RETURN QUERY SELECT v_invoices_created, v_clients_billed, v_total_amount;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FUNCIÓN PARA ACTUALIZAR ESTADO DE CLIENTES MOROSOS
-- =====================================================

CREATE OR REPLACE FUNCTION update_delinquent_clients()
RETURNS TABLE(
  clients_updated INTEGER
) AS $$
DECLARE
  v_clients_updated INTEGER := 0;
  v_client RECORD;
BEGIN
  -- Marcar como morosos a clientes con facturas vencidas
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
  
  -- Actualizar facturas pendientes que ya vencieron
  UPDATE invoices 
  SET status = 'overdue'
  WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
  
  RETURN QUERY SELECT v_clients_updated;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREAR SCHEDULED JOB (Para Supabase con pg_cron)
-- =====================================================

-- NOTA: Esta función requiere la extensión pg_cron instalada
-- Descomentar las siguientes líneas si tu base de datos soporta pg_cron:

/*
-- Habilitar extensión pg_cron (solo si está disponible)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar facturación diaria a las 00:00 UTC
SELECT cron.schedule(
  'daily-billing',
  '0 0 * * *',
  $$SELECT generate_monthly_invoices()$$
);

-- Programar actualización de morosos diaria a las 01:00 UTC
SELECT cron.schedule(
  'daily-delinquent-update',
  '0 1 * * *',
  $$SELECT update_delinquent_clients()$$
);
*/

-- =====================================================
-- 5. VISTA PARA DASHBOARD DE FACTURACIÓN
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
-- 6. FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener resumen de facturación por cliente
CREATE OR REPLACE FUNCTION get_client_billing_summary(client_id_param UUID)
RETURNS TABLE(
  total_invoices BIGINT,
  total_billed DECIMAL,
  total_paid DECIMAL,
  total_pending DECIMAL,
  last_payment_date DATE,
  next_due_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(i.id) as total_invoices,
    SUM(i.amount) as total_billed,
    SUM(i.amount_paid) as total_paid,
    SUM(i.balance) as total_pending,
    MAX(p.payment_date) as last_payment_date,
    MIN(CASE WHEN i.status IN ('pending', 'overdue') THEN i.due_date END) as next_due_date
  FROM invoices i
  LEFT JOIN payments p ON p.invoice_id = i.id
  WHERE i.client_id = client_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. ÍNDICES ADICIONALES PARA RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON invoices(status, due_date);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- =====================================================
-- 8. DATOS DE EJEMPLO
-- =====================================================

-- Ya no necesitamos insertar datos de ejemplo aquí
-- Los datos se crean automáticamente con las funciones

-- =====================================================
-- FIN DEL SCRIPT V4 FINAL
-- =====================================================

-- Para ejecutar funciones manualmente:
-- SELECT * FROM generate_monthly_invoices();
-- SELECT * FROM update_delinquent_clients();
-- SELECT * FROM get_client_billing_summary('client-uuid-here');
-- SELECT * FROM billing_dashboard;

-- IMPORTANTE: Para la facturación automática en Supabase sin pg_cron,
-- necesitas crear una Edge Function que se ejecute con un cron job externo
-- o usar Supabase Edge Functions con un servicio como GitHub Actions.
