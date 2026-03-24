import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Calendar, 
  DollarSign, 
  Printer, 
  Download,
  TrendingUp,
  Users,
  FileText,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';
import { paymentsAPI } from '@/lib/api-tickets-zones';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

interface Payment {
  id: string;
  clientId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
  clients?: {
    name: string;
    email?: string;
    phone?: string;
  } | null;
  invoices?: {
    description: string;
    amount: number;
  } | null;
}

export function DailyReport() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadPayments();
  }, [selectedDate]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getByDate(selectedDate);
      setPayments(response.payments || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      card: 'Tarjeta',
      punto: 'Punto de Venta',
      other: 'Otro',
    };
    return labels[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'transfer':
        return <TrendingUp className="w-4 h-4" />;
      case 'punto':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return 'bg-green-500 hover:bg-green-600';
      case 'card':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'transfer':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'punto':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Calcular totales
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalTransactions = payments.length;

  // Agrupar por método de pago
  const paymentsByMethod = payments.reduce((acc, payment) => {
    const method = payment.paymentMethod || 'other';
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 };
    }
    acc[method].count++;
    acc[method].total += payment.amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor, permite ventanas emergentes para imprimir');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Cierre Diario - ${new Date(selectedDate).toLocaleDateString('es-ES')}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            font-size: 14px;
          }
          .section {
            margin: 20px 0;
          }
          .section-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .summary {
            background: #f9f9f9;
            padding: 15px;
            border: 2px solid #000;
            margin-top: 20px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .summary-total {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #000;
            margin-top: 10px;
            padding-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #000;
            font-size: 12px;
          }
          @media print {
            body {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DIGITAL+ ISP</h1>
          <p>Reporte de Cierre Diario de Ventas</p>
          <p>${new Date(selectedDate).toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        <div class="section">
          <div class="section-title">RESUMEN GENERAL</div>
          <table>
            <tr>
              <td><strong>Total de Transacciones:</strong></td>
              <td>${totalTransactions}</td>
            </tr>
            <tr>
              <td><strong>Total Recaudado:</strong></td>
              <td>$${totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">DESGLOSE POR MÉTODO DE PAGO</div>
          <table>
            <thead>
              <tr>
                <th>Método de Pago</th>
                <th>Cantidad</th>
                <th>Monto Total</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(paymentsByMethod).map(([method, data]) => `
                <tr>
                  <td>${getPaymentMethodLabel(method)}</td>
                  <td>${data.count}</td>
                  <td>$${data.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">DETALLE DE TRANSACCIONES</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Descripción</th>
                <th>Método</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map((payment, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${payment.clients?.name || 'N/A'}</td>
                  <td>${payment.invoices?.description || 'Pago registrado'}</td>
                  <td>${getPaymentMethodLabel(payment.paymentMethod)}</td>
                  <td>$${payment.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div class="summary-total">
            <div style="display: flex; justify-content: space-between;">
              <span>TOTAL DEL DÍA:</span>
              <span>$${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Reporte generado el ${new Date().toLocaleString('es-ES')}</p>
          <p>Digital+ ISP - Sistema de Gestión</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExportCSV = () => {
    const headers = ['#', 'Cliente', 'Email', 'Teléfono', 'Descripción', 'Método de Pago', 'Referencia', 'Monto', 'Fecha'];
    const rows = payments.map((payment, index) => [
      index + 1,
      payment.clients?.name || 'N/A',
      payment.clients?.email || 'N/A',
      payment.clients?.phone || 'N/A',
      payment.invoices?.description || 'Pago registrado',
      getPaymentMethodLabel(payment.paymentMethod),
      payment.paymentReference || 'N/A',
      payment.amount.toFixed(2),
      new Date(payment.paymentDate).toLocaleDateString('es-ES'),
    ]);

    // Agregar fila de totales
    rows.push([]);
    rows.push(['', '', '', '', '', '', 'TOTAL:', totalAmount.toFixed(2), '']);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-diario-${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reporte exportado exitosamente');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando reporte...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporte de Cierre Diario</h1>
          <p className="text-gray-600 mt-1">Registro detallado de ventas y pagos del día</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-5 h-5 text-gray-500" />
              <label className="text-sm font-medium">Fecha del Reporte:</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Button onClick={handleLoadToday}>
              Hoy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Recaudado
            </CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(selectedDate).toLocaleDateString('es-ES', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Transacciones
            </CardTitle>
            <FileText className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totalTransactions}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pagos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes Atendidos
            </CardTitle>
            <Users className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {new Set(payments.map(p => p.clientId)).size}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Clientes únicos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(paymentsByMethod).map(([method, data]) => (
              <div key={method} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getPaymentMethodIcon(method)}
                  <span className="font-medium">{getPaymentMethodLabel(method)}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${data.total.toFixed(2)}
                </div>
                <p className="text-sm text-gray-500">{data.count} transacciones</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay transacciones registradas para esta fecha</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment, index) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.clients?.name || 'N/A'}</div>
                          {payment.clients?.phone && (
                            <div className="text-sm text-gray-500">{payment.clients.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm">{payment.invoices?.description || 'Pago registrado'}</div>
                          {payment.notes && (
                            <div className="text-xs text-gray-500 mt-1">{payment.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(payment.paymentMethod)}>
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {payment.paymentReference || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          ${payment.amount.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell colSpan={5} className="text-right">
                      TOTAL:
                    </TableCell>
                    <TableCell className="text-right text-green-600 text-lg">
                      ${totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}