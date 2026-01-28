import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { plansAPI } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

interface PlanFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan?: Plan | null;
}

export function PlanFormDialog({ open, onClose, onSuccess, plan }: PlanFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    popular: false,
  });
  const [features, setFeatures] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        price: plan.price.toString(),
        popular: plan.popular || false,
      });
      setFeatures(plan.features.length > 0 ? plan.features : ['']);
    } else {
      setFormData({
        name: '',
        price: '',
        popular: false,
      });
      setFeatures(['']);
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name.trim()) {
      toast.error('El nombre del plan es requerido');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }
    
    const validFeatures = features.filter(f => f.trim() !== '');
    if (validFeatures.length === 0) {
      toast.error('Agrega al menos una característica');
      return;
    }

    setLoading(true);

    try {
      const planData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        features: validFeatures,
        popular: formData.popular,
      };

      if (plan) {
        await plansAPI.update(plan.id, planData);
        toast.success('Plan actualizado exitosamente');
      } else {
        await plansAPI.create(planData);
        toast.success('Plan creado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error(plan ? 'Error al actualizar el plan' : 'Error al crear el plan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleRemoveFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Editar Plan' : 'Crear Nuevo Plan'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Nombre del Plan */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre del Plan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ej. 100 Mbps + TV"
              required
            />
          </div>

          {/* Precio */}
          <div className="space-y-2">
            <Label htmlFor="price">
              Precio Mensual (USD) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="ej. 49.99"
              required
            />
          </div>

          {/* Popular */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="popular"
              checked={formData.popular}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, popular: checked as boolean })
              }
            />
            <Label
              htmlFor="popular"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Marcar como plan popular
            </Label>
          </div>

          {/* Características */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Características <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFeature}
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder={`Característica ${index + 1}`}
                    className="flex-1"
                  />
                  {features.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveFeature(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Agrega las características que incluye este plan (velocidad, canales TV, soporte, etc.)
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Guardando...' : (plan ? 'Actualizar Plan' : 'Crear Plan')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
