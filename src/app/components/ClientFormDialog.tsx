import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { zonesAPI } from '@/lib/api-tickets-zones';

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  poleNumber: string;
  ipAddress: string;
  planName: string;
  monthlyFee: number;
  status: 'active' | 'suspended' | 'delinquent';
  connectionStatus: 'online' | 'offline';
  latitude?: number;
  longitude?: number;
  documentNumber?: string;
  zoneId?: string;
}

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => void;
  initialData?: Partial<ClientFormData>;
  title: string;
  plans?: Array<{ name: string; price: number }>;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  title,
  plans = [],
}: ClientFormDialogProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    neighborhood: '',
    poleNumber: '',
    ipAddress: '',
    planName: '',
    monthlyFee: 0,
    status: 'active',
    connectionStatus: 'online',
    documentNumber: '',
    zoneId: '',
    ...initialData,
  });

  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingZones, setLoadingZones] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoadingZones(true);
      const response = await zonesAPI.getAll();
      setZones(response.zones || []);
    } catch (error) {
      console.error('Error loading zones:', error);
    } finally {
      setLoadingZones(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        neighborhood: '',
        poleNumber: '',
        ipAddress: '',
        planName: '',
        monthlyFee: 0,
        status: 'active',
        connectionStatus: 'online',
        documentNumber: '',
        zoneId: '',
        ...initialData,
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handlePlanChange = (planName: string) => {
    const selectedPlan = plans.find((p) => p.name === planName);
    setFormData({
      ...formData,
      planName,
      monthlyFee: selectedPlan?.price || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Número de Documento</Label>
              <Input
                id="documentNumber"
                value={formData.documentNumber || ''}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                placeholder="DNI, Cédula, Pasaporte, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Barrio *</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zoneId">Zona</Label>
              <Select 
                value={formData.zoneId || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, zoneId: value === 'none' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingZones ? "Cargando zonas..." : "Seleccionar zona (opcional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin zona asignada</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="poleNumber">Número de Poste *</Label>
              <Input
                id="poleNumber"
                value={formData.poleNumber}
                onChange={(e) => setFormData({ ...formData, poleNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipAddress">Dirección IP *</Label>
              <Input
                id="ipAddress"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="192.168.1.1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planName">Plan *</Label>
              <Select value={formData.planName} onValueChange={handlePlanChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.name} value={plan.name}>
                      {plan.name} - ${plan.price}/mes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="active">Al día</SelectItem>
                  <SelectItem value="delinquent">Moroso</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connectionStatus">Estado de Conexión *</Label>
              <Select
                value={formData.connectionStatus}
                onValueChange={(value: any) => setFormData({ ...formData, connectionStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">En línea</SelectItem>
                  <SelectItem value="offline">Desconectado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitud (GPS)</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={formData.latitude || ''}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Ej: -12.046374"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitud (GPS)</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={formData.longitude || ''}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Ej: -77.042793"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {initialData ? 'Actualizar' : 'Crear'} Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}