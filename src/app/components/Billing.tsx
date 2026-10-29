import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  DollarSign,
  Clock,
  Plus,
  RefreshCw,
  Calendar,
  Trash2,
  MessageCircle,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { invoicesAPI, clientsAPI } from '@/lib/api';
import {
  invoicesExtendedAPI,
  batchOperationsAPI,
  paymentSettingsAPI,
  formatPeriod,
  type PaymentSettings,
} from '@/lib/api-extended';
import {
  buildReminderMessage,
  invoiceMonthLabel,
  pendingAmount,
  sortByPeriod,
} from '@/lib/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
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
import { sendInvoicesToWhatsApp } from '@/lib/send-whatsapp';

interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  amountPaid?: number | null;
  balance?: number | null;
  createdAt: string;
  dueDate?: string | null;
  paidDate?: string | null;
  billingPeriod?: string | null;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

interface Client {
  id: string;
  name: string;
  phone?: string;
  documentNumber?: string;
  monthlyFee: number;
  planName?: string;
  status?: 'active' | 'suspended' | 'delinquent';
}

interface Debtor {
  client: Client | undefined;
  clientId: string;
  clientName: string;
  invoices: Invoice[];
  total: number;
  overdueCount: number;
}

const periodKey = (inv: Invoice) =>
  inv.billingPeriod?.slice(0, 7) || (inv.createdAt ? inv.createdAt.slice(0, 7) : '');

export function Billing() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMonthlyDialogOpen, setIsMonthlyDialogOpen] = useState(false);
  const [generatingMonthly, setGeneratingMonthly] = useState(false);
  const [runningMaintenance, setRunningMaintenance] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [debtorFilter, setDebtorFilter] = useState<'overdue' | 'all'>('overdue');
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sendingKey, setSendingKey] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesResponse, clientsResponse, settings] = await Promise.all([
        invoicesAPI.getAll(),
        clientsAPI.getAll(),
        paymentSettingsAPI.get().catch(() => null),
      ]);
      setInvoices(invoicesResponse.invoices || []);
      setClients(clientsResponse.clients || []);
      setPaymentSettings(settings);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Error al cargar los datos de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (data: any) => {
    try {
      // Mismo camino que la ficha del cliente: aplica saldo a favor y
      // no deja crear dos facturas del mismo mes.
      await invoicesExtendedAPI.generateForClient(data.clientId, {
        description: data.description,
        amount:      data.amount,
        dueDate:     data.dueDate,
        status:      data.status,
        invoiceType: data.invoiceType,
      });
      toast.success('Factura creada exitosamente');
      setIsCreateDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error?.message || 'Error al crear la factura');
    }
  };

  const handleGenerateMonthlyInvoices = async (data: { clientIds: string[]; dueDate: string; period: string }) => {
    if (generatingMonthly) return; // evita doble clic
    try {
      setGeneratingMonthly(true);
      const result = await invoicesExtendedAPI.generateMonthlyInvoices({
        period: data.period,
        clientIds: data.clientIds,
        dueDate: data.dueDate,
      });

      const monthName = formatPeriod(result.period);
      if (result.created > 0) {
        toast.success(
          `${result.created} factura(s) de ${monthName} generada(s)` +
            (result.skipped > 0 ? ` · ${result.skipped} ya tenían ese mes y no se duplicaron` : '')
        );
      } else {
        toast.info(`No se creó ninguna factura: esos clientes ya tienen ${monthName}`);
      }
      setIsMonthlyDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error generating monthly invoices:', error);
      toast.error(error?.message || 'Error al generar las facturas mensuales');
    } finally {
      setGeneratingMonthly(false);
    }
  };

  const handleRunMaintenance = async () => {
    if (runningMaintenance) return;
    try {
      setRunningMaintenance(true);
      const r = await batchOperationsAPI.runMaintenance();
      toast.success(
        <div>
          <p className="font-semibold">Mantenimiento completado</p>
          <ul className="mt-1 text-sm space-y-0.5">
            <li>• {r.invoicesCreated} factura(s) nueva(s) del mes</li>
            <li>• {r.overdueInvoices} factura(s) marcada(s) como vencida(s)</li>
            <li>• {r.delinquentClients} cliente(s) pasaron a moroso</li>
            <li>• {r.reactivatedClients} cliente(s) volvieron a estar al día</li>
          </ul>
        </div>,
        { duration: 7000 }
      );
      loadData();
    } catch (error: any) {
      console.error('Error running maintenance:', error);
      toast.error(
        error?.message?.includes('run_billing_maintenance')
          ? 'Falta ejecutar FIX_FACTURACION_Y_WHATSAPP.sql en Supabase'
          : 'Error al ejecutar el mantenimiento'
      );
    } finally {
      setRunningMaintenance(false);
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

  // ---------- Estadísticas ----------
  const stats = useMemo(() => {
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);

    const pendingTotal = invoices
      .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + pendingAmount(inv), 0);

    const withDebt = new Set(
      invoices.filter((i) => i.status === 'overdue' && pendingAmount(i) > 0).map((i) => i.clientId)
    );
    const billable = clients.filter((c) => c.status !== 'suspended');
    const upToDate = billable.filter((c) => !withDebt.has(c.id)).length;

    return { totalRevenue, pendingTotal, upToDate, delinquent: withDebt.size };
  }, [invoices, clients]);

  // ---------- Lista de facturas ordenada por mes ----------
  const months = useMemo(
    () => Array.from(new Set(invoices.map(periodKey).filter(Boolean))).sort().reverse(),
    [invoices]
  );

  const visibleInvoices = useMemo(() => {
    return invoices
      .filter((inv) => monthFilter === 'all' || periodKey(inv) === monthFilter)
      .filter((inv) => statusFilter === 'all' || inv.status === statusFilter)
      .sort((a, b) => {
        const byMonth = periodKey(b).localeCompare(periodKey(a)); // mes más reciente primero
        if (byMonth !== 0) return byMonth;
        return (a.clientName || '').localeCompare(b.clientName || '');
      });
  }, [invoices, monthFilter, statusFilter]);

  // ---------- Clientes por cobrar ----------
  const debtors = useMemo<Debtor[]>(() => {
    const byClient = new Map<string, Invoice[]>();
    invoices
      .filter((i) => (i.status === 'pending' || i.status === 'overdue') && pendingAmount(i) > 0)
      .forEach((i) => {
        const list = byClient.get(i.clientId) || [];
        list.push(i);
        byClient.set(i.clientId, list);
      });

    const list: Debtor[] = [];
    byClient.forEach((invs, clientId) => {
      const client = clients.find((c) => c.id === clientId);
      const ordered = sortByPeriod(invs);
      list.push({
        client,
        clientId,
        clientName: client?.name || invs[0].clientName,
        invoices: ordered,
        total: ordered.reduce((s, i) => s + pendingAmount(i), 0),
        overdueCount: ordered.filter((i) => i.status === 'overdue').length,
      });
    });

    return list
      .filter((d) => debtorFilter === 'all' || d.overdueCount > 0)
      .sort((a, b) => b.overdueCount - a.overdueCount || a.clientName.localeCompare(b.clientName));
  }, [invoices, clients, debtorFilter]);

  const paymentDataMissing =
    !paymentSettings || !paymentSettings.pmBank || !paymentSettings.pmPhone || !paymentSettings.pmIdNumber;

  const messageFor = (d: Debtor) =>
    buildReminderMessage(
      d.clientName,
      d.invoices,
      paymentSettings || {
        pmBank: '',
        pmPhone: '',
        pmIdNumber: '',
        pmHolder: '',
        whatsappCountryCode: '58',
        whatsappTemplate: '',
      }
    );

  // Un clic: PDF de la factura + chat de WhatsApp del cliente con el mensaje
  const sendToWhatsApp = async (key: string, clientId: string, clientName: string, invs: Invoice[]) => {
    if (sendingKey) return;
    const client = clients.find((c) => c.id === clientId);
    setSendingKey(key);
    const ok = await sendInvoicesToWhatsApp({
      invoices: invs,
      clientName: client?.name || clientName,
      phone: client?.phone,
      client,
    });
    setSendingKey(null);
    if (ok) setSentTo((prev) => new Set(prev).add(key));
  };

  const handleSendWhatsApp = (d: Debtor) =>
    sendToWhatsApp(`client:${d.clientId}`, d.clientId, d.clientName, d.invoices);

  const handleSendInvoiceWhatsApp = (invoice: Invoice) =>
    sendToWhatsApp(invoice.id, invoice.clientId, invoice.clientName, [invoice]);

  const handleCopyMessage = async (d: Debtor) => {
    try {
      await navigator.clipboard.writeText(messageFor(d));
      toast.success('Mensaje copiado');
    } catch {
      toast.error('No se pudo copiar el mensaje');
    }
  };

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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Facturación</h1>
          <p className="text-gray-600">Gestión de pagos y facturación</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleRunMaintenance}
            variant="outline"
            disabled={runningMaintenance}
            title="Genera las facturas que falten del mes (sin duplicar) y actualiza vencidas, morosos y clientes al día"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${runningMaintenance ? 'animate-spin' : ''}`} />
            {runningMaintenance ? 'Procesando...' : 'Mantenimiento'}
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
            <CardTitle className="text-sm font-medium text-gray-600">Ingresos Totales</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600">Por Cobrar</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">${stats.pendingTotal.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clientes</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              <span className="text-green-600">{stats.upToDate}</span>
              <span className="text-sm font-normal text-gray-500"> al día · </span>
              <span className="text-red-600">{stats.delinquent}</span>
              <span className="text-sm font-normal text-gray-500"> morosos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList className="mb-4">
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="debtors">
            Por cobrar / WhatsApp
            {stats.delinquent > 0 && (
              <span className="ml-2 rounded-full bg-red-500 text-white text-xs px-2">{stats.delinquent}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ================= FACTURAS ================= */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>Facturas por mes</CardTitle>
              <div className="flex flex-wrap gap-2">
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  <option value="all">Todos los meses</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {formatPeriod(`${m}-01`)}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="paid">Pagadas</option>
                  <option value="pending">Pendientes</option>
                  <option value="overdue">Vencidas</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Mes</TableHead>
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">Descripción</TableHead>
                    <TableHead className="font-semibold">Emisión</TableHead>
                    <TableHead className="font-semibold">Pago</TableHead>
                    <TableHead className="font-semibold text-right">Monto</TableHead>
                    <TableHead className="font-semibold text-right">Pendiente</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No hay facturas para este filtro
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleInvoices.slice(0, 300).map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleInvoiceClick(invoice.id)}
                      >
                        <TableCell className="whitespace-nowrap font-medium">
                          {invoice.billingPeriod ? (
                            formatPeriod(invoice.billingPeriod)
                          ) : (
                            <span className="text-gray-400 text-sm">Suelta</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{invoice.clientName}</TableCell>
                        <TableCell className="text-sm text-gray-600">{invoice.description}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(invoice.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {invoice.paidDate
                            ? new Date(`${invoice.paidDate.slice(0, 10)}T00:00:00`).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(invoice.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.status === 'paid' ? '-' : `$${pendingAmount(invoice).toFixed(2)}`}
                        </TableCell>
                        <TableCell>{getBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={
                              sentTo.has(invoice.id)
                                ? 'text-gray-400 hover:text-green-700 hover:bg-green-50'
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            }
                            title={sentTo.has(invoice.id) ? 'Ya enviada · volver a enviar por WhatsApp' : 'Enviar factura en PDF por WhatsApp'}
                            disabled={sendingKey === invoice.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendInvoiceWhatsApp(invoice);
                            }}
                          >
                            {sendingKey === invoice.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : sentTo.has(invoice.id) ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <MessageCircle className="w-4 h-4" />
                            )}
                          </Button>
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
              {visibleInvoices.length > 300 && (
                <p className="text-sm text-gray-500 mt-3">
                  Mostrando 300 de {visibleInvoices.length}. Filtra por mes para ver el resto.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= POR COBRAR / WHATSAPP ================= */}
        <TabsContent value="debtors">
          {paymentDataMissing && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
              <div className="flex-1">
                Faltan los datos de Pago Móvil (banco, teléfono, cédula/RIF). Cárgalos en{' '}
                <button className="underline font-medium" onClick={() => navigate('/settings')}>
                  Configuración
                </button>{' '}
                para que salgan en el mensaje.
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>Clientes con pagos pendientes</CardTitle>
              <select
                className="border rounded-md px-3 py-2 text-sm bg-white"
                value={debtorFilter}
                onChange={(e) => setDebtorFilter(e.target.value as 'overdue' | 'all')}
              >
                <option value="overdue">Solo morosos (con meses vencidos)</option>
                <option value="all">Todos los que deben algo</option>
              </select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">Teléfono</TableHead>
                    <TableHead className="font-semibold">Meses pendientes</TableHead>
                    <TableHead className="font-semibold text-right">Total</TableHead>
                    <TableHead className="font-semibold text-right">Avisar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {debtorFilter === 'overdue'
                          ? 'No hay clientes morosos. ¡Todos al día!'
                          : 'Nadie tiene pagos pendientes'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    debtors.map((d) => {
                      return (
                        <TableRow key={d.clientId}>
                          <TableCell
                            className="font-medium cursor-pointer hover:underline"
                            onClick={() => navigate(`/clients/${d.clientId}`)}
                          >
                            {d.clientName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {d.client?.phone || <span className="text-red-500">Sin teléfono</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {d.invoices.map((inv) => (
                                <span
                                  key={inv.id}
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    inv.status === 'overdue'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                  title={`$${pendingAmount(inv).toFixed(2)}`}
                                >
                                  {invoiceMonthLabel(inv)}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">${d.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Copiar mensaje"
                              onClick={() => handleCopyMessage(d)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              disabled={sendingKey === `client:${d.clientId}`}
                              className={
                                sentTo.has(`client:${d.clientId}`)
                                  ? 'bg-gray-400 hover:bg-gray-500'
                                  : 'bg-green-600 hover:bg-green-700'
                              }
                              onClick={() => handleSendWhatsApp(d)}
                            >
                              {sendingKey === `client:${d.clientId}` ? (
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              ) : sentTo.has(`client:${d.clientId}`) ? (
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                              ) : (
                                <MessageCircle className="w-4 h-4 mr-1" />
                              )}
                              {sentTo.has(`client:${d.clientId}`) ? 'Enviado' : 'WhatsApp'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <p className="text-xs text-gray-500 mt-3">
                El botón WhatsApp descarga el PDF de cada factura pendiente y abre el chat del cliente con el
                mensaje listo (meses, monto y datos de Pago Móvil). Adjunta el PDF con el clip 📎 y envía.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
        submitting={generatingMonthly}
        invoices={invoices.map((i) => ({
          clientId: i.clientId,
          billingPeriod: i.billingPeriod,
          status: i.status,
        }))}
        clients={clients.map((c) => ({
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
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteInvoice}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
