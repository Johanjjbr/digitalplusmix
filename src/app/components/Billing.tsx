import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DollarSign, TrendingUp, Clock, Plus, RefreshCw, Calendar, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { InvoiceFormDialog } from '@/app/components/InvoiceFormDialog';
import { MonthlyInvoiceDialog } from '@/app/components/MonthlyInvoiceDialog';

interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  createdAt: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

interface Client {
  id: string;
  name: string;
  monthlyFee: number;
  planName?: string;
  status?: 'active' | 'suspended' | 'delinquent';
}

export function Billing() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMonthlyDialogOpen, setIsMonthlyDialogOpen] = useState(false);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

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
      console.log('Facturas cargadas:', invoicesResponse.invoices);
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
      console.log('Datos de factura a crear:', data);
      await invoicesAPI.create(data);
      toast.success('Factura creada exitosamente');
      setIsCreateDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error al crear la factura');
    }
  };

  const handleGenerateMonthlyInvoices = async (data: { clientIds: string[]; dueDate: string }) => {
    try {
      setGeneratingMonthly(true);
      
      // Generar facturas para los clientes seleccionados
      const promises = data.clientIds.map(async (clientId) => {
        const client = clients.find(c => c.id === clientId);
        if (!client) return null;
        
        // Validar que el cliente tenga un monthlyFee definido
        if (!client.monthlyFee || client.monthlyFee <= 0) {
          console.warn(`Cliente ${client.name} no tiene un monthlyFee válido, saltando...`);
          return null;
        }
        
        return invoicesAPI.create({
          clientId,
          clientName: client.name,
          amount: client.monthlyFee,
          description: `Servicio Mensual ${client.planName ? `- Plan ${client.planName}` : ''} - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
          status: 'pending',
          dueDate: data.dueDate,
        });
      });
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r !== null).length;
      
      toast.success(`${successCount} factura(s) generada(s) exitosamente`);
      setIsMonthlyDialogOpen(false);
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

  const handleDeleteInvoice = async () => {
    if (invoiceToDelete) {
      try {
        await invoicesAPI.delete(invoiceToDelete);
        toast.success('Factura eliminada exitosamente');
        setIsDeleteDialogOpen(false);
        setInvoiceToDelete(null);
        loadData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Error al eliminar la factura');
      }
    }
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
        const invDate = new Date(inv.createdAt);
        return (
          inv.status === 'paid' &&
          invDate.getMonth() === thisMonth &&
          invDate.getFullYear() === thisYear
        );
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    const lastMonthRevenue = invoices
      .filter((inv) => {
        const invDate = new Date(inv.createdAt);
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
            onClick={() => setIsMonthlyDialogOpen(true)}
            disabled={generatingMonthly}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Facturas Mensuales
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
                <TableHead className="font-semibold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No hay facturas registradas
                  </TableCell>
                </TableRow>
              ) : (
                invoices
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 20)
                  .map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50 cursor-pointer">
                      <TableCell className="font-mono text-sm" onClick={() => handleInvoiceClick(invoice.id)}>{invoice.id}</TableCell>
                      <TableCell className="font-medium" onClick={() => handleInvoiceClick(invoice.id)}>{invoice.clientName}</TableCell>
                      <TableCell onClick={() => handleInvoiceClick(invoice.id)}>{invoice.description}</TableCell>
                      <TableCell onClick={() => handleInvoiceClick(invoice.id)}>
                        {new Date(invoice.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right font-medium" onClick={() => handleInvoiceClick(invoice.id)}>
                        ${invoice.amount.toFixed(2)}
                      </TableCell>
                      <TableCell onClick={() => handleInvoiceClick(invoice.id)}>{getBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInvoiceToDelete(invoice.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
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

      <MonthlyInvoiceDialog
        open={isMonthlyDialogOpen}
        onOpenChange={setIsMonthlyDialogOpen}
        onSubmit={handleGenerateMonthlyInvoices}
        clients={clients.map(c => ({
          id: c.id,
          name: c.name,
          planName: c.planName || 'Sin plan',
          monthlyFee: c.monthlyFee || 0,
          status: c.status || 'active',
        }))}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Factura</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteInvoice}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}