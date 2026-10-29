import { getPrintableInvoiceHTML } from '@/app/components/InvoicePrintTemplate';
import { invoiceMonthLabel } from './whatsapp';

// Genera el PDF de la factura a partir de la MISMA plantilla que usa
// "Enviar Digital" (InvoicePrintTemplate), así el cliente recibe lo mismo
// que se descargaba antes.
export async function invoiceToPdfBlob(invoice: any, client?: any): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const html = getPrintableInvoiceHTML(invoice, client);

  // Se dibuja fuera de pantalla en un iframe para que los estilos de la
  // factura no se mezclen con los de la app.
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;left:-10000px;top:0;width:680px;height:1400px;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();

    await new Promise((r) => setTimeout(r, 60));
    if ((doc as any).fonts?.ready) await (doc as any).fonts.ready;

    const canvas = await html2canvas(doc.body, {
      scale: 2,
      backgroundColor: '#ffffff',
      windowWidth: 680,
      logging: false,
    });

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 24;

    let w = pageW - margin * 2;
    let h = (canvas.height * w) / canvas.width;
    if (h > pageH - margin * 2) {
      h = pageH - margin * 2;
      w = (canvas.width * h) / canvas.height;
    }

    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (pageW - w) / 2, margin, w, h);
    return pdf.output('blob');
  } finally {
    iframe.remove();
  }
}

export function invoicePdfFileName(invoice: any, clientName?: string): string {
  const month = invoiceMonthLabel(invoice).replace(/\s+/g, '-');
  const name = (clientName || invoice.clientName || invoice.client_name || 'cliente')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `Factura-${name}-${month || invoice.id.slice(0, 8)}.pdf`;
}

export async function invoiceToPdfFile(invoice: any, client?: any): Promise<File> {
  const blob = await invoiceToPdfBlob(invoice, client);
  return new File([blob], invoicePdfFileName(invoice, client?.name), { type: 'application/pdf' });
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ¿Este navegador puede compartir archivos (y por lo tanto adjuntar el PDF en WhatsApp)?
export function canShareFiles(files: File[]): boolean {
  try {
    return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files });
  } catch {
    return false;
  }
}
