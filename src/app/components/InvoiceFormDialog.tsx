import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Combobox } from '@/app/components/ui/combobox';

interface InvoiceFormData {
  clientId: string;
  clientName: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate?: string;
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceFormData) => void;
  // Para modo múltiples clientes (Billing)
  clients?: Array<{ id: string; name: string; monthlyFee: number; planName?: string }>;
  // Para modo cliente único (ClientDetail)
  clientId?: string;
  clientName?: string;
  monthlyFee?: number;
  planName?: string;
}

export function InvoiceFormDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  clients, 
  clientId: singleClientId,
  clientName: singleClientName,
  monthlyFee: singleMonthlyFee,
  planName: singlePlanName
}: InvoiceFormDialogProps) {
  const isSingleClientMode = Boolean(singleClientId);
  const [invoiceType, setInvoiceType] = useState<'plan' | 'advance' | 'custom'>('plan');
  const [advanceMonth, setAdvanceMonth] = useState('');
  const [advanceYear, setAdvanceYear] = useState('');
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    clientName: '',
    description: '',
    amount: 0,
    status: 'pending',
  });

  // Inicializar mes y año adelantado con el próximo mes
  useEffect(() => {
    if (open) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      setAdvanceMonth(monthNames[nextMonth.getMonth()]);
      setAdvanceYear(nextMonth.getFullYear().toString());
    }
  }, [open]);

  // Actualizar descripción cuando cambian mes/año adelantado
  useEffect(() => {
    if (invoiceType === 'advance' && advanceMonth && advanceYear && open) {
      const planInfo = isSingleClientMode 
        ? singlePlanName 
        : clients?.find(c => c.id === formData.clientId)?.planName;
      
      setFormData(prev => ({
        ...prev,
        description: `Pago Adelantado - ${planInfo ? `Plan ${planInfo}` : 'Servicio'} - ${advanceMonth} ${advanceYear}`,
      }));
    }
  }, [advanceMonth, advanceYear, invoiceType, isSingleClientMode, singlePlanName, formData.clientId, clients, open]);

  // Reset form cuando se cierra el diálogo o cuando cambia el modo
  useEffect(() => {
    if (!open) {
      setInvoiceType('plan');
      setFormData({
        clientId: '',
        clientName: '',
        description: '',
        amount: 0,
        status: 'pending',
      });
    } else if (isSingleClientMode && singleClientId) {
      // Modo cliente único - pre-llenar datos
      setFormData({
        clientId: singleClientId,
        clientName: singleClientName || '',
        amount: invoiceType === 'plan' ? (singleMonthlyFee || 0) : 0,
        description: invoiceType === 'plan' 
          ? `Servicio Mensual ${singlePlanName ? `- Plan ${singlePlanName}` : ''} - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
          : '',
        status: 'pending',
      });
    }
  }, [open, isSingleClientMode, singleClientId, singleClientName, singleMonthlyFee, singlePlanName]);

  // Actualizar datos cuando cambia el tipo de factura en modo cliente único
  useEffect(() => {
    if (isSingleClientMode && singleClientId && open) {
      setFormData(prev => ({
        ...prev,
        amount: invoiceType === 'plan' ? (singleMonthlyFee || 0) : prev.amount,
        description: invoiceType === 'plan'
          ? `Servicio Mensual ${singlePlanName ? `- Plan ${singlePlanName}` : ''} - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
          : prev.description,
      }));
    }
  }, [invoiceType, isSingleClientMode, singleClientId, singleMonthlyFee, singlePlanName, open]);

  const handleClientChange = (clientId: string) => {
    if (!clients) return;
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      if (invoiceType === 'plan') {
        // Factura del plan
        setFormData({
          ...formData,
          clientId,
          clientName: client.name,
          amount: client.monthlyFee || 0,
          description: `Servicio Mensual ${client.planName ? `- Plan ${client.planName}` : ''} - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
        });
      } else {
        // Factura personalizada - solo actualiza cliente
        setFormData({
          ...formData,
          clientId,
          clientName: client.name,
          description: '',
          amount: 0,
        });
      }
    }
  };

  const handleInvoiceTypeChange = (type: 'plan' | 'advance' | 'custom') => {
    setInvoiceType(type);
    
    if (isSingleClientMode) {
      // Modo cliente único
      if (type === 'plan') {
        setFormData(prev => ({
          ...prev,
          amount: singleMonthlyFee || 0,
          description: `Servicio Mensual ${singlePlanName ? `- Plan ${singlePlanName}` : ''} - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
          dueDate: undefined, // Limpiar fecha personalizada
        }));
      } else if (type === 'advance') {
        setFormData(prev => ({
          ...prev,
          amount: singleMonthlyFee || 0,
          description: `Servicio Mensual ${singlePlanName ? `- Plan ${singlePlanName}` : ''} - ${advanceMonth} ${advanceYear}`,
          dueDate: undefined,
        }));
      } else {
        // Para factura personalizada, no resetear amount si ya tiene un valor válido
        setFormData(prev => ({
          ...prev,
          description: '',
          // Solo resetear amount si es 0 o no es un número válido
          amount: (prev.amount > 0) ? prev.amount : 0,
          dueDate: undefined,
        }));
      }
    } else {
      // Modo múltiples clientes
      if (type === 'plan' && formData.clientId && clients) {
        const client = clients.find((c) => c.id === formData.clientId);
        if (client) {
          setFormData({
            ...formData,
            amount: client.monthlyFee || 0,
            description: `Servicio Mensual ${client.planName ? `- Plan ${client.planName}` : ''} - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
            dueDate: undefined,
          });
        }
      } else if (type === 'advance' && formData.clientId && clients) {
        const client = clients.find((c) => c.id === formData.clientId);
        if (client) {
          setFormData({
            ...formData,
            amount: client.monthlyFee || 0,
            description: `Servicio Mensual ${client.planName ? `- Plan ${client.planName}` : ''} - ${advanceMonth} ${advanceYear}`,
            dueDate: undefined,
          });
        }
      } else if (type === 'custom') {
        // Para factura personalizada, no resetear amount si ya tiene un valor válido
        setFormData({
          ...formData,
          description: '',
          // Solo resetear amount si es 0 o no es un número válido
          amount: (formData.amount > 0) ? formData.amount : 0,
          dueDate: undefined,
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setInvoiceType('plan');
    setFormData({
      clientId: '',
      clientName: '',
      description: '',
      amount: 0,
      status: 'pending',
    });
  };

  const selectedClient = isSingleClientMode 
    ? { id: singleClientId!, name: singleClientName!, monthlyFee: singleMonthlyFee || 0, planName: singlePlanName }
    : clients?.find((c) => c.id === formData.clientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Factura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {!isSingleClientMode && (
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Combobox
                  value={formData.clientId}
                  onValueChange={handleClientChange}
                  options={clients?.map((client) => ({
                    value: client.id,
                    label: client.name,
                  })) || []}
                  placeholder="Seleccionar cliente"
                  searchPlaceholder="Buscar cliente..."
                  emptyText="No se encontraron clientes"
                />
              </div>
            )}

            {isSingleClientMode && (
              <div className="rounded-lg bg-gray-50 border p-3">
                <div className="text-sm text-gray-600">Cliente</div>
                <div className="font-medium">{singleClientName}</div>
              </div>
            )}

            {formData.clientId && (
              <div className="space-y-3">
                <Label>Tipo de Factura *</Label>
                <RadioGroup value={invoiceType} onValueChange={handleInvoiceTypeChange}>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50">
                    <RadioGroupItem value="plan" id="plan" />
                    <Label htmlFor="plan" className="flex-1 cursor-pointer">
                      <div className="font-medium">Factura del Plan Asignado</div>
                      {selectedClient && (
                        <div className="text-sm text-gray-500">
                          {selectedClient.planName || 'Sin plan'} - ${selectedClient.monthlyFee?.toFixed(2) || '0.00'}
                        </div>
                      )}
                    </Label>
                  </div>
                  <div className="flex flex-col space-y-2 rounded-lg border p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advance" id="advance" />
                      <Label htmlFor="advance" className="flex-1 cursor-pointer">
                        <div className="font-medium">Pago Adelantado</div>
                        {selectedClient && (
                          <div className="text-sm text-gray-500">
                            {selectedClient.planName || 'Sin plan'} - ${selectedClient.monthlyFee?.toFixed(2) || '0.00'}
                          </div>
                        )}
                      </Label>
                    </div>
                    {invoiceType === 'advance' && (
                      <div className="ml-6 grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="advanceMonth" className="text-xs">Mes</Label>
                          <Select value={advanceMonth} onValueChange={setAdvanceMonth}>
                            <SelectTrigger id="advanceMonth" className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Enero">Enero</SelectItem>
                              <SelectItem value="Febrero">Febrero</SelectItem>
                              <SelectItem value="Marzo">Marzo</SelectItem>
                              <SelectItem value="Abril">Abril</SelectItem>
                              <SelectItem value="Mayo">Mayo</SelectItem>
                              <SelectItem value="Junio">Junio</SelectItem>
                              <SelectItem value="Julio">Julio</SelectItem>
                              <SelectItem value="Agosto">Agosto</SelectItem>
                              <SelectItem value="Septiembre">Septiembre</SelectItem>
                              <SelectItem value="Octubre">Octubre</SelectItem>
                              <SelectItem value="Noviembre">Noviembre</SelectItem>
                              <SelectItem value="Diciembre">Diciembre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="advanceYear" className="text-xs">Año</Label>
                          <Select value={advanceYear} onValueChange={setAdvanceYear}>
                            <SelectTrigger id="advanceYear" className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2026">2026</SelectItem>
                              <SelectItem value="2027">2027</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="flex-1 cursor-pointer">
                      <div className="font-medium">Factura Personalizada</div>
                      <div className="text-sm text-gray-500">
                        Especificar descripción y monto
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción *
                {(invoiceType === 'plan' || invoiceType === 'advance') && (
                  <span className="ml-2 text-xs text-gray-500">(Auto-completado)</span>
                )}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                disabled={invoiceType === 'plan' || invoiceType === 'advance'}
                className={(invoiceType === 'plan' || invoiceType === 'advance') ? 'bg-gray-50' : ''}
                placeholder={invoiceType === 'custom' ? 'Ej: Instalación de equipo, Reparación, Recarga extra, Materiales pendientes, Mes pendiente, etc.' : ''}
              />
              {invoiceType === 'custom' && (
                <p className="text-xs text-gray-500">
                  Esta descripción te ayudará a identificar el motivo del pago en el futuro.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Monto *
                {(invoiceType === 'plan' || invoiceType === 'advance') && (
                  <span className="ml-2 text-xs text-gray-500">(Del plan)</span>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                  disabled={invoiceType === 'plan' || invoiceType === 'advance'}
                  className={(invoiceType === 'plan' || invoiceType === 'advance') ? 'bg-gray-50 pl-7' : 'pl-7'}
                  placeholder={invoiceType === 'custom' ? '0.00' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {invoiceType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">Fecha de Vencimiento (Opcional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className=""
                />
                <p className="text-xs text-gray-500">
                  Si no especificas una fecha, se generará automáticamente.
                </p>
              </div>
            )}

            {invoiceType === 'plan' && selectedClient && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <div className="text-sm text-blue-800">
                  <strong>Resumen:</strong> Se creará una factura de ${selectedClient.monthlyFee?.toFixed(2) || '0.00'} por el servicio mensual del plan {selectedClient.planName || 'asignado'}.
                </div>
              </div>
            )}

            {invoiceType === 'advance' && selectedClient && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <div className="text-sm text-green-800">
                  <strong>Resumen:</strong> Se creará una factura de ${selectedClient.monthlyFee?.toFixed(2) || '0.00'} por el pago adelantado del mes de {advanceMonth} {advanceYear} del plan {selectedClient.planName || 'asignado'}.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!formData.clientId || formData.amount <= 0 || !formData.description.trim()}
            >
              Crear Factura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}