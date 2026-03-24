-- =====================================================
-- FIX RÁPIDO: Error de Mantenimiento "due_date is ambiguous"
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor para corregir
-- el error del botón de Mantenimiento.
-- =====================================================

-- CORRECCIÓN: Función update_overdue_invoices
-- El problema era que las columnas en RETURNING no tenían alias explícitos
-- y PostgreSQL no podía distinguir entre las variables de la función
-- y las columnas de la tabla.

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
  UPDATE invoices inv
  SET status = 'overdue'
  WHERE inv.status = 'pending'
    AND inv.due_date < CURRENT_DATE
  RETURNING 
    inv.id AS invoice_id,
    inv.client_name AS client_name,
    inv.amount AS amount,
    inv.due_date AS due_date,
    'Factura marcada como vencida'::TEXT AS message;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICACIÓN: Probar que funcione correctamente
-- =====================================================

-- Ejecuta esto para probar la función (solo muestra resultados, no cambia nada):
-- SELECT * FROM update_overdue_invoices();

-- =====================================================
-- ✅ LISTO!
-- =====================================================
-- Ahora puedes usar el botón de Mantenimiento sin errores.
