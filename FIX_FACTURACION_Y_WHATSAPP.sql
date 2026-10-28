-- =====================================================================
-- FIX: FACTURAS DUPLICADAS + ORDEN DE MESES + DATOS PAGO MÓVIL/WHATSAPP
-- =====================================================================
-- Ejecutar UNA vez en Supabase > SQL Editor (proyecto xuidgexzmtfuedexoyts).
-- Es seguro volver a ejecutarlo.
--
-- Qué hace:
--  1. Agrega a cada factura mensual el "mes facturado" (billing_period).
--  2. Limpia las facturas duplicadas que ya existen (mismo cliente + mismo mes):
--       - Conserva la pagada (o la más antigua si ninguna está pagada).
--       - Borra SOLO las copias sin ningún pago.
--       - Si una copia tiene pagos, NO se borra: se marca "[DUPLICADA - revisar]".
--  3. Crea un índice único: la base de datos ya no acepta 2 facturas del
--     mismo mes para el mismo cliente, venga de donde venga.
--  4. Reescribe la generación mensual y el mantenimiento:
--       - Si el mes ya está facturado (pagado o no) NO se vuelve a crear.
--       - Factura a clientes al día y morosos (los suspendidos no).
--       - Morosos pasan a "al día" automáticamente cuando ya no deben nada vencido.
--  5. Agrega a la configuración los datos de Pago Móvil y el mensaje de WhatsApp.
--
-- ANTES de correrlo, si quieres ver qué duplicadas hay, ejecuta solo el
-- bloque "VISTA PREVIA" de abajo (seleccionándolo).
-- =====================================================================

-- ---------------------------------------------------------------------
-- VISTA PREVIA (opcional): facturas mensuales duplicadas actuales
-- ---------------------------------------------------------------------
-- SELECT client_name, to_char(date_trunc('month', COALESCE(date, created_at::date)), 'YYYY-MM') AS mes,
--        COUNT(*) AS cantidad, string_agg(status || ' $' || amount, ', ') AS facturas
-- FROM invoices
-- WHERE is_monthly_auto = true OR description ILIKE '%mensual%' OR description ILIKE 'Pago Adelantado%'
-- GROUP BY client_id, client_name, 2
-- HAVING COUNT(*) > 1
-- ORDER BY client_name, mes;

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Columnas nuevas
-- ---------------------------------------------------------------------
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_period DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_monthly_auto BOOLEAN DEFAULT false;
ALTER TABLE clients  ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN invoices.billing_period IS
  'Primer día del mes que cubre la factura mensual. NULL = factura suelta (no mensual).';

-- Configuración de Pago Móvil / WhatsApp
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS pm_bank TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS pm_phone TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS pm_id_number TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS pm_holder TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS whatsapp_country_code TEXT DEFAULT '58';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS whatsapp_template TEXT;

INSERT INTO system_settings (auto_generate_invoices, billing_day)
SELECT true, 1 WHERE NOT EXISTS (SELECT 1 FROM system_settings);

-- ---------------------------------------------------------------------
-- 2. Rellenar el mes facturado de las facturas mensuales existentes
--    Primero intenta leer el mes de la descripción ("... - octubre de 2026"),
--    si no puede usa la fecha de la factura.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION _month_from_text(p_text TEXT)
RETURNS DATE LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  m TEXT[];
  v_names TEXT[] := ARRAY['enero','febrero','marzo','abril','mayo','junio','julio',
                          'agosto','septiembre','octubre','noviembre','diciembre'];
  v_en    TEXT[] := ARRAY['january','february','march','april','may','june','july',
                          'august','september','october','november','december'];
  i INT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  m := regexp_match(lower(p_text),
        '(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)\s*(de\s*)?(\d{4})');
  IF m IS NULL THEN RETURN NULL; END IF;
  IF m[1] = 'setiembre' THEN m[1] := 'septiembre'; END IF;
  i := array_position(v_names, m[1]);
  IF i IS NULL THEN i := array_position(v_en, m[1]); END IF;
  IF i IS NULL THEN RETURN NULL; END IF;
  RETURN make_date(m[3]::INT, i, 1);
END $$;

UPDATE invoices
SET billing_period = COALESCE(
      _month_from_text(description),
      date_trunc('month', COALESCE(date, created_at::date))::date)
WHERE billing_period IS NULL
  AND (is_monthly_auto = true
       OR description ILIKE '%mensual%'
       OR description ILIKE 'Pago Adelantado%');

-- ---------------------------------------------------------------------
-- 3. Limpiar duplicados existentes
-- ---------------------------------------------------------------------
CREATE TEMP TABLE _dup_invoices ON COMMIT DROP AS
SELECT id, has_payments
FROM (
  SELECT i.id,
         (COALESCE(i.amount_paid, 0) > 0 OR i.status = 'paid') AS has_payments,
         ROW_NUMBER() OVER (
           PARTITION BY i.client_id, i.billing_period
           ORDER BY (i.status = 'paid') DESC, COALESCE(i.amount_paid, 0) DESC, i.created_at ASC
         ) AS rn
  FROM invoices i
  WHERE i.billing_period IS NOT NULL
) t
WHERE rn > 1;

-- Si existe la tabla payments, una copia con pagos registrados tampoco se borra
DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    UPDATE _dup_invoices d SET has_payments = true
    WHERE EXISTS (SELECT 1 FROM payments p WHERE p.invoice_id = d.id);
  END IF;
END $$;

DELETE FROM invoices WHERE id IN (SELECT id FROM _dup_invoices WHERE NOT has_payments);

UPDATE invoices
SET billing_period = NULL,
    notes = TRIM(COALESCE(notes, '') || ' [DUPLICADA - revisar]')
WHERE id IN (SELECT id FROM _dup_invoices WHERE has_payments);

-- ---------------------------------------------------------------------
-- 4. Candado: 1 factura mensual por cliente por mes
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_client_period
  ON invoices (client_id, billing_period)
  WHERE billing_period IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_billing_period ON invoices (billing_period);

-- ---------------------------------------------------------------------
-- 5. Borrar versiones anteriores de las funciones (cualquier firma)
-- ---------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('generate_monthly_invoices', 'update_overdue_invoices',
                        'update_delinquent_clients', 'run_billing_maintenance')
  LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 6. Generación mensual (sin duplicados)
--    - Sin parámetros  = modo automático (cron): respeta "facturación
--      automática" y el día de facturación de Configuración.
--    - p_manual = true = desde el botón "Facturas Mensuales".
-- ---------------------------------------------------------------------
CREATE FUNCTION generate_monthly_invoices(
  p_period     DATE    DEFAULT NULL,   -- cualquier día del mes a facturar (NULL = mes actual)
  p_client_ids UUID[]  DEFAULT NULL,   -- NULL = todos los clientes al día y morosos
  p_due_date   DATE    DEFAULT NULL,   -- NULL = 10 días después del día de facturación
  p_manual     BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  invoices_created INTEGER,
  clients_billed   INTEGER,
  total_amount     DECIMAL,
  skipped_existing INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
  v_settings  RECORD;
  v_has_cfg   BOOLEAN;
  v_period    DATE := date_trunc('month', COALESCE(p_period, CURRENT_DATE))::date;
  v_period_end DATE;
  v_billing_day INT;
  v_due       DATE;
  v_client    RECORD;
  v_new_id    UUID;
  v_used      DECIMAL;
  v_created   INT := 0;
  v_skipped   INT := 0;
  v_total     DECIMAL := 0;
  v_months    TEXT[] := ARRAY['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                              'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  v_label     TEXT;
BEGIN
  v_period_end := (v_period + INTERVAL '1 month - 1 day')::date;

  SELECT * INTO v_settings FROM system_settings ORDER BY created_at LIMIT 1;
  v_has_cfg := FOUND;
  v_billing_day := CASE WHEN v_has_cfg THEN COALESCE(v_settings.billing_day, 1) ELSE 1 END;

  IF NOT p_manual THEN
    IF v_has_cfg AND v_settings.auto_generate_invoices = false THEN
      RETURN QUERY SELECT 0, 0, 0::DECIMAL, 0; RETURN;
    END IF;
    -- Si el cron no corrió justo el día de facturación, se pone al día después
    IF EXTRACT(DAY FROM CURRENT_DATE) < v_billing_day THEN
      RETURN QUERY SELECT 0, 0, 0::DECIMAL, 0; RETURN;
    END IF;
  END IF;

  v_due   := COALESCE(p_due_date, v_period + (v_billing_day - 1) + 10);
  v_label := v_months[EXTRACT(MONTH FROM v_period)::INT] || ' ' || EXTRACT(YEAR FROM v_period)::INT;

  FOR v_client IN
    SELECT c.id, c.name, c.monthly_fee, c.plan_name, COALESCE(c.credit_balance, 0) AS credit
    FROM clients c
    WHERE c.monthly_fee > 0
      AND (
        (p_client_ids IS NULL
          AND c.status IN ('active', 'delinquent')
          AND (c.join_date IS NULL OR c.join_date <= v_period_end))
        OR c.id = ANY (p_client_ids)
      )
    ORDER BY c.name
    FOR UPDATE
  LOOP
    -- ¿Ya tiene la factura de este mes (pagada o no)? -> no crear otra
    IF EXISTS (SELECT 1 FROM invoices
               WHERE client_id = v_client.id AND billing_period = v_period) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_used := LEAST(v_client.credit, v_client.monthly_fee);
    v_new_id := NULL;

    INSERT INTO invoices (
      client_id, client_name, date, due_date, description,
      amount, amount_paid, balance, status, is_monthly_auto, billing_period
    ) VALUES (
      v_client.id, v_client.name, CURRENT_DATE, v_due,
      'Servicio mensual - ' || COALESCE(v_client.plan_name, 'Internet') || ' - ' || v_label
        || CASE WHEN v_used > 0 THEN ' (Saldo a favor aplicado: $' || to_char(v_used, 'FM999990.00') || ')' ELSE '' END,
      v_client.monthly_fee, v_used, v_client.monthly_fee - v_used,
      CASE WHEN v_used >= v_client.monthly_fee THEN 'paid' ELSE 'pending' END,
      NOT p_manual, v_period
    )
    ON CONFLICT (client_id, billing_period) WHERE billing_period IS NOT NULL DO NOTHING
    RETURNING id INTO v_new_id;

    IF v_new_id IS NULL THEN          -- otra ejecución simultánea la creó
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    IF v_used > 0 THEN
      UPDATE clients SET credit_balance = credit_balance - v_used WHERE id = v_client.id;
    END IF;

    v_created := v_created + 1;
    v_total   := v_total + v_client.monthly_fee;
  END LOOP;

  IF v_has_cfg AND NOT p_manual THEN
    UPDATE system_settings SET last_billing_run = CURRENT_DATE WHERE id = v_settings.id;
  END IF;

  RETURN QUERY SELECT v_created, v_created, v_total, v_skipped;
END $$;

-- ---------------------------------------------------------------------
-- 7. Mantenimiento
-- ---------------------------------------------------------------------
-- Facturas pendientes con fecha de vencimiento pasada -> vencidas
CREATE FUNCTION update_overdue_invoices()
RETURNS SETOF UUID LANGUAGE sql AS $$
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE
    AND COALESCE(balance, amount - COALESCE(amount_paid, 0)) > 0
  RETURNING id;
$$;

-- Al día <-> Moroso según tengan o no facturas vencidas sin pagar
CREATE FUNCTION update_delinquent_clients()
RETURNS TABLE (clients_updated INTEGER, clients_reactivated INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  v_up INT; v_back INT;
BEGIN
  PERFORM update_overdue_invoices();

  UPDATE clients c SET status = 'delinquent'
  WHERE c.status = 'active'
    AND EXISTS (SELECT 1 FROM invoices i
                WHERE i.client_id = c.id AND i.status = 'overdue');
  GET DIAGNOSTICS v_up = ROW_COUNT;

  UPDATE clients c SET status = 'active'
  WHERE c.status = 'delinquent'
    AND NOT EXISTS (SELECT 1 FROM invoices i
                    WHERE i.client_id = c.id AND i.status = 'overdue');
  GET DIAGNOSTICS v_back = ROW_COUNT;

  RETURN QUERY SELECT v_up, v_back;
END $$;

-- Botón "Mantenimiento": genera lo que falte del mes (sin duplicar) y
-- actualiza vencidas / morosos / al día
CREATE FUNCTION run_billing_maintenance()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_gen     RECORD;
  v_overdue INT;
  v_del     RECORD;
BEGIN
  SELECT * INTO v_gen FROM generate_monthly_invoices();

  SELECT COUNT(*) INTO v_overdue FROM update_overdue_invoices();

  SELECT * INTO v_del FROM update_delinquent_clients();

  RETURN json_build_object(
    'invoices_created',    COALESCE(v_gen.invoices_created, 0),
    'invoices_skipped',    COALESCE(v_gen.skipped_existing, 0),
    'overdue_invoices',    v_overdue,
    'delinquent_clients',  COALESCE(v_del.clients_updated, 0),
    'reactivated_clients', COALESCE(v_del.clients_reactivated, 0)
  );
END $$;

GRANT EXECUTE ON FUNCTION generate_monthly_invoices(DATE, UUID[], DATE, BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_overdue_invoices()   TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_delinquent_clients() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION run_billing_maintenance()   TO anon, authenticated, service_role;

COMMIT;

-- Resultado: debería devolver 0 filas (ya no hay duplicadas)
SELECT client_name, billing_period, COUNT(*)
FROM invoices WHERE billing_period IS NOT NULL
GROUP BY client_id, client_name, billing_period HAVING COUNT(*) > 1;
