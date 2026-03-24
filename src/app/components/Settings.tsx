import { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, DollarSign, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { batchOperationsAPI, type MaintenanceResult } from '@/lib/api-extended';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';

export function Settings() {
  const currentUser = authService.getCurrentUser();
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.full_name || '',
    email: currentUser?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [billingSettings, setBillingSettings] = useState({
    autoGenerateInvoices: true,
    billingDay: '1',
    graceDays: '0',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [runningMaintenance, setRunningMaintenance] = useState(false);
  const [lastMaintenanceResult, setLastMaintenanceResult] = useState<MaintenanceResult | null>(null);
  const [lastBillingRun, setLastBillingRun] = useState<string | null>(null);

  useEffect(() => {
    loadBillingSettings();
  }, []);

  const loadBillingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setBillingSettings({
          autoGenerateInvoices: data.auto_generate_invoices ?? true,
          billingDay: data.billing_day?.toString() || '1',
          graceDays: data.grace_days?.toString() || '0',
        });
        setLastBillingRun(data.last_billing_run || null);
      }
    } catch (error) {
      console.log('No billing settings found, using defaults');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.fullName) {
      toast.error('El nombre es requerido');
      return;
    }
    try {
      setSavingProfile(true);
      const { error } = await supabase
        .from('users')
        .update({ full_name: profileData.fullName })
        .eq('id', currentUser?.id);
      if (error) throw error;
      const updatedUser = { ...currentUser, full_name: profileData.fullName };
      localStorage.setItem('digitalplus_current_user', JSON.stringify(updatedUser));
      toast.success('Perfil actualizado exitosamente');
    } catch (error: any) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Todos los campos son requeridos');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      setChangingPassword(true);
      const loginResult = await authService.login({
        email: currentUser?.email || '',
        password: passwordData.currentPassword,
      });
      if (!loginResult.success) {
        toast.error('La contraseña actual es incorrecta');
        return;
      }
      const encoder = new TextEncoder();
      const data = encoder.encode(passwordData.newPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      const { error } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', currentUser?.id);
      if (error) throw error;
      toast.success('Contraseña cambiada exitosamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error('Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveBillingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const billingDay = parseInt(billingSettings.billingDay);
    const graceDays = parseInt(billingSettings.graceDays);

    if (billingDay < 1 || billingDay > 28) {
      toast.error('El día de facturación debe estar entre 1 y 28');
      return;
    }
    if (graceDays < 0 || graceDays > 30) {
      toast.error('Los días de gracia deben estar entre 0 y 30');
      return;
    }

    try {
      setSavingBilling(true);
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
        .single();

      const settingsData = {
        auto_generate_invoices: billingSettings.autoGenerateInvoices,
        billing_day: billingDay,
        grace_days: graceDays,
      };

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update(settingsData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert([settingsData]);
        if (error) throw error;
      }
      toast.success('Configuración de facturación guardada');
    } catch (error: any) {
      toast.error('Error al guardar la configuración');
    } finally {
      setSavingBilling(false);
    }
  };

  const handleRunMaintenance = async () => {
    try {
      setRunningMaintenance(true);
      setLastMaintenanceResult(null);
      const result = await batchOperationsAPI.runMaintenance();
      setLastMaintenanceResult(result);

      if (result.overdueInvoices === 0 && result.delinquentClients === 0) {
        toast.success('Mantenimiento completado — todo al día, sin cambios');
      } else {
        toast.success(
          `Mantenimiento completado: ${result.overdueInvoices} factura(s) vencida(s), ${result.delinquentClients} cliente(s) marcado(s) como moroso(s)`
        );
      }
    } catch (error) {
      console.error('Error running maintenance:', error);
      toast.error('Error al ejecutar el mantenimiento');
    } finally {
      setRunningMaintenance(false);
    }
  };

  const graceDaysNum = parseInt(billingSettings.graceDays) || 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Configuración</h1>
        <p className="text-gray-600">Administra la configuración del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Perfil de Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profileData.email} className="mt-1 bg-gray-50" disabled />
                <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={savingProfile}>
                {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Cambiar Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="mt-1"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="mt-1"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={changingPassword}>
                {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Billing Settings — ocupa todo el ancho */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Facturación y Corte de Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBillingSettings}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Izquierda: configuración */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Generar facturas automáticamente</p>
                      <p className="text-sm text-gray-600">Crear facturas mensuales de forma automática</p>
                    </div>
                    <Switch
                      checked={billingSettings.autoGenerateInvoices}
                      onCheckedChange={(checked) =>
                        setBillingSettings({ ...billingSettings, autoGenerateInvoices: checked })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="billing-day">Día de Corte Mensual</Label>
                    <Input
                      id="billing-day"
                      type="number"
                      min="1"
                      max="28"
                      value={billingSettings.billingDay}
                      onChange={(e) => setBillingSettings({ ...billingSettings, billingDay: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Las facturas se generan el día {billingSettings.billingDay} de cada mes
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="grace-days" className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Días de Gracia antes de marcar Vencida
                    </Label>
                    <Input
                      id="grace-days"
                      type="number"
                      min="0"
                      max="30"
                      value={billingSettings.graceDays}
                      onChange={(e) => setBillingSettings({ ...billingSettings, graceDays: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {graceDaysNum === 0
                        ? 'Sin gracia: la factura vence exactamente en la fecha indicada'
                        : `La factura se marca como Vencida ${graceDaysNum} día(s) después de la fecha de vencimiento`}
                    </p>
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={savingBilling}>
                    {savingBilling ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                </div>

                {/* Derecha: flujo automático + mantenimiento manual */}
                <div className="space-y-4">
                  {/* Resumen del flujo */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Flujo automático de estados</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500 text-white w-24 justify-center shrink-0">Activo</Badge>
                        <span className="text-gray-500">+</span>
                        <span className="text-gray-600">Factura vence{graceDaysNum > 0 ? ` + ${graceDaysNum}d` : ''}</span>
                        <span className="text-gray-400">→</span>
                        <Badge className="bg-red-500 text-white w-24 justify-center shrink-0">Moroso</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-500 text-white w-24 justify-center shrink-0">Moroso</Badge>
                        <span className="text-gray-500">+</span>
                        <span className="text-gray-600">Paga todo</span>
                        <span className="text-gray-400">→</span>
                        <Badge className="bg-green-500 text-white w-24 justify-center shrink-0">Activo</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-yellow-500 text-white w-24 justify-center shrink-0">Suspendido</Badge>
                        <span className="text-gray-500 text-xs col-span-3">→ nunca cambia automáticamente</span>
                      </div>
                    </div>
                  </div>

                  {/* Mantenimiento manual */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Mantenimiento Manual</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Ejecuta el proceso de vencimiento y morosos ahora mismo, sin esperar al día de corte.
                      </p>
                    </div>

                    {lastBillingRun && (
                      <p className="text-xs text-gray-500">
                        Último corte automático: {new Date(lastBillingRun).toLocaleDateString('es-ES')}
                      </p>
                    )}

                    <Button
                      type="button"
                      onClick={handleRunMaintenance}
                      disabled={runningMaintenance}
                      className="w-full bg-blue-700 hover:bg-blue-800"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${runningMaintenance ? 'animate-spin' : ''}`} />
                      {runningMaintenance ? 'Ejecutando...' : 'Ejecutar Mantenimiento'}
                    </Button>

                    {/* Resultado del último mantenimiento */}
                    {lastMaintenanceResult && (
                      <div className="rounded-lg border border-blue-200 bg-white p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          Resultado
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center rounded-lg bg-orange-50 border border-orange-100 py-2">
                            <p className="text-xl font-bold text-orange-600">{lastMaintenanceResult.overdueInvoices}</p>
                            <p className="text-xs text-orange-500">facturas vencidas</p>
                          </div>
                          <div className="text-center rounded-lg bg-red-50 border border-red-100 py-2">
                            <p className="text-xl font-bold text-red-600">{lastMaintenanceResult.delinquentClients}</p>
                            <p className="text-xs text-red-500">clientes morosos</p>
                          </div>
                        </div>
                        {lastMaintenanceResult.overdueInvoices === 0 && lastMaintenanceResult.delinquentClients === 0 && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Todo al día, sin cambios necesarios
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Nuevos clientes', desc: 'Notificar cuando se registre un nuevo cliente' },
              { label: 'Pagos recibidos', desc: 'Notificar cuando se reciba un pago' },
              { label: 'Facturas vencidas', desc: 'Notificar sobre facturas vencidas' },
              { label: 'Problemas de red', desc: 'Alertas sobre problemas en la red' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-blue-600" />
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Modo oscuro</p>
                <p className="text-sm text-gray-600">Cambiar a tema oscuro</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Densidad compacta</p>
                <p className="text-sm text-gray-600">Mostrar más información en pantalla</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div>
              <Label>Idioma</Label>
              <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
                <option>Español</option>
                <option>English</option>
                <option>Português</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
