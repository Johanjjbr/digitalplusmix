import type { PaymentSettings } from './api-extended';
import { formatPeriod } from './billing-period';

export const DEFAULT_WHATSAPP_TEMPLATE = `Hola {nombre}, le saludamos de Digital+ ISP.

Le recordamos que su servicio de internet tiene pagos pendientes:
{detalle}

*Total a pagar: {monto}*

Datos para Pago Móvil:
Banco: {banco}
Teléfono: {telefono}
Cédula/RIF: {cedula}
Titular: {titular}

Por favor envíenos el comprobante por este medio. ¡Gracias!`;

export interface PendingInvoice {
  id: string;
  amount: number;
  balance?: number | null;
  amountPaid?: number | null;
  billingPeriod?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  description?: string;
}

const money = (n: number) => `$${n.toFixed(2)}`;

// Lo que todavía se debe de una factura
export function pendingAmount(inv: PendingInvoice): number {
  if (inv.balance !== null && inv.balance !== undefined) return Math.max(0, Number(inv.balance));
  return Math.max(0, Number(inv.amount) - Number(inv.amountPaid || 0));
}

// Nombre del mes de la factura ("Octubre 2026")
export function invoiceMonthLabel(inv: PendingInvoice): string {
  if (inv.billingPeriod) return formatPeriod(inv.billingPeriod);
  const ref = inv.createdAt || inv.dueDate;
  if (!ref) return inv.description || 'Factura';
  const d = new Date(ref);
  return formatPeriod(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
}

// Ordena facturas del mes más viejo al más nuevo
export function sortByPeriod<T extends PendingInvoice>(invoices: T[]): T[] {
  const key = (i: PendingInvoice) => i.billingPeriod || i.createdAt || i.dueDate || '';
  return [...invoices].sort((a, b) => key(a).localeCompare(key(b)));
}

// 0414-123.45.67 -> 584141234567 ; +54 9 11 ... -> 54911...
export function normalizePhone(phone: string | null | undefined, countryCode = '58'): string | null {
  if (!phone) return null;
  const cc = (countryCode || '58').replace(/\D/g, '');
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (phone.trim().startsWith('+')) return digits.length >= 10 ? digits : null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = cc + digits.slice(1);
  else if (!digits.startsWith(cc) || digits.length <= 10) digits = cc + digits;
  return digits.length >= 10 ? digits : null;
}

export function buildReminderMessage(
  clientName: string,
  invoices: PendingInvoice[],
  settings: PaymentSettings
): string {
  const ordered = sortByPeriod(invoices);
  const total = ordered.reduce((s, i) => s + pendingAmount(i), 0);
  const months = ordered.map(invoiceMonthLabel);
  const detail = ordered.map((i) => `• ${invoiceMonthLabel(i)}: ${money(pendingAmount(i))}`).join('\n');

  const template = settings.whatsappTemplate?.trim() || DEFAULT_WHATSAPP_TEMPLATE;
  const values: Record<string, string> = {
    nombre: clientName,
    meses: months.join(', '),
    detalle: detail,
    monto: money(total),
    banco: settings.pmBank || '-',
    telefono: settings.pmPhone || '-',
    cedula: settings.pmIdNumber || '-',
    titular: settings.pmHolder || '-',
  };

  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
