-- =====================================================
-- AGREGAR COLUMNA credit_balance A LA TABLA clients
-- =====================================================
-- Este script agrega la columna credit_balance (saldo a favor)
-- a la tabla clients para soportar pagos con excedente.
-- 
-- INSTRUCCIONES:
-- 1. Copiar este código completo
-- 2. Ir a Supabase Dashboard → SQL Editor
-- 3. Crear una nueva query
-- 4. Pegar y ejecutar este código
-- 
-- Es seguro ejecutar múltiples veces (idempotente)
-- =====================================================

-- Agregar columna credit_balance si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'credit_balance'
  ) THEN
    ALTER TABLE clients ADD COLUMN credit_balance DECIMAL(10, 2) DEFAULT 0 NOT NULL;
    RAISE NOTICE 'Columna credit_balance agregada exitosamente';
  ELSE
    RAISE NOTICE 'Columna credit_balance ya existe';
  END IF;
END $$;

-- Asegurarse de que todos los registros existentes tengan un valor válido
UPDATE clients 
SET credit_balance = 0 
WHERE credit_balance IS NULL;

-- Crear índice para mejorar el rendimiento en consultas que filtren por saldo a favor
CREATE INDEX IF NOT EXISTS idx_clients_credit_balance ON clients(credit_balance) 
WHERE credit_balance > 0;

-- Verificar que la columna se creó correctamente
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'credit_balance'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✓ Columna credit_balance configurada correctamente';
    RAISE NOTICE '✓ Todos los clientes tienen saldo a favor inicializado en 0';
  ELSE
    RAISE EXCEPTION 'Error: No se pudo crear la columna credit_balance';
  END IF;
END $$;
