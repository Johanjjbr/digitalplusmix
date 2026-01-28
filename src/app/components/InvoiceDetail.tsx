import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Printer, ArrowLeft, DollarSign, Calendar, FileText, CheckCircle, History } from 'lucide-react';
import { invoicesAPI } from '@/lib/api';
import { invoicesExtendedAPI } from '@/lib/api-extended';
import { paymentsAPI } from '@/lib/api-tickets-zones';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await invoicesAPI.getAll();
      const foundInvoice = response.invoices.find((inv: any) => inv.id === id);
      setInvoice(foundInvoice);

      // Load payments history
      if (foundInvoice) {
        const paymentsResponse = await paymentsAPI.getByInvoice(id);
        setPayments(paymentsResponse.payments || []);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Error al cargar la factura');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!invoice) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor, permite ventanas emergentes para imprimir');
      return;
    }

    const html = invoicesExtendedAPI.getPrintableInvoice(invoice);
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleRegisterPayment = async () => {
    if (!id) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }

    const balance = invoice.balance || (invoice.amount - (invoice.amountPaid || 0));
    if (amount > balance) {
      toast.error(`El monto no puede ser mayor al balance pendiente ($${balance.toFixed(2)})`);
      return;
    }

    try {
      await paymentsAPI.create({
        invoiceId: id,
        clientId: invoice.clientId,
        amount: amount,
        paymentMethod,
        paymentReference,
        notes,
      });

      toast.success('Pago registrado exitosamente');
      setIsPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentReference('');
      setNotes('');
      loadInvoice();
    } catch (error) {
      console.error('Error registering payment:', error);
      toast.error('Error al registrar el pago');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Pagado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Vencido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando factura...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Factura no encontrada</p>
          <Button onClick={() => navigate('/billing')}>Volver a Facturación</Button>
        </div>
      </div>
    );
  }

  const balance = invoice.balance !== undefined 
    ? invoice.balance 
    : invoice.amount - (invoice.amountPaid || 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/billing')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Factura #{invoice.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-gray-600">Detalle de factura</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          {/* Permitir registrar pagos para facturas pendientes, vencidas o parcialmente pagadas */}
          {(invoice.status === 'pending' || invoice.status === 'overdue' || (invoice.status === 'paid' && balance > 0)) && balance > 0 && (
            <Button
              onClick={() => {
                setPaymentAmount(balance.toFixed(2));
                setIsPaymentDialogOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Registrar Pago
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Cliente</label>
              <p className="text-lg font-semibold">{invoice.clientName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Estado</label>
              <div className="mt-1">{getStatusBadge(invoice.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Monto Total</label>
              <p className="text-2xl font-bold text-blue-600">${Number(invoice.amount).toFixed(2)}</p>
            </div>
            {invoice.amountPaid > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Monto Pagado</label>
                <p className="text-xl font-semibold text-green-600">${Number(invoice.amountPaid).toFixed(2)}</p>
              </div>
            )}
            {balance > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Balance Pendiente</label>
                <p className="text-xl font-semibold text-red-600">${Number(balance).toFixed(2)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha de Emisión</label>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(invoice.createdAt).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Fecha de Vencimiento</label>
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
              </p>
            </div>
            {invoice.paidDate && (
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Pago</label>
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {new Date(invoice.paidDate).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-400 mt-1" />
              {invoice.description || 'Sin descripción'}
            </p>
          </CardContent>
        </Card>

        {invoice.paymentMethod && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Información de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Método de Pago</label>
                <p className="capitalize">{invoice.paymentMethod}</p>
              </div>
              {invoice.paymentReference && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Referencia</label>
                  <p>{invoice.paymentReference}</p>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notas</label>
                  <p>{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">Historial de Pagos</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeader className="w-[100px]">Fecha</TableHeader>
                <TableHeader className="w-[100px]">Monto</TableHeader>
                <TableHeader className="w-[100px]">Método</TableHeader>
                <TableHeader className="w-[100px]">Referencia</TableHeader>
                <TableHeader className="w-[100px]">Notas</TableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-center">
                    {new Date(payment.createdAt).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="text-center">
                    ${Number(payment.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center capitalize">
                    {payment.paymentMethod}
                  </TableCell>
                  <TableCell className="text-center">
                    {payment.paymentReference || 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    {payment.notes || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Monto a Pagar</label>
              <Input
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Ej: 100.00"
                type="number"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Método de Pago</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Referencia de Pago (Opcional)</label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Ej: #12345, TRX-67890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notas (Opcional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre el pago"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Monto a pagar:</strong> ${Number(invoice.amount).toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPayment} className="bg-green-600 hover:bg-green-700">
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}