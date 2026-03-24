import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Mail, Phone, MapPin, Edit, RefreshCw, AlertCircle, FileText, Printer, Plus, History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { clientsAPI, invoicesAPI, plansAPI } from '@/lib/api';
import { invoicesExtendedAPI } from '@/lib/api-extended';
import { ticketsAPI } from '@/lib/api-tickets-zones';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
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
import { ClientFormDialog, type ClientFormData } from '@/app/components/ClientFormDialog';
import { ChangePlanDialog } from '@/app/components/ChangePlanDialog';
import { TicketFormDialog } from '@/app/components/TicketFormDialog';
import { InvoiceFormDialog } from '@/app/components/InvoiceFormDialog';

interface Client {
  id: string;
  name: string;
  ipAddress: string;
  poleNumber: string;
  neighborhood: string;
  planName: string;
  status: 'active' | 'suspended' | 'delinquent';
  email: string;
  phone: string;
  address: string;
  connectionStatus: 'online' | 'offline';
  monthlyFee: number;
  joinDate: string;
  documentNumber?: string;
  zoneId?: string;
  zoneName?: string;
  creditBalance?: number;
}

interface Invoice {
  id: string;
  createdAt: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  clientId: string;
}

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<Array<{ name: string; price: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteInvoiceDialogOpen, setIsDeleteInvoiceDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientResponse, invoicesResponse, plansResponse] = await Promise.all([
        clientsAPI.getOne(id!),
        invoicesAPI.getByClient(id!),
        plansAPI.getAll(),
      ]);
      setClient(clientResponse.client);
      setInvoices(invoicesResponse.invoices || []);
      setPlans(plansResponse.plans || []);
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (data: ClientFormData) => {
    try {
      await clientsAPI.update(id!, data);
      toast.success('Cliente actualizado exitosamente');
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Error al actualizar el cliente');
    }
  };

  const handleChangePlan = async (planName: string, monthlyFee: number) => {
    try {
      await clientsAPI.update(id!, { planName, monthlyFee });
      toast.success('Plan cambiado exitosamente');
      setIsChangePlanDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Error al cambiar el plan');
    }
  };

  const handleSuspendService = async () => {
    try {
      await clientsAPI.update(id!, { status: 'suspended', connectionStatus: 'offline' });
      toast.success('Servicio suspendido');
      loadData();
    } catch (error) {
      console.error('Error suspending service:', error);
      toast.error('Error al suspender el servicio');
    }
  };

  const handleGenerateInvoice = async (data: any) => {
    try {
      console.log('Datos de factura recibidos desde el formulario:', data);
      
      // Si se proporciona descripción y monto personalizados, crear factura personalizada
      // De lo contrario, generar factura del plan con sistema de saldo a favor
      if (data.description && data.amount) {
        // Factura personalizada - usar API básica de create
        await invoicesAPI.create(data);
        toast.success('Factura personalizada creada exitosamente');
      } else {
        // Factura del plan - usar API extendida con saldo a favor
        const result = await invoicesExtendedAPI.generateForClient(id!);
        
        // Mostrar mensaje apropiado según si se aplicó saldo a favor
        if (result.creditBalanceUsed && result.creditBalanceUsed > 0) {
          const message = `Factura creada exitosamente`;
          const details: string[] = [];
          
          details.push(`Saldo a favor aplicado: $${result.creditBalanceUsed.toFixed(2)}`);
          
          if (result.invoice.balance === 0) {
            details.push(`La factura está totalmente pagada con el saldo a favor`);
          } else {
            details.push(`Balance pendiente: $${result.invoice.balance.toFixed(2)}`);
          }
          
          if (result.newCreditBalance > 0) {
            details.push(`Saldo a favor restante: $${result.newCreditBalance.toFixed(2)}`);
          }
          
          toast.success(
            <div>
              <p className="font-semibold">{message}</p>
              <ul className="mt-2 text-sm space-y-1">
                {details.map((detail, index) => (
                  <li key={index}>• {detail}</li>
                ))}
              </ul>
            </div>,
            { duration: 6000 }
          );
        } else {
          toast.success('Factura creada exitosamente');
        }
      }
      
      setIsInvoiceDialogOpen(false);
      loadData(); // Reload to show the new invoice and updated credit balance
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      
      // Mostrar mensaje detallado si es error de base de datos
      if (error instanceof Error && error.message.includes('credit_balance')) {
        toast.error(
          'Error: Falta actualización en la base de datos',
          {
            description: 'Ejecuta el script ADD_CREDIT_BALANCE.sql en Supabase. Ver archivo EJECUTAR_AHORA.txt',
            duration: 10000,
          }
        );
      } else {
        toast.error(error.message || 'Error al crear la factura');
      }
    }
  };

  const handleCreateTicket = async (data: any) => {
    try {
      await ticketsAPI.create(data);
      toast.success('Ticket creado exitosamente');
      setIsTicketDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Error al crear el ticket');
    }
  };

  const handlePrintInvoice = (invoiceId: string) => {
    // Navegar a la página de detalle de factura
    navigate(`/billing/${invoiceId}`);
  };

  const handlePrintMonthlyStatement = () => {
    // Crear un documento HTML para imprimir
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const monthlyInvoices = invoices.slice(0, 12); // Últimas 12 facturas
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Estado de Cuenta - ${client?.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .header h1 { 
              color: #3b82f6; 
              margin: 0;
            }
            .client-info {
              background: #f9fafb;
              padding: 20px;
              margin-bottom: 30px;
              border-radius: 8px;
            }
            .client-info h2 {
              margin-top: 0;
              color: #1f2937;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px;
            }
            th { 
              background: #3b82f6; 
              color: white; 
              padding: 12px;
              text-align: left;
            }
            td { 
              padding: 10px; 
              border-bottom: 1px solid #e5e7eb;
            }
            tr:hover { 
              background: #f9fafb; 
            }
            .status {
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            }
            .status-paid { 
              background: #dcfce7; 
              color: #16a34a; 
            }
            .status-pending { 
              background: #fef3c7; 
              color: #d97706; 
            }
            .status-overdue { 
              background: #fee2e2; 
              color: #dc2626; 
            }
            .summary {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-top: 30px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .summary-row.total {
              font-weight: bold;
              font-size: 18px;
              border-top: 2px solid #3b82f6;
              padding-top: 10px;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Estado de Cuenta Mensual</h1>
            <p>Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div class="client-info">
            <h2>${client?.name}</h2>
            <div class="info-row">
              <span><strong>Email:</strong> ${client?.email}</span>
              <span><strong>Teléfono:</strong> ${client?.phone}</span>
            </div>
            <div class="info-row">
              <span><strong>Dirección:</strong> ${client?.address}</span>
            </div>
            <div class="info-row">
              <span><strong>Plan:</strong> ${client?.planName}</span>
              <span><strong>Mensualidad:</strong> $${(client?.monthlyFee || 0).toFixed(2)}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Factura</th>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyInvoices.map(inv => `
                <tr>
                  <td>${inv.id.slice(0, 8)}</td>
                  <td>${new Date(inv.createdAt).toLocaleDateString('es-ES')}</td>
                  <td>${inv.description}</td>
                  <td>$${inv.amount.toFixed(2)}</td>
                  <td>
                    <span class="status status-${inv.status}">
                      ${inv.status === 'paid' ? 'Pagado' : inv.status === 'pending' ? 'Pendiente' : 'Vencido'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Total Facturado:</span>
              <span>$${monthlyInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Total Pagado:</span>
              <span class="text-green-600">$${monthlyInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>Saldo Pendiente:</span>
              <span>$${monthlyInvoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Digital+ ISP - Sistema de Gestión</p>
            <p>Este documento es un estado de cuenta generado automáticamente</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleViewTechnicalHistory = () => {
    // Navegar a la página de tickets del cliente
    navigate(`/tickets?client=${client?.name}`);
  };

  const handleDeleteClient = async () => {
    try {
      await clientsAPI.delete(id!);
      toast.success('Cliente eliminado exitosamente');
      navigate('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Error al eliminar el cliente');
    }
  };

  const handleDeleteInvoice = async () => {
    if (invoiceToDelete) {
      try {
        await invoicesAPI.delete(invoiceToDelete);
        toast.success('Factura eliminada exitosamente');
        setIsDeleteInvoiceDialogOpen(false);
        loadData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Error al eliminar la factura');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Cliente no encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/clients')}>
            Volver a Clientes
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (client.status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Al día</Badge>;
      case 'delinquent':
        return <Badge className="bg-red-500 hover:bg-red-600">Moroso</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Suspendido</Badge>;
    }
  };

  const getConnectionBadge = () => {
    return client.connectionStatus === 'online' ? (
      <Badge className="bg-blue-500 hover:bg-blue-600">En línea</Badge>
    ) : (
      <Badge variant="outline" className="border-gray-400 text-gray-600">
        Desconectado
      </Badge>
    );
  };

  const getBillingStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Pagado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500 hover:bg-red-600">Vencido</Badge>;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/clients')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Clientes
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-1">
              Cliente desde{' '}
              {new Date(client.joinDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex gap-2">{getStatusBadge()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
            {client.documentNumber && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium">{client.documentNumber}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium">{client.address}</p>
              </div>
            </div>
            <Button
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles de Suscripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Plan Actual</p>
              <p className="font-semibold text-lg">{client.planName}</p>
              <p className="text-blue-600 font-medium">${(client.monthlyFee || 0).toFixed(2)}/mes</p>
            </div>
            {client.creditBalance && client.creditBalance > 0 && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Saldo a Favor</p>
                <p className="text-2xl font-bold text-green-700">${client.creditBalance.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">
                  Se aplicará automáticamente a futuras facturas
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Estado de Conexión</p>
              <div className="mt-1">{getConnectionBadge()}</div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dirección IP</p>
              <p className="font-mono">{client.ipAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Número de Poste</p>
              <p className="font-medium">{client.poleNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Barrio</p>
              <p className="font-medium">{client.neighborhood}</p>
            </div>
            {client.zoneName && (
              <div>
                <p className="text-sm text-gray-600">Zona</p>
                <Badge variant="outline" className="mt-1">{client.zoneName}</Badge>
              </div>
            )}
            <div className="pt-2 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsChangePlanDialogOpen(true)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Cambiar Plan
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleSuspendService}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Suspender Servicio
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setIsInvoiceDialogOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Crear Factura
            </Button>
            <Button variant="outline" className="w-full">
              Enviar Email
            </Button>
            <Button variant="outline" className="w-full">
              Llamar Cliente
            </Button>
            <Button variant="outline" className="w-full" onClick={handleViewTechnicalHistory}>
              <History className="w-4 h-4 mr-2" />
              Ver Historial Técnico
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsTicketDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Ticket
            </Button>
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Cliente
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de Facturación</CardTitle>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handlePrintMonthlyStatement}>
              <FileText className="w-4 h-4 mr-2" />
              Imprimir Factura Mensual
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Factura</TableHead>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Descripción</TableHead>
                <TableHead className="font-semibold text-right">Monto</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No hay historial de facturación
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.id}</TableCell>
                    <TableCell>
                      {new Date(record.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${record.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{getBillingStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handlePrintInvoice(record.id)}>
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setInvoiceToDelete(record.id);
                        setIsDeleteInvoiceDialogOpen(true);
                      }}>
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

      <ClientFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateClient}
        initialData={client}
        title="Editar Cliente"
        plans={plans}
      />

      <ChangePlanDialog
        open={isChangePlanDialogOpen}
        onOpenChange={setIsChangePlanDialogOpen}
        onSubmit={handleChangePlan}
        currentPlan={client.planName}
        plans={plans}
      />

      <TicketFormDialog
        open={isTicketDialogOpen}
        onOpenChange={setIsTicketDialogOpen}
        onSubmit={handleCreateTicket}
        clientId={client.id}
        clientName={client.name}
      />

      <InvoiceFormDialog
        open={isInvoiceDialogOpen}
        onOpenChange={setIsInvoiceDialogOpen}
        onSubmit={handleGenerateInvoice}
        clientId={client.id}
        clientName={client.name}
        monthlyFee={client.monthlyFee}
        planName={client.planName}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar a este cliente? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteClient}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteInvoiceDialogOpen}
        onOpenChange={setIsDeleteInvoiceDialogOpen}
      >
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