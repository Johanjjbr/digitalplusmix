import { toast } from 'sonner';
import type { PaymentSettings } from './api-extended';
import { paymentSettingsAPI } from './api-extended';
import {
  buildReminderMessage,
  invoiceMonthLabel,
  normalizePhone,
  pendingAmount,
  sortByPeriod,
  whatsappLink,
} from './whatsapp';
import { downloadFile, invoiceToPdfFile } from './invoice-pdf';

async function getSettings(): Promise<PaymentSettings> {
  return paymentSettingsAPI.get().catch(() => ({
    pmBank: '',
    pmPhone: '',
    pmIdNumber: '',
    pmHolder: '',
    whatsappCountryCode: '58',
    whatsappTemplate: '',
  }));
}

/**
 * Un clic: genera el PDF de la(s) factura(s), lo descarga y abre el chat de
 * WhatsApp del cliente con el mensaje escrito. El personal solo adjunta el
 * PDF (clip 📎) y envía.
 *
 * IMPORTANTE: llamar directo desde el onClick (antes de cualquier await en el
 * handler) para que el navegador no bloquee la ventana de WhatsApp.
 */
export async function sendInvoicesToWhatsApp(params: {
  invoices: any[];
  clientName: string;
  phone?: string | null;
  client?: any;
}): Promise<boolean> {
  const { invoices, clientName, phone, client } = params;

  // Se abre la pestaña YA (dentro del clic) y luego se le pone la dirección.
  const win = window.open('', '_blank');

  try {
    const settings = await getSettings();
    const waPhone = normalizePhone(phone, settings.whatsappCountryCode);

    if (!waPhone) {
      win?.close();
      toast.error(`${clientName} no tiene un teléfono válido. Cárgalo en la ficha del cliente.`);
      return false;
    }

    const ordered = sortByPeriod(invoices);
    const allPaid = ordered.every((i) => i.status === 'paid' || pendingAmount(i) === 0);
    const message = allPaid
      ? `Hola ${clientName}, le saludamos de Digital+ ISP.\n\nLe enviamos su factura de ${ordered
          .map(invoiceMonthLabel)
          .join(', ')}. ¡Gracias por su pago!`
      : buildReminderMessage(clientName, ordered, settings);

    for (const inv of ordered) {
      const file = await invoiceToPdfFile(inv, { ...client, name: client?.name || clientName });
      downloadFile(file);
    }

    const link = whatsappLink(waPhone, message);
    if (win && !win.closed) {
      win.location.href = link;
    } else {
      window.open(link, '_blank');
    }

    toast.success('PDF descargado y chat abierto', {
      description: 'En WhatsApp toca el clip 📎, adjunta el PDF descargado y envía.',
      duration: 8000,
    });
    return true;
  } catch (error) {
    console.error('Error enviando por WhatsApp:', error);
    win?.close();
    toast.error('No se pudo generar el PDF de la factura');
    return false;
  }
}
