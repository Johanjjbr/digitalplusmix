import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (planName: string, monthlyFee: number) => void;
  currentPlan: string;
  plans: Array<{ name: string; price: number }>;
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  onSubmit,
  currentPlan,
  plans,
}: ChangePlanDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(currentPlan);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plan = plans.find((p) => p.name === selectedPlan);
    if (plan) {
      onSubmit(plan.name, plan.price);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Label className="mb-4 block">Seleccionar Nuevo Plan</Label>
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.name} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-gray-50">
                    <RadioGroupItem value={plan.name} id={plan.name} />
                    <Label htmlFor={plan.name} className="flex-1 cursor-pointer">
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-sm text-gray-600">${plan.price.toFixed(2)}/mes</div>
                    </Label>
                    {plan.name === currentPlan && (
                      <span className="text-xs text-blue-600 font-medium">Actual</span>
                    )}
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Cambiar Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
