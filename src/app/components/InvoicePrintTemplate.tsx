// src/app/components/InvoicePrintTemplate.tsx
// Plantilla de impresión de facturas para Digital Plus Mix
// Incluye: nombre completo del cliente, cédula, fechas correctas y descripción de mes

import { useEffect } from 'react';

interface InvoiceData {
  id: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  amountPaid?: number;
  balance?: number;
  description?: string;
  status: 'paid' | 'pending' | 'overdue';
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
}

interface ClientData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  documentNumber?: string;
  planName?: string;
  neighborhood?: string;
}

interface InvoicePrintTemplateProps {
  invoice: InvoiceData;
  client?: ClientData | null;
  autoprint?: boolean;
}

// ─── Utilidades ─────────────────────────────────────────────────────────────

function safeDate(raw: string | undefined | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function statusLabel(status: string): { text: string; color: string } {
  switch (status) {
    case 'paid':    return { text: 'PAGADO',    color: '#16a34a' };
    case 'pending': return { text: 'PENDIENTE', color: '#d97706' };
    case 'overdue': return { text: 'VENCIDO',   color: '#dc2626' };
    default:        return { text: status.toUpperCase(), color: '#6b7280' };
  }
}

function paymentMethodLabel(method: string | undefined): string {
  const map: Record<string, string> = {
    cash:     'Efectivo',
    card:     'Tarjeta',
    transfer: 'Transferencia',
    punto:    'Punto de Venta',
    other:    'Otro',
  };
  return method ? (map[method] ?? method) : '—';
}

// ─── Generador de HTML ───────────────────────────────────────────────────────

export function buildInvoiceHTML(invoice: InvoiceData, client?: ClientData | null): string {
  const now = new Date();
  const { text: statusText, color: statusColor } = statusLabel(invoice.status);

  const clientName =
    client?.name?.trim() ||
    invoice.clientName?.trim() ||
    'Sin nombre';

  const docNumber = client?.documentNumber?.trim() || '—';

  const amountPaid = invoice.amountPaid ?? (invoice.status === 'paid' ? invoice.amount : 0);
  const balance    = invoice.balance    ?? (invoice.amount - amountPaid);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Factura #${invoice.id.slice(0, 8).toUpperCase()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 13px;
      color: #1a1a2e;
      background: #fff;
      width: 680px;
      margin: 0 auto;
      padding: 40px 32px 48px;
    }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #1a1a2e; margin-bottom: 24px; }
    .header h1 { font-size: 28px; font-weight: 700; color: #1565c0; letter-spacing: -0.5px; }
    .header p { font-size: 12px; color: #555; margin-top: 2px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 24px; padding: 16px; background: #f5f7fb; border-radius: 8px; }
    .meta-row { display: flex; justify-content: space-between; align-items: baseline; }
    .meta-label { font-weight: 600; color: #444; white-space: nowrap; margin-right: 8px; }
    .meta-value { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; color: #1a1a2e; text-align: right; }
    .meta-value.highlight { color: #1565c0; font-weight: 600; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: #fff; background: ${statusColor}; }
    .section-title { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #888; margin-bottom: 8px; }
    .client-box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .client-name { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
    .client-detail { font-size: 12px; color: #555; margin-top: 2px; }
    .client-doc { display: inline-block; background: #e8f0fe; color: #1565c0; font-weight: 600; font-size: 12px; padding: 2px 8px; border-radius: 4px; margin-top: 6px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #1a1a2e; color: #fff; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; padding: 8px 12px; text-align: left; }
    .items-table th:last-child { text-align: right; }
    .items-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    .items-table td:last-child { text-align: right; font-weight: 600; }
    .items-table tr:last-child td { border-bottom: none; }
    .totals { width: 260px; margin-left: auto; border-top: 2px solid #1a1a2e; padding-top: 10px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .totals-row.grand { font-size: 16px; font-weight: 700; color: #1565c0; margin-top: 4px; padding-top: 6px; border-top: 1px solid #ddd; }
    .totals-row.paid-row { color: #16a34a; font-weight: 600; }
    .totals-row.balance-row { color: #dc2626; font-weight: 600; }
    .payment-info { margin-top: 20px; padding: 12px 16px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 0 8px 8px 0; font-size: 12px; color: #166534; }
    .payment-info b { display: inline-block; min-width: 110px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #888; line-height: 1.8; }
    @media print { body { padding: 20px 24px; width: 100%; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:16px;">
    <button onclick="window.print()" style="background:#1565c0;color:#fff;border:none;padding:8px 20px;border-radius:6px;font-size:13px;cursor:pointer;font-family:inherit;">🖨 Imprimir</button>
  </div>
  <div class="header">
    <h1>Digital Plus Mix</h1>
    <p>Servicio de Internet</p>
    <p>Factura Digital</p>
  </div>
  <div class="meta">
    <div class="meta-row"><span class="meta-label">Factura:</span><span class="meta-value highlight">#${invoice.id.slice(0, 8).toUpperCase()}</span></div>
    <div class="meta-row"><span class="meta-label">Estado:</span><span class="meta-value"><span class="status-badge">${statusText}</span></span></div>
    <div class="meta-row"><span class="meta-label">Fecha de Emisión:</span><span class="meta-value">${safeDate(invoice.createdAt)}</span></div>
    <div class="meta-row"><span class="meta-label">Fecha de Vencimiento:</span><span class="meta-value">${safeDate(invoice.dueDate)}</span></div>
    ${invoice.paidDate ? `<div class="meta-row"><span class="meta-label">Fecha de Pago:</span><span class="meta-value" style="color:#16a34a;">${safeDate(invoice.paidDate)}</span></div>` : ''}
  </div>
  <p class="section-title">Datos del Cliente</p>
  <div class="client-box">
    <div class="client-name">${clientName}</div>
    ${client?.email    ? `<div class="client-detail">📧 ${client.email}</div>`    : ''}
    ${client?.phone    ? `<div class="client-detail">📞 ${client.phone}</div>`    : ''}
    ${client?.address  ? `<div class="client-detail">📍 ${client.address}${client.neighborhood ? ', ' + client.neighborhood : ''}</div>` : ''}
    ${client?.planName ? `<div class="client-detail">📦 Plan: ${client.planName}</div>` : ''}
    <div class="client-doc">CI / Cédula: ${docNumber}</div>
  </div>
  <p class="section-title">Detalle</p>
  <table class="items-table">
    <thead><tr><th style="width:70%">Descripción</th><th>Monto</th></tr></thead>
    <tbody>
      <tr>
        <td>${invoice.description || 'Servicio de Internet'}</td>
        <td>$${invoice.amount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-row grand"><span>Total:</span><span>$${invoice.amount.toFixed(2)}</span></div>
    ${amountPaid > 0 ? `<div class="totals-row paid-row"><span>Pagado:</span><span>$${amountPaid.toFixed(2)}</span></div>` : ''}
    ${balance > 0    ? `<div class="totals-row balance-row"><span>Saldo pendiente:</span><span>$${balance.toFixed(2)}</span></div>` : ''}
  </div>
  ${invoice.paymentMethod ? `
  <div class="payment-info">
    <b>Método de pago:</b> ${paymentMethodLabel(invoice.paymentMethod)}<br/>
    ${invoice.paymentReference ? `<b>Referencia:</b> ${invoice.paymentReference}<br/>` : ''}
    ${invoice.notes ? `<b>Notas:</b> ${invoice.notes}` : ''}
  </div>` : ''}
  <div class="footer">
    <p>Gracias por elegir Digital Plus Mix</p>
    <p>Para cualquier consulta, contáctenos</p>
    <p>Generado el ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
  </div>
</body>
</html>`;
}

// ─── Función helper para abrir ventana de impresión ──────────────────────────

export function openInvoicePrintWindow(invoice: InvoiceData, client?: ClientData | null): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Por favor, permite ventanas emergentes para imprimir.');
    return;
  }
  win.document.write(buildInvoiceHTML(invoice, client));
  win.document.close();
}

// ─── Componente React ────────────────────────────────────────────────────────

export default function InvoicePrintTemplate({ invoice, client, autoprint = false }: InvoicePrintTemplateProps) {
  useEffect(() => {
    if (autoprint) {
      openInvoicePrintWindow(invoice, client);
    }
  }, [autoprint, invoice, client]);
  return null;
}