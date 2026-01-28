import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { zonesAPI } from '@/lib/api-tickets-zones';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

interface Zone {
  id: string;
  name: string;
  description: string;
  color: string;
  centerLatitude: number;
  centerLongitude: number;
  createdAt: string;
}

export function Zones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    centerLatitude: '',
    centerLongitude: '',
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const response = await zonesAPI.getAll();
      setZones(response.zones || []);
    } catch (error) {
      console.error('Error loading zones:', error);
      toast.error('Error al cargar las zonas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (zone?: Zone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        description: zone.description || '',
        color: zone.color,
        centerLatitude: zone.centerLatitude?.toString() || '',
        centerLongitude: zone.centerLongitude?.toString() || '',
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        centerLatitude: '',
        centerLongitude: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      const zoneData = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        centerLatitude: formData.centerLatitude ? parseFloat(formData.centerLatitude) : undefined,
        centerLongitude: formData.centerLongitude ? parseFloat(formData.centerLongitude) : undefined,
      };

      if (editingZone) {
        await zonesAPI.update(editingZone.id, zoneData);
        toast.success('Zona actualizada exitosamente');
      } else {
        await zonesAPI.create(zoneData);
        toast.success('Zona creada exitosamente');
      }

      setIsDialogOpen(false);
      loadZones();
    } catch (error: any) {
      console.error('Error saving zone:', error);
      toast.error(error.message || 'Error al guardar la zona');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la zona "${name}"?`)) {
      return;
    }

    try {
      await zonesAPI.delete(id);
      toast.success('Zona eliminada exitosamente');
      loadZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Error al eliminar la zona');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Cargando zonas...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Gestión de Zonas</h1>
          <p className="text-gray-600">Administra las zonas geográficas del servicio</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Zona
        </Button>
      </div>

      {/* Zones Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Coordenadas</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No hay zonas registradas
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell>
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: zone.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {zone.description || <span className="text-gray-400">Sin descripción</span>}
                  </TableCell>
                  <TableCell>
                    {zone.centerLatitude && zone.centerLongitude ? (
                      <div className="text-xs font-mono">
                        {zone.centerLatitude.toFixed(6)}, {zone.centerLongitude.toFixed(6)}
                      </div>
                    ) : (
                      <span className="text-gray-400">No establecidas</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(zone.createdAt).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(zone)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(zone.id, zone.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Editar Zona' : 'Nueva Zona'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Zona Norte"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la zona..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="color">Color en el Mapa</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitud Centro</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={formData.centerLatitude}
                    onChange={(e) =>
                      setFormData({ ...formData, centerLatitude: e.target.value })
                    }
                    placeholder="-12.046374"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitud Centro</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={formData.centerLongitude}
                    onChange={(e) =>
                      setFormData({ ...formData, centerLongitude: e.target.value })
                    }
                    placeholder="-77.042793"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Las coordenadas son opcionales. Puedes obtenerlas de Google Maps haciendo clic
                  derecho en el mapa.
                </span>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingZone ? 'Guardar Cambios' : 'Crear Zona'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
