-- SCRIPT SQL PARA NUEVAS FUNCIONALIDADES
-- Sistema de Gestión Digital+ ISP
-- Fecha: 13 de Febrero de 2026

-- =============================================================================
-- NOTA: La tabla 'users' ya existe en el sistema
-- Este script es solo para referencia y verificación
-- =============================================================================

-- Verificar estructura de la tabla users
-- La tabla debe tener estos campos:

/*
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'technician')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- =============================================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS DEL REPORTE DIARIO
-- =============================================================================

-- Índice en created_at de invoices para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_invoices_created_at 
ON invoices(created_at);

-- Índice en join_date de clients para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_clients_join_date 
ON clients(join_date);

-- Índice en status de invoices para filtros rápidos
CREATE INDEX IF NOT EXISTS idx_invoices_status 
ON invoices(status);

-- Índice compuesto para búsquedas optimizadas de facturas por cliente y fecha
CREATE INDEX IF NOT EXISTS idx_invoices_client_date 
ON invoices(client_id, created_at DESC);

-- =============================================================================
-- FUNCIONES ÚTILES PARA REPORTES
-- =============================================================================

-- Función para obtener estadísticas diarias
CREATE OR REPLACE FUNCTION get_daily_stats(target_date DATE)
RETURNS TABLE (
    total_invoices BIGINT,
    total_amount NUMERIC,
    paid_amount NUMERIC,
    pending_amount NUMERIC,
    new_clients BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total de facturas del día
        COUNT(DISTINCT i.id)::BIGINT,
        -- Total facturado
        COALESCE(SUM(i.amount), 0)::NUMERIC,
        -- Total cobrado (facturas pagadas)
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0)::NUMERIC,
        -- Total pendiente (facturas no pagadas)
        COALESCE(SUM(CASE WHEN i.status != 'paid' THEN i.amount ELSE 0 END), 0)::NUMERIC,
        -- Clientes nuevos del día
        (SELECT COUNT(*)::BIGINT 
         FROM clients 
         WHERE DATE(join_date) = target_date)
    FROM invoices i
    WHERE DATE(i.created_at) = target_date;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM get_daily_stats('2026-02-13');

-- =============================================================================
-- VISTA PARA REPORTE DIARIO COMPLETO
-- =============================================================================

CREATE OR REPLACE VIEW daily_invoices_view AS
SELECT 
    i.id,
    i.client_id,
    c.name as client_name,
    i.amount,
    i.status,
    i.description,
    i.created_at,
    DATE(i.created_at) as invoice_date,
    EXTRACT(HOUR FROM i.created_at)::INTEGER as hour,
    EXTRACT(MINUTE FROM i.created_at)::INTEGER as minute
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
ORDER BY i.created_at DESC;

-- Ejemplo de uso:
-- SELECT * FROM daily_invoices_view WHERE invoice_date = '2026-02-13';

-- =============================================================================
-- VISTA PARA NUEVOS CLIENTES DEL DÍA
-- =============================================================================

CREATE OR REPLACE VIEW daily_new_clients_view AS
SELECT 
    id,
    name,
    email,
    phone,
    plan_name,
    monthly_fee,
    join_date,
    DATE(join_date) as registration_date,
    EXTRACT(HOUR FROM join_date)::INTEGER as hour,
    EXTRACT(MINUTE FROM join_date)::INTEGER as minute
FROM clients
ORDER BY join_date DESC;

-- Ejemplo de uso:
-- SELECT * FROM daily_new_clients_view WHERE registration_date = '2026-02-13';

-- =============================================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- =============================================================================

-- Habilitar RLS en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver todos los usuarios
CREATE POLICY users_admin_all ON users
    FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE role = 'admin'
        )
    );

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY users_self_select ON users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- =============================================================================
-- TRIGGERS PARA AUDITORÍA
-- =============================================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a la tabla users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =============================================================================

-- Insertar usuarios de prueba si no existen
-- NOTA: Las contraseñas están hasheadas con SHA-256

-- Usuario Admin (password: admin123)
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
    'admin@digitalplus.com',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'Administrador del Sistema',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Usuario Regular (password: user123)
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
    'user@digitalplus.com',
    '6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090',
    'Usuario Regular',
    'user',
    true
) ON CONFLICT (email) DO NOTHING;

-- Usuario Técnico (password: tech123)
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES (
    'tecnico@digitalplus.com',
    'ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27',
    'Técnico de Campo',
    'technician',
    true
) ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- CONSULTAS ÚTILES
-- =============================================================================

-- Ver todos los usuarios con su rol
-- SELECT id, email, full_name, role, is_active, last_login FROM users;

-- Ver facturas de hoy
-- SELECT * FROM daily_invoices_view WHERE invoice_date = CURRENT_DATE;

-- Ver clientes nuevos de hoy
-- SELECT * FROM daily_new_clients_view WHERE registration_date = CURRENT_DATE;

-- Ver estadísticas de hoy
-- SELECT * FROM get_daily_stats(CURRENT_DATE);

-- Ver total facturado por día en el último mes
-- SELECT 
--     DATE(created_at) as fecha,
--     COUNT(*) as facturas,
--     SUM(amount) as total,
--     SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as cobrado
-- FROM invoices
-- WHERE created_at >= NOW() - INTERVAL '30 days'
-- GROUP BY DATE(created_at)
-- ORDER BY fecha DESC;

-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================
