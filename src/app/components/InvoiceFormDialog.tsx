import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Combobox } from '@/app/components/ui/combobox';

// Meses con su número (0-indexed para Date)
const MONTHS = [
  { label: 'Enero',      value: '0'  },
  { label: 'Febrero',    value: '1'  },
  { label: 'Marzo',      value: '2'  },
  { label: 'Abril',      value: '3'  },
  { label: 'Mayo',       value: '4'  },
  { label: 'Junio',      value: '5'  },
  { label: 'Julio',      value: '6'  },
  { label: 'Agosto',     value: '7'  },
  { label: 'Septiembre', value: '8'  },
  { label: 'Octubre',    value: '9'  },
  { label: 'Noviembre',  value: '10' },
  { label: 'Diciembre',  value: '11' },
];

// Genera el due_date (día 10) para el mes/año seleccionado
function buildDueDate(monthIndex: number, year: number): string {
  const d = new Date(year, monthIndex, 10);
  return d.toISOString().split('T')[0];
}

interface InvoiceFormData {
  clientId: string;
  clientName: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate?: string;
  invoiceType?: 'plan' | 'advance' | 'custom';
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceFormData) => void;
  // Modo múltiples clientes (Billing)
  clients?: Array<{ id: string; name: string; monthlyFee: number; planName?: string }>;
  // Modo cliente único (ClientDetail)
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
  planName: singlePlanName,
}: InvoiceFormDialogProps) {
  const isSingleClientMode = Boolean(singleClientId);

  const [invoiceType, setInvoiceType] = useState<'plan' | 'advance' | 'custom'>('plan');

  // Estado para el mes/año del pago adelantado (usamos índice numérico del mes)
  const now = new Date();
  const [advanceMonthIndex, setAdvanceMonthIndex] = useState<number>(now.getMonth());
  const [advanceYear, setAdvanceYear]             = useState<number>(now.getFullYear());

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId:    '',
    clientName:  '',
    description: '',
    amount:      0,
    status:      'pending',
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function planDescription(planName?: string): string {
    return `Servicio Mensual ${planName ? `- Plan ${planName}` : ''} - ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
  }

  function advanceDescription(monthIndex: number, year: number, planName?: string): string {
    const monthLabel = MONTHS[monthIndex]?.label ?? '';
    return `Pago Adelantado - ${planName ? `Plan ${planName}` : 'Servicio'} - ${monthLabel} ${year}`;
  }

  function currentMonthDueDate(): string {
    return buildDueDate(now.getMonth(), now.getFullYear());
  }

  // ── Inicializar al abrir ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      setInvoiceType('plan');
      setAdvanceMonthIndex(now.getMonth());
      setAdvanceYear(now.getFullYear());
      setFormData({ clientId: '', clientName: '', description: '', amount: 0, status: 'pending' });
      return;
    }

    if (isSingleClientMode && singleClientId) {
      setFormData({
        clientId:    singleClientId,
        clientName:  singleClientName ?? '',
        amount:      singleMonthlyFee ?? 0,
        description: planDescription(singlePlanName),
        status:      'pending',
        dueDate:     currentMonthDueDate(),
        invoiceType: 'plan',
      });
    }
  }, [open]);

  // ── Recalcular cuando cambia el tipo de factura ──────────────────────────────

  useEffect(() => {
    if (!open) return;

    const planName = isSingleClientMode
      ? singlePlanName
      : clients?.find(c => c.id === formData.clientId)?.planName;

    const fee = isSingleClientMode
      ? (singleMonthlyFee ?? 0)
      : (clients?.find(c => c.id === formData.clientId)?.monthlyFee ?? 0);

    if (invoiceType === 'plan') {
      setFormData(prev => ({
        ...prev,
        amount:      fee,
        description: planDescription(planName),
        dueDate:     currentMonthDueDate(),
        invoiceType: 'plan',
      }));
    } else if (invoiceType === 'advance') {
      setFormData(prev => ({
        ...prev,
        amount:      fee,
        description: advanceDescription(advanceMonthIndex, advanceYear, planName),
        dueDate:     buildDueDate(advanceMonthIndex, advanceYear),
        invoiceType: 'advance',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        description: '',
        dueDate:     undefined,
        invoiceType: 'custom',
      }));
    }
  }, [invoiceType]);

  // ── Recalcular descripción y dueDate cuando cambia mes/año en advance ────────

  useEffect(() => {
    if (!open || invoiceType !== 'advance') return;

    const planName = isSingleClientMode
      ? singlePlanName
      : clients?.find(c => c.id === formData.clientId)?.planName;

    setFormData(prev => ({
      ...prev,
      description: advanceDescription(advanceMonthIndex, advanceYear, planName),
      dueDate:     buildDueDate(advanceMonthIndex, advanceYear),
    }));
  }, [advanceMonthIndex, advanceYear]);

  // ── Cambio de cliente (modo múltiple) ────────────────────────────────────────

  const handleClientChange = (clientId: string) => {
    if (!clients) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    if (invoiceType === 'plan') {
      setFormData({
        clientId,
        clientName:  client.name,
        amount:      client.monthlyFee ?? 0,
        description: planDescription(client.planName),
        status:      'pending',
        dueDate:     currentMonthDueDate(),
        invoiceType: 'plan',
      });
    } else if (invoiceType === 'advance') {
      setFormData({
        clientId,
        clientName:  client.name,
        amount:      client.monthlyFee ?? 0,
        description: advanceDescription(advanceMonthIndex, advanceYear, client.planName),
        status:      'pending',
        dueDate:     buildDueDate(advanceMonthIndex, advanceYear),
        invoiceType: 'advance',
      });
    } else {
      setFormData(prev => ({ ...prev, clientId, clientName: client.name }));
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setInvoiceType('plan');
    setFormData({ clientId: '', clientName: '', description: '', amount: 0, status: 'pending' });
  };

  // ── Datos del cliente seleccionado (para el resumen) ─────────────────────────

  const selectedClient = isSingleClientMode
    ? { id: singleClientId!, name: singleClientName!, monthlyFee: singleMonthlyFee ?? 0, planName: singlePlanName }
    : clients?.find(c => c.id === formData.clientId);

  const advanceMonthLabel = MONTHS[advanceMonthIndex]?.label ?? '';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Factura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">

            {/* Selector de cliente (solo modo múltiple) */}
            {!isSingleClientMode && (
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Combobox
                  value={formData.clientId}
                  onValueChange={handleClientChange}
                  options={clients?.map(c => ({ value: c.id, label: c.name })) ?? []}
                  placeholder="Seleccionar cliente"
                  searchPlaceholder="Buscar cliente..."
                  emptyText="No se encontraron clientes"
                />
              </div>
            )}

            {/* Cliente fijo (modo único) */}
            {isSingleClientMode && (
              <div className="rounded-lg bg-gray-50 border p-3">
                <div className="text-sm text-gray-600">Cliente</div>
                <div className="font-medium">{singleClientName}</div>
              </div>
            )}

            {/* Tipo de factura */}
            {formData.clientId && (
              <div className="space-y-3">
                <Label>Tipo de Factura *</Label>
                <RadioGroup value={invoiceType} onValueChange={v => setInvoiceType(v as any)}>

                  {/* Plan del mes */}
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50">
                    <RadioGroupItem value="plan" id="plan" />
                    <Label htmlFor="plan" className="flex-1 cursor-pointer">
                      <div className="font-medium">Factura del Plan Asignado</div>
                      {selectedClient && (
                        <div className="text-sm text-gray-500">
                          {selectedClient.planName ?? 'Sin plan'} — ${(selectedClient.monthlyFee ?? 0).toFixed(2)}
                          {' · '}vence el{' '}
                          {new Date(currentMonthDueDate() + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                        </div>
                      )}
                    </Label>
                  </div>

                  {/* Pago adelantado */}
                  <div className="flex flex-col space-y-2 rounded-lg border p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advance" id="advance" />
                      <Label htmlFor="advance" className="flex-1 cursor-pointer">
                        <div className="font-medium">Pago Adelantado</div>
                        {selectedClient && invoiceType === 'advance' && (
                          <div className="text-sm text-gray-500">
                            {selectedClient.planName ?? 'Sin plan'} — ${(selectedClient.monthlyFee ?? 0).toFixed(2)}
                            {' · '}vence el 10 de {advanceMonthLabel} {advanceYear}
                          </div>
                        )}
                      </Label>
                    </div>

                    {/* Selectores de mes/año — solo visibles cuando advance está activo */}
                    {invoiceType === 'advance' && (
                      <div className="ml-6 grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="advanceMonth" className="text-xs">Mes</Label>
                          <Select
                            value={String(advanceMonthIndex)}
                            onValueChange={v => setAdvanceMonthIndex(Number(v))}
                          >
                            <SelectTrigger id="advanceMonth" className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="advanceYear" className="text-xs">Año</Label>
                          <Select
                            value={String(advanceYear)}
                            onValueChange={v => setAdvanceYear(Number(v))}
                          >
                            <SelectTrigger id="advanceYear" className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2].map(y => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Personalizada */}
                  <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-gray-50">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="flex-1 cursor-pointer">
                      <div className="font-medium">Factura Personalizada</div>
                      <div className="text-sm text-gray-500">Especificar descripción y monto</div>
                    </Label>
                  </div>

                </RadioGroup>
              </div>
            )}

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción *
                {invoiceType !== 'custom' && (
                  <span className="ml-2 text-xs text-gray-500">(Auto-completado)</span>
                )}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={3}
                disabled={invoiceType !== 'custom'}
                className={invoiceType !== 'custom' ? 'bg-gray-50' : ''}
                placeholder={invoiceType === 'custom' ? 'Ej: Instalación de equipo, reparación, etc.' : ''}
              />
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Monto *
                {invoiceType !== 'custom' && (
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
                  onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                  disabled={invoiceType !== 'custom'}
                  className={invoiceType !== 'custom' ? 'bg-gray-50 pl-7' : 'pl-7'}
                />
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(v: any) => setFormData(prev => ({ ...prev, status: v }))}
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

            {/* Fecha de vencimiento (solo custom) */}
            {invoiceType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">Fecha de Vencimiento (Opcional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
                <p className="text-xs text-gray-500">
                  Si no se especifica, se asignará el día 10 del mes actual.
                </p>
              </div>
            )}

            {/* Resumen */}
            {invoiceType === 'plan' && selectedClient && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                Se creará una factura de <strong>${(selectedClient.monthlyFee ?? 0).toFixed(2)}</strong> con vencimiento el{' '}
                <strong>
                  {new Date(currentMonthDueDate() + 'T00:00:00').toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </strong>.
              </div>
            )}

            {invoiceType === 'advance' && selectedClient && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                Pago adelantado de <strong>${(selectedClient.monthlyFee ?? 0).toFixed(2)}</strong> para{' '}
                <strong>{advanceMonthLabel} {advanceYear}</strong> — vence el{' '}
                <strong>10 de {advanceMonthLabel} {advanceYear}</strong>.
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