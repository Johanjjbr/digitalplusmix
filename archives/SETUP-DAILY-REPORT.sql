-- =====================================================
-- INSTRUCCIONES PARA CONFIGURAR EL REPORTE DIARIO
-- =====================================================

-- Este script asegura que la tabla 'payments' tenga todos los campos
-- necesarios para el reporte diario. Si ya ejecutaste el schema completo,
-- NO necesitas ejecutar esto.

-- =====================================================
-- 1. VERIFICAR QUE LA TABLA PAYMENTS EXISTE
-- =====================================================

-- Si la tabla no existe, créala:
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

-- =====================================================
-- 2. ASEGURAR ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- =====================================================
-- 3. HABILITAR RLS (Row Level Security)
-- =====================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura de pagos
CREATE POLICY IF NOT EXISTS "Allow read access to payments" 
  ON payments FOR SELECT 
  USING (true);

-- Política para permitir inserción de pagos
CREATE POLICY IF NOT EXISTS "Allow insert on payments" 
  ON payments FOR INSERT 
  WITH CHECK (true);

-- Política para permitir actualización de pagos
CREATE POLICY IF NOT EXISTS "Allow update on payments" 
  ON payments FOR UPDATE 
  USING (true);

-- Política para permitir eliminación de pagos
CREATE POLICY IF NOT EXISTS "Allow delete on payments" 
  ON payments FOR DELETE 
  USING (true);

-- =====================================================
-- 4. FUNCIÓN AUXILIAR PARA OBTENER PAGOS DEL DÍA
-- =====================================================

-- Esta función puede ser útil para obtener reportes directamente desde SQL
CREATE OR REPLACE FUNCTION get_daily_payments_report(report_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  payment_id UUID,
  client_name VARCHAR,
  client_email VARCHAR,
  client_phone VARCHAR,
  invoice_description TEXT,
  payment_method VARCHAR,
  payment_reference VARCHAR,
  amount DECIMAL,
  payment_date DATE,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS payment_id,
    c.name AS client_name,
    c.email AS client_email,
    c.phone AS client_phone,
    i.description AS invoice_description,
    p.payment_method,
    p.payment_reference,
    p.amount,
    p.payment_date,
    p.notes
  FROM payments p
  LEFT JOIN clients c ON p.client_id = c.id
  LEFT JOIN invoices i ON p.invoice_id = i.id
  WHERE p.payment_date = report_date
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNCIÓN PARA OBTENER RESUMEN DIARIO
-- =====================================================

CREATE OR REPLACE FUNCTION get_daily_summary(report_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  total_amount DECIMAL,
  total_transactions BIGINT,
  total_clients BIGINT,
  cash_total DECIMAL,
  card_total DECIMAL,
  transfer_total DECIMAL,
  punto_total DECIMAL,
  other_total DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(p.amount), 0) AS total_amount,
    COUNT(p.id) AS total_transactions,
    COUNT(DISTINCT p.client_id) AS total_clients,
    COALESCE(SUM(CASE WHEN p.payment_method = 'cash' THEN p.amount ELSE 0 END), 0) AS cash_total,
    COALESCE(SUM(CASE WHEN p.payment_method = 'card' THEN p.amount ELSE 0 END), 0) AS card_total,
    COALESCE(SUM(CASE WHEN p.payment_method = 'transfer' THEN p.amount ELSE 0 END), 0) AS transfer_total,
    COALESCE(SUM(CASE WHEN p.payment_method = 'punto' THEN p.amount ELSE 0 END), 0) AS punto_total,
    COALESCE(SUM(CASE WHEN p.payment_method NOT IN ('cash', 'card', 'transfer', 'punto') THEN p.amount ELSE 0 END), 0) AS other_total
  FROM payments p
  WHERE p.payment_date = report_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. EJEMPLOS DE USO
-- =====================================================

-- Para obtener el reporte de hoy:
-- SELECT * FROM get_daily_payments_report();

-- Para obtener el reporte de una fecha específica:
-- SELECT * FROM get_daily_payments_report('2024-03-04');

-- Para obtener el resumen de hoy:
-- SELECT * FROM get_daily_summary();

-- Para obtener el resumen de una fecha específica:
-- SELECT * FROM get_daily_summary('2024-03-04');

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- NOTA: Si todo está funcionando correctamente en la aplicación,
-- NO necesitas ejecutar este script. Está aquí como referencia.
