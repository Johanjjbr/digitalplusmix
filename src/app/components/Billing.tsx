import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DollarSign, TrendingUp, Clock, Plus, RefreshCw, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { invoicesAPI, clientsAPI } from '@/lib/api';
import { invoicesExtendedAPI, batchOperationsAPI } from '@/lib/api-extended';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { InvoiceFormDialog } from '@/app/components/InvoiceFormDialog';

interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

interface Client {
  id: string;
  name: string;
  monthlyFee: number;
}

export function Billing() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesResponse, clientsResponse] = await Promise.all([
        invoicesAPI.getAll(),
        clientsAPI.getAll(),
      ]);
      setInvoices(invoicesResponse.invoices || []);
      setClients(clientsResponse.clients || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Error al cargar los datos de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (data: any) => {
    try {
      await invoicesAPI.create(data);
      toast.success('Factura creada exitosamente');
      setIsCreateDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error al crear la factura');
    }
  };

  const handleGenerateMonthlyInvoices = async () => {
    if (!confirm('¿Generar facturas mensuales para todos los clientes activos?\n\nEsto creará facturas con vencimiento el día 10 del próximo mes.')) {
      return;
    }

    try {
      setGeneratingMonthly(true);
      const result = await invoicesExtendedAPI.generateMonthlyInvoices();
      toast.success(`Facturas generadas: ${result.count}`);
      loadData();
    } catch (error) {
      console.error('Error generating monthly invoices:', error);
      toast.error('Error al generar las facturas mensuales');
    } finally {
      setGeneratingMonthly(false);
    }
  };

  const handleRunMaintenance = async () => {
    try {
      const result = await batchOperationsAPI.runMaintenance();
      toast.success(
        `Mantenimiento completado:\n- ${result.overdueInvoices} facturas marcadas como vencidas\n- ${result.delinquentClients} clientes marcados como morosos`
      );
      loadData();
    } catch (error) {
      console.error('Error running maintenance:', error);
      toast.error('Error al ejecutar el mantenimiento');
    }
  };

  const handleInvoiceClick = (invoiceId: string) => {
    navigate(`/billing/${invoiceId}`);
  };

  const calculateStats = () => {
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const pendingAmount = invoices
      .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthRevenue = invoices
      .filter((inv) => {
        const invDate = new Date(inv.date);
        return (
          inv.status === 'paid' &&
          invDate.getMonth() === thisMonth &&
          invDate.getFullYear() === thisYear
        );
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const lastMonthRevenue = invoices
      .filter((inv) => {
        const invDate = new Date(inv.date);
        return (
          inv.status === 'paid' &&
          invDate.getMonth() === lastMonth &&
          invDate.getFullYear() === lastMonthYear
        );
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const growth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    return {
      totalRevenue,
      pendingAmount,
      growth,
    };
  };

  const stats = calculateStats();

  const getBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Pagado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Vencido</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Facturación</h1>
          <p className="text-gray-600">Gestión de pagos y facturación</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRunMaintenance}
            variant="outline"
            title="Actualizar facturas vencidas y clientes morosos"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Mantenimiento
          </Button>
          <Button
            onClick={handleGenerateMonthlyInvoices}
            disabled={generatingMonthly}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {generatingMonthly ? 'Generando...' : 'Facturas Mensuales'}
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Factura
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos Totales
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Facturas Pendientes
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">${stats.pendingAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Crecimiento</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats.growth > 0 ? '+' : ''}
              {stats.growth.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Facturas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Factura</TableHead>
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">Descripción</TableHead>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold text-right">Monto</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No hay facturas registradas
                  </TableCell>
                </TableRow>
              ) : (
                invoices
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20)
                  .map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50" onClick={() => handleInvoiceClick(invoice.id)}>
                      <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                      <TableCell className="font-medium">{invoice.clientName}</TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell>
                        {new Date(invoice.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${invoice.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{getBadge(invoice.status)}</TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InvoiceFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateInvoice}
        clients={clients}
      />
    </div>
  );
}