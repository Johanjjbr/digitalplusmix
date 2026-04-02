import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { supabase } from '../../lib/supabase';

export function ActivateUser() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const userId = searchParams.get('id');
    if (!userId) {
      setStatus('error');
      setMessage('Falta el identificador de usuario en la URL.');
      return;
    }

    const activate = async () => {
      setStatus('loading');

      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('email, is_active')
        .eq('id', userId)
        .single();

      if (fetchError || !user) {
        setStatus('error');
        setMessage('No se encontró el usuario para activar.');
        return;
      }

      setEmail(user.email);

      if (user.is_active) {
        setStatus('already');
        setMessage('La cuenta ya estaba activada.');
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', userId);

      if (updateError) {
        setStatus('error');
        setMessage('No se pudo activar la cuenta. Intenta de nuevo más tarde.');
        return;
      }

      setStatus('success');
      setMessage('La cuenta se activó correctamente.');
    };

    activate();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Activación de Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">
                {status === 'loading' && 'Verificando la activación...'}
                {status === 'success' && 'Tu cuenta ha sido activada con éxito.'}
                {status === 'already' && 'Esta cuenta ya estaba activada previamente.'}
                {status === 'error' && message}
              </p>
            </div>
            {email && (
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                <p className="text-sm text-slate-500">Cuenta:</p>
                <p className="font-medium text-slate-900">{email}</p>
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">
                Ir a iniciar sesión
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
