import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, Loader2, MessageCircle, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { paymentSettingsAPI, type PaymentSettings } from '@/lib/api-extended';
import {
  buildReminderMessage,
  invoiceMonthLabel,
  normalizePhone,
  pendingAmount,
  sortByPeriod,
  whatsappLink,
} from '@/lib/whatsapp';
import { canShareFiles, downloadFile, invoiceToPdfFile } from '@/lib/invoice-pdf';

interface SendWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  phone?: string | null;
  client?: any; // datos del cliente para la factura (documento, etc.)
  invoices: any[];
  onSent?: () => void;
}

const EMPTY_SETTINGS: PaymentSettings = {
  pmBank: '',
  pmPhone: '',
  pmIdNumber: '',
  pmHolder: '',
  whatsappCountryCode: '58',
  whatsappTemplate: '',
};

function paidMessage(clientName: string, invoices: any[]): string {
  const months = sortByPeriod(invoices).map(invoiceMonthLabel).join(', ');
  return `Hola ${clientName}, le saludamos de Digital+ ISP.\n\nLe enviamos su factura de ${months}. ¡Gracias por su pago!`;
}

export function SendWhatsAppDialog({
  open,
  onOpenChange,
  clientName,
  phone,
  client,
  invoices,
  onSent,
}: SendWhatsAppDialogProps) {
  const [settings, setSettings] = useState<PaymentSettings>(EMPTY_SETTINGS);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waPhone = normalizePhone(phone, settings.whatsappCountryCode);
  const ordered = sortByPeriod(invoices);
  const allPaid = ordered.length > 0 && ordered.every((i) => i.status === 'paid' || pendingAmount(i) === 0);
  const shareSupported = files.length > 0 && canShareFiles(files);

  // Al abrir: cargar datos de pago, armar mensaje y generar los PDF
  useEffect(() => {
    if (!open) {
      setFiles([]);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setPreparing(true);
      setError(null);
      try {
        const s = await paymentSettingsAPI.get().catch(() => EMPTY_SETTINGS);
        if (cancelled) return;
        setSettings(s);
        setMessage(allPaid ? paidMessage(clientName, ordered) : buildReminderMessage(clientName, ordered, s));

        const pdfs: File[] = [];
        for (const inv of ordered) {
          pdfs.push(await invoiceToPdfFile(inv, { ...client, name: client?.name || clientName }));
        }
        if (!cancelled) setFiles(pdfs);
      } catch (e) {
        console.error('Error generando PDF:', e);
        if (!cancelled) setError('No se pudo generar el PDF de la factura');
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      /* no pasa nada si no se puede copiar */
    }
  };

  // Opción 1: menú "Compartir" del sistema -> WhatsApp, con el PDF adjunto
  const handleShare = async () => {
    await copyMessage();
    try {
      await navigator.share({ files, text: message, title: `Factura ${clientName}` });
      toast.success('Factura compartida');
      onSent?.();
      onOpenChange(false);
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // el usuario cerró el menú
      console.error(e);
      toast.error('No se pudo compartir. Usa "Abrir chat y descargar PDF".');
    }
  };

  // Opción 2: descarga el PDF y abre el chat del cliente con el mensaje
  const handleOpenChat = async () => {
    if (!waPhone) {
      toast.error(`${clientName} no tiene un teléfono válido. Edítalo en la ficha del cliente.`);
      return;
    }
    files.forEach(downloadFile);
    await copyMessage();
    window.open(whatsappLink(waPhone, message), '_blank', 'noopener');
    toast.info('PDF descargado. En el chat toca el clip 📎 y adjunta el archivo descargado.', {
      duration: 8000,
    });
    onSent?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Enviar factura por WhatsApp
          </DialogTitle>
          <DialogDescription>
            {clientName}
            {phone ? ` · ${phone}` : ' · sin teléfono cargado'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-gray-50 p-3 text-sm">
            {preparing ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando PDF de {ordered.length} factura(s)...
              </div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <ul className="space-y-1">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </span>
                    <button
                      type="button"
                      className="text-blue-600 hover:underline text-xs shrink-0"
                      onClick={() => downloadFile(f)}
                    >
                      Descargar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <Label htmlFor="wa-message">Mensaje</Label>
            <Textarea
              id="wa-message"
              rows={9}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          {!preparing && !error && !shareSupported && (
            <p className="text-xs text-gray-500">
              Este navegador no permite adjuntar archivos directo a WhatsApp. Usa "Abrir chat y descargar
              PDF" y adjunta el archivo con el clip 📎.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {shareSupported && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={preparing || !!error}
              onClick={handleShare}
              title="Abre el menú Compartir: elige WhatsApp y el contacto. El PDF va adjunto."
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir PDF por WhatsApp
            </Button>
          )}
          <Button
            variant={shareSupported ? 'outline' : 'default'}
            className={shareSupported ? '' : 'bg-green-600 hover:bg-green-700'}
            disabled={preparing || !!error || !waPhone}
            onClick={handleOpenChat}
            title={waPhone ? 'Abre el chat de este cliente con el mensaje y descarga el PDF' : 'El cliente no tiene teléfono válido'}
          >
            <Download className="w-4 h-4 mr-2" />
            Abrir chat y descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
