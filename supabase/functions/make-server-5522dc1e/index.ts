import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // ==================== CLIENTS ENDPOINTS ====================

    // GET /clients - Get all clients
    if (path === '/clients' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ clients: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /clients/:id - Get one client
    if (path.match(/^\/clients\/[^\/]+$/) && method === 'GET') {
      const id = path.split('/')[2];

      const { data, error } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ client: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /clients - Create client
    if (path === '/clients' && method === 'POST') {
      const body = await req.json();

      // Map camelCase to snake_case for database
      const clientData = {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        ip_address: body.ipAddress,
        pole_number: body.poleNumber,
        neighborhood: body.neighborhood,
        plan_name: body.planName,
        status: body.status || 'active',
        connection_status: body.connectionStatus || 'offline',
        monthly_fee: body.monthlyFee,
        join_date: body.joinDate || new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabaseClient
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      // Map snake_case back to camelCase
      const responseData = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        ipAddress: data.ip_address,
        poleNumber: data.pole_number,
        neighborhood: data.neighborhood,
        planName: data.plan_name,
        status: data.status,
        connectionStatus: data.connection_status,
        monthlyFee: data.monthly_fee,
        joinDate: data.join_date,
      };

      return new Response(JSON.stringify({ client: responseData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    // PUT /clients/:id - Update client
    if (path.match(/^\/clients\/[^\/]+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();

      const clientData: any = {};
      if (body.name !== undefined) clientData.name = body.name;
      if (body.email !== undefined) clientData.email = body.email;
      if (body.phone !== undefined) clientData.phone = body.phone;
      if (body.address !== undefined) clientData.address = body.address;
      if (body.ipAddress !== undefined) clientData.ip_address = body.ipAddress;
      if (body.poleNumber !== undefined) clientData.pole_number = body.poleNumber;
      if (body.neighborhood !== undefined) clientData.neighborhood = body.neighborhood;
      if (body.planName !== undefined) clientData.plan_name = body.planName;
      if (body.status !== undefined) clientData.status = body.status;
      if (body.connectionStatus !== undefined) clientData.connection_status = body.connectionStatus;
      if (body.monthlyFee !== undefined) clientData.monthly_fee = body.monthlyFee;

      const { data, error } = await supabaseClient
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const responseData = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        ipAddress: data.ip_address,
        poleNumber: data.pole_number,
        neighborhood: data.neighborhood,
        planName: data.plan_name,
        status: data.status,
        connectionStatus: data.connection_status,
        monthlyFee: data.monthly_fee,
        joinDate: data.join_date,
      };

      return new Response(JSON.stringify({ client: responseData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /clients/:id - Delete client
    if (path.match(/^\/clients\/[^\/]+$/) && method === 'DELETE') {
      const id = path.split('/')[2];

      const { error } = await supabaseClient.from('clients').delete().eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== PLANS ENDPOINTS ====================

    // GET /plans - Get all plans
    if (path === '/plans' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify({ plans: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /plans - Create plan
    if (path === '/plans' && method === 'POST') {
      const body = await req.json();

      const planData = {
        name: body.name,
        price: body.price,
        download_speed: body.downloadSpeed || body.download_speed,
        upload_speed: body.uploadSpeed || body.upload_speed,
        features: body.features || [],
        popular: body.popular || false,
      };

      const { data, error } = await supabaseClient
        .from('plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ plan: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    // PUT /plans/:id - Update plan
    if (path.match(/^\/plans\/[^\/]+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();

      const planData: any = {};
      if (body.name !== undefined) planData.name = body.name;
      if (body.price !== undefined) planData.price = body.price;
      if (body.downloadSpeed !== undefined) planData.download_speed = body.downloadSpeed;
      if (body.uploadSpeed !== undefined) planData.upload_speed = body.uploadSpeed;
      if (body.features !== undefined) planData.features = body.features;
      if (body.popular !== undefined) planData.popular = body.popular;

      const { data, error } = await supabaseClient
        .from('plans')
        .update(planData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ plan: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /plans/:id - Delete plan
    if (path.match(/^\/plans\/[^\/]+$/) && method === 'DELETE') {
      const id = path.split('/')[2];

      const { error } = await supabaseClient.from('plans').delete().eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== INVOICES ENDPOINTS ====================

    // GET /invoices - Get all invoices
    if (path === '/invoices' && method === 'GET') {
      const { data, error } = await supabaseClient
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ invoices: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /invoices/client/:clientId - Get invoices by client
    if (path.match(/^\/invoices\/client\/[^\/]+$/) && method === 'GET') {
      const clientId = path.split('/')[3];

      const { data, error } = await supabaseClient
        .from('invoices')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ invoices: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /invoices - Create invoice
    if (path === '/invoices' && method === 'POST') {
      const body = await req.json();

      const invoiceData = {
        client_id: body.clientId,
        client_name: body.clientName,
        amount: body.amount,
        description: body.description,
        status: body.status || 'pending',
        due_date: body.dueDate,
        paid_date: body.paidDate,
      };

      const { data, error } = await supabaseClient
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ invoice: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    // PUT /invoices/:id - Update invoice
    if (path.match(/^\/invoices\/[^\/]+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const body = await req.json();

      const invoiceData: any = {};
      if (body.amount !== undefined) invoiceData.amount = body.amount;
      if (body.description !== undefined) invoiceData.description = body.description;
      if (body.status !== undefined) invoiceData.status = body.status;
      if (body.dueDate !== undefined) invoiceData.due_date = body.dueDate;
      if (body.paidDate !== undefined) invoiceData.paid_date = body.paidDate;

      const { data, error } = await supabaseClient
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ invoice: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /init-data - Initialize sample data (optional)
    if (path === '/init-data' && method === 'POST') {
      // Check if we already have data
      const { count } = await supabaseClient
        .from('clients')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        return new Response(JSON.stringify({ message: 'Data already initialized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ message: 'Data initialization endpoint' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no route matched
    return new Response(JSON.stringify({ error: 'Not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
