// Helpers del "mes facturado" (billing_period) de las facturas mensuales

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// 'YYYY-MM' o 'YYYY-MM-DD' (o vacío = mes actual) -> 'YYYY-MM-01'
export function toPeriodStart(period?: string | null): string {
  if (period && /^\d{4}-\d{2}/.test(period)) return `${period.slice(0, 7)}-01`;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// 'YYYY-MM-01' -> 'Octubre 2026'
export function formatPeriod(period?: string | null): string {
  if (!period) return '';
  const [y, m] = period.split('-').map(Number);
  if (!y || !m) return period;
  return `${MONTHS_ES[m - 1]} ${y}`;
}
