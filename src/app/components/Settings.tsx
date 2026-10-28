import { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Calendar, DollarSign, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Textarea } from '@/app/components/ui/textarea';
import { paymentSettingsAPI, type PaymentSettings } from '@/lib/api-extended';
import { DEFAULT_WHATSAPP_TEMPLATE } from '@/lib/whatsapp';

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
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    pmBank: '',
    pmPhone: '',
    pmIdNumber: '',
    pmHolder: '',
    whatsappCountryCode: '58',
    whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
  });
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    loadBillingSettings();
    paymentSettingsAPI
      .get()
      .then((s) => setPaymentSettings({ ...s, whatsappTemplate: s.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE }))
      .catch(() => {});
  }, []);

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPayment(true);
      await paymentSettingsAPI.save(paymentSettings);
      toast.success('Datos de Pago Móvil guardados');
    } catch (error: any) {
      console.error('Error saving payment settings:', error);
      toast.error(
        error?.message?.includes('pm_')
          ? 'Falta ejecutar FIX_FACTURACION_Y_WHATSAPP.sql en Supabase'
          : 'Error al guardar los datos de pago'
      );
    } finally {
      setSavingPayment(false);
    }
  };

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
        });
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

      // Actualizar el usuario en localStorage
      const updatedUser = { ...currentUser, full_name: profileData.fullName };
      localStorage.setItem('digitalplus_current_user', JSON.stringify(updatedUser));

      toast.success('Perfil actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating profile:', error);
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

      // Verificar contraseña actual
      const loginResult = await authService.login({
        email: currentUser?.email || '',
        password: passwordData.currentPassword,
      });

      if (!loginResult.success) {
        toast.error('La contraseña actual es incorrecta');
        return;
      }

      // Hash de la nueva contraseña
      const encoder = new TextEncoder();
      const data = encoder.encode(passwordData.newPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Actualizar contraseña
      const { error } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', currentUser?.id);

      if (error) throw error;

      toast.success('Contraseña cambiada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveBillingSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const billingDay = parseInt(billingSettings.billingDay);
    if (billingDay < 1 || billingDay > 28) {
      toast.error('El día de facturación debe estar entre 1 y 28');
      return;
    }

    try {
      setSavingBilling(true);

      // Verificar si existe la configuración
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
        .single();

      const settingsData = {
        auto_generate_invoices: billingSettings.autoGenerateInvoices,
        billing_day: billingDay,
      };

      if (existing) {
        // Actualizar
        const { error } = await supabase
          .from('system_settings')
          .update(settingsData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Crear
        const { error } = await supabase
          .from('system_settings')
          .insert([settingsData]);

        if (error) throw error;
      }

      toast.success('Configuración de facturación guardada');
    } catch (error: any) {
      console.error('Error saving billing settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSavingBilling(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Configuración</h1>
        <p className="text-gray-600">Administra la configuración del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
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
                  onChange={(e) =>
                    setProfileData({ ...profileData, fullName: e.target.value })
                  }
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  className="mt-1 bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede cambiar
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={savingProfile}
              >
                {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
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
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
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
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
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
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="mt-1"
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={changingPassword}
              >
                {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Billing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Facturación Automática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBillingSettings} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Generar facturas automáticamente</p>
                  <p className="text-sm text-gray-600">
                    Crear facturas mensuales de forma automática
                  </p>
                </div>
                <Switch
                  checked={billingSettings.autoGenerateInvoices}
                  onCheckedChange={(checked) =>
                    setBillingSettings({ ...billingSettings, autoGenerateInvoices: checked })
                  }
                />
              </div>
              <div>
                <Label htmlFor="billing-day">Día de Facturación Mensual</Label>
                <Input
                  id="billing-day"
                  type="number"
                  min="1"
                  max="28"
                  value={billingSettings.billingDay}
                  onChange={(e) =>
                    setBillingSettings({ ...billingSettings, billingDay: e.target.value })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Las facturas se generarán automáticamente cada día {billingSettings.billingDay} del mes
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={savingBilling}
              >
                {savingBilling ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pago Móvil / WhatsApp */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Pago Móvil y Avisos por WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePaymentSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pm-bank">Banco</Label>
                  <Input
                    id="pm-bank"
                    placeholder="Ej: Banesco (0134)"
                    value={paymentSettings.pmBank}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, pmBank: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pm-phone">Teléfono Pago Móvil</Label>
                  <Input
                    id="pm-phone"
                    placeholder="Ej: 0414-1234567"
                    value={paymentSettings.pmPhone}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, pmPhone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pm-id">Cédula / RIF</Label>
                  <Input
                    id="pm-id"
                    placeholder="Ej: V-12345678"
                    value={paymentSettings.pmIdNumber}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, pmIdNumber: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pm-holder">Titular</Label>
                  <Input
                    id="pm-holder"
                    placeholder="Nombre del titular"
                    value={paymentSettings.pmHolder}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, pmHolder: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="wa-cc">Código de país para WhatsApp</Label>
                  <Input
                    id="wa-cc"
                    placeholder="58"
                    value={paymentSettings.whatsappCountryCode}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, whatsappCountryCode: e.target.value })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se agrega a los teléfonos de clientes que empiezan con 0 (58 = Venezuela).
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="wa-template">Mensaje de WhatsApp</Label>
                <Textarea
                  id="wa-template"
                  rows={12}
                  value={paymentSettings.whatsappTemplate}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, whatsappTemplate: e.target.value })
                  }
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables: {'{nombre}'} {'{meses}'} {'{detalle}'} {'{monto}'} {'{banco}'} {'{telefono}'}{' '}
                  {'{cedula}'} {'{titular}'}
                </p>
                <button
                  type="button"
                  className="text-xs text-blue-600 underline mt-1"
                  onClick={() =>
                    setPaymentSettings({ ...paymentSettings, whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE })
                  }
                >
                  Restaurar mensaje por defecto
                </button>
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={savingPayment}
              >
                {savingPayment ? 'Guardando...' : 'Guardar Datos de Pago'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nuevos clientes</p>
                <p className="text-sm text-gray-600">Notificar cuando se registre un nuevo cliente</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pagos recibidos</p>
                <p className="text-sm text-gray-600">Notificar cuando se reciba un pago</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Facturas vencidas</p>
                <p className="text-sm text-gray-600">Notificar sobre facturas vencidas</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Problemas de red</p>
                <p className="text-sm text-gray-600">Alertas sobre problemas en la red</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
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
