import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Calendar } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  planName: string;
  monthlyFee: number;
  status: 'active' | 'suspended' | 'delinquent';
}

interface MonthlyInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { clientIds: string[]; dueDate: string }) => void;
  clients: Client[];
}

export function MonthlyInvoiceDialog({ open, onOpenChange, onSubmit, clients }: MonthlyInvoiceDialogProps) {
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Calcular fecha por defecto (día 10 del próximo mes)
  useEffect(() => {
    if (open) {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 10);
      const formattedDate = nextMonth.toISOString().split('T')[0];
      setDueDate(formattedDate);
    }
  }, [open]);

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
    if (selectedClientIds.size === filteredClients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(filteredClients.map(c => c.id)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientIds.size === 0) return;
    
    onSubmit({
      clientIds: Array.from(selectedClientIds),
      dueDate,
    });
    
    setSelectedClientIds(new Set());
    setSearchTerm('');
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.planName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClients = clients.filter(c => selectedClientIds.has(c.id));
  const totalAmount = selectedClients.reduce((sum, c) => sum + c.monthlyFee, 0);

  const allSelected = filteredClients.length > 0 && selectedClientIds.size === filteredClients.length;
  const someSelected = selectedClientIds.size > 0 && selectedClientIds.size < filteredClients.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generar Facturas Mensuales</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 flex-1 overflow-y-auto">
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
                Por defecto: día 10 del próximo mes
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
                  ({selectedClientIds.size} de {filteredClients.length} seleccionados)
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
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selectedClientIds.has(client.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        id={`client-${client.id}`}
                        checked={selectedClientIds.has(client.id)}
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
                    <div className="text-right">
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
                ))
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
                  <div className="text-gray-600">Fecha de vencimiento:</div>
                  <div className="font-medium text-right">
                    {new Date(dueDate).toLocaleDateString('es-ES', {
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
              disabled={selectedClientIds.size === 0}
            >
              Generar {selectedClientIds.size} Factura{selectedClientIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}