// Supabase Edge Function para Facturación Mensual Automática
// Esta función debe ser ejecutada diariamente mediante un cron job externo
// o configurada con GitHub Actions / Vercel Cron / Supabase Schedule

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BillingResult {
  success: boolean;
  invoices_created: number;
  clients_billed: number;
  total_amount: number;
  message: string;
  executed_at: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticación (token de servicio para cron jobs)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Si se proporciona un secret para cron, validarlo
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando proceso de facturación mensual automática...');

    // Llamar a la función de PostgreSQL
    const { data, error } = await supabase.rpc('generate_monthly_invoices');

    if (error) {
      console.error('Error generando facturas:', error);
      throw error;
    }

    const result = data[0];
    
    console.log('Facturación completada:', result);

    // Actualizar estado de clientes morosos
    console.log('Actualizando estado de clientes morosos...');
    const { data: delinquentData, error: delinquentError } = await supabase.rpc('update_delinquent_clients');

    if (delinquentError) {
      console.error('Error actualizando morosos:', delinquentError);
    } else {
      console.log('Clientes morosos actualizados:', delinquentData[0]);
    }

    const billingResult: BillingResult = {
      success: true,
      invoices_created: result?.invoices_created || 0,
      clients_billed: result?.clients_billed || 0,
      total_amount: result?.total_amount || 0,
      message: `Facturación completada: ${result?.invoices_created || 0} facturas creadas para ${result?.clients_billed || 0} clientes`,
      executed_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(billingResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error en facturación mensual:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        executed_at: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
