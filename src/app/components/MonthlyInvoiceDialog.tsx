import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Calendar } from 'lucide-react';
import { formatPeriod } from '@/lib/api-extended';

interface Client {
  id: string;
  name: string;
  planName: string;
  monthlyFee: number;
  status: 'active' | 'suspended' | 'delinquent';
}

interface ExistingMonthlyInvoice {
  clientId: string;
  billingPeriod?: string | null;
  status: string;
}

interface MonthlyInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { clientIds: string[]; dueDate: string; period: string }) => void;
  clients: Client[];
  invoices: ExistingMonthlyInvoice[];
  submitting?: boolean;
}

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function MonthlyInvoiceDialog({ open, onOpenChange, onSubmit, clients, invoices, submitting }: MonthlyInvoiceDialogProps) {
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState(currentMonth());
  const [dueDate, setDueDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Al abrir: mes actual
  useEffect(() => {
    if (open) setPeriod(currentMonth());
  }, [open]);

  // Vencimiento por defecto: día 10 del mes que se factura
  useEffect(() => {
    if (period) setDueDate(`${period}-10`);
    setSelectedClientIds(new Set());
  }, [period]);

  // Clientes que YA tienen la factura del mes elegido (pagada o no)
  const billedThisPeriod = new Map<string, string>();
  invoices.forEach((inv) => {
    if (inv.billingPeriod && inv.billingPeriod.slice(0, 7) === period) {
      billedThisPeriod.set(inv.clientId, inv.status);
    }
  });

  // Reset cuando se cierra
  useEffect(() => {
    if (!open) {
      setSelectedClientIds(new Set());
      setSearchTerm('');
    }
  }, [open]);

  const handleToggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClientIds);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClientIds(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedClientIds.size === selectableClients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(selectableClients.map(c => c.id)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientIds.size === 0) return;
    
    if (submitting) return;

    onSubmit({
      clientIds: Array.from(selectedClientIds),
      dueDate,
      period,
    });
  };

  const filteredClients = clients
    .filter(client =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.planName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Solo se pueden seleccionar: sin factura del mes, con tarifa y no suspendidos
  const isSelectable = (c: Client) => !billedThisPeriod.has(c.id) && c.monthlyFee > 0 && c.status !== 'suspended';
  const selectableClients = filteredClients.filter(isSelectable);
  const alreadyBilledCount = clients.filter(c => billedThisPeriod.has(c.id)).length;

  const selectedClients = clients.filter(c => selectedClientIds.has(c.id));
  const totalAmount = selectedClients.reduce((sum, c) => sum + c.monthlyFee, 0);

  const allSelected = selectableClients.length > 0 && selectedClientIds.size === selectableClients.length;
  const someSelected = selectedClientIds.size > 0 && selectedClientIds.size < selectableClients.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generar Facturas Mensuales</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* Mes a facturar */}
            <div className="space-y-2 pb-4 border-b">
              <Label htmlFor="period">Mes a facturar</Label>
              <Input
                id="period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                {alreadyBilledCount > 0
                  ? `${alreadyBilledCount} cliente(s) ya tienen la factura de ${formatPeriod(`${period}-01`)} y no se volverán a facturar.`
                  : `Ningún cliente tiene todavía la factura de ${formatPeriod(`${period}-01`)}.`}
              </p>
            </div>

            {/* Fecha de Vencimiento */}
            <div className="space-y-2 pb-4 border-b">
              <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500">
                Por defecto: día 10 del mes facturado
              </p>
            </div>

            {/* Búsqueda de Clientes */}
            <div className="space-y-2 pb-4 border-b">
              <Label htmlFor="search">Buscar Clientes</Label>
              <Input
                id="search"
                type="text"
                placeholder="Buscar por nombre o plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Seleccionar Todos */}
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={handleToggleAll}
                className={someSelected ? 'data-[state=checked]:bg-gray-400' : ''}
              />
              <Label htmlFor="select-all" className="cursor-pointer font-medium">
                {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                <span className="ml-2 text-sm text-gray-500">
                  ({selectedClientIds.size} de {selectableClients.length} disponibles)
                </span>
              </Label>
            </div>

            {/* Lista de Clientes */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron clientes
                </div>
              ) : (
                filteredClients.map((client) => {
                  const billedStatus = billedThisPeriod.get(client.id);
                  const selectable = isSelectable(client);
                  return (
                  <div
                    key={client.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      !selectable
                        ? 'opacity-60 bg-gray-50'
                        : selectedClientIds.has(client.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        id={`client-${client.id}`}
                        checked={selectedClientIds.has(client.id)}
                        disabled={!selectable}
                        onCheckedChange={() => handleToggleClient(client.id)}
                      />
                      <Label
                        htmlFor={`client-${client.id}`}
                        className="cursor-pointer flex-1"
                      >
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-gray-500">
                          {client.planName} - ${(client.monthlyFee || 0).toFixed(2)}
                        </div>
                      </Label>
                    </div>
                    <div className="text-right space-x-1">
                      {billedStatus && (
                        <div
                          className={`text-xs px-2 py-1 rounded-full inline-block ${
                            billedStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {billedStatus === 'paid' ? 'Mes pagado' : 'Ya facturado'}
                        </div>
                      )}
                      <div
                        className={`text-xs px-2 py-1 rounded-full inline-block ${
                          client.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : client.status === 'delinquent'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {client.status === 'active'
                          ? 'Al día'
                          : client.status === 'delinquent'
                          ? 'Moroso'
                          : 'Suspendido'}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            {/* Resumen */}
            {selectedClientIds.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="font-semibold text-blue-900">Resumen</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Clientes seleccionados:</div>
                  <div className="font-medium text-right">{selectedClientIds.size}</div>
                  <div className="text-gray-600">Total a facturar:</div>
                  <div className="font-medium text-right">${totalAmount.toFixed(2)}</div>
                  <div className="text-gray-600">Mes:</div>
                  <div className="font-medium text-right">{formatPeriod(`${period}-01`)}</div>
                  <div className="text-gray-600">Fecha de vencimiento:</div>
                  <div className="font-medium text-right">
                    {new Date(`${dueDate}T12:00:00`).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={selectedClientIds.size === 0 || submitting}
            >
              {submitting
                ? 'Generando...'
                : `Generar ${selectedClientIds.size} Factura${selectedClientIds.size !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}