import { supabase } from './supabase';
import { authService } from './auth';

// Helper function to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = toCamelCase(obj[key]);
  }
  return newObj;
}

// Helper function to convert camelCase to snake_case
function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[snakeKey] = toSnakeCase(obj[key]);
  }
  return newObj;
}

// Function to log audit
async function logAudit(action: 'create' | 'update' | 'delete', table: string, id: string, name: string) {
  const user = authService.getCurrentUser();
  const auditData = {
    action,
    entity_type: table,
    entity_id: id,
    entity_name: name,
    user_id: user?.id,
    user_email: user?.email,
  };

  const { error } = await supabase
    .from('audit_logs')
    .insert([auditData]);

  if (error) {
    console.error('Error logging audit:', error);
    // No lanzar error para no interrumpir la operación principal
  }
}

// ==================== CLIENT API ====================

export const clientsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        zones:zone_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mapear los datos para incluir zoneName
    const clientsWithZoneName = data?.map((client: any) => ({
      ...client,
      zoneName: client.zones?.name,
      zones: undefined, // Eliminar el objeto zones anidado
    }));

    return { clients: toCamelCase(clientsWithZoneName) };
  },

  async getOne(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { client: toCamelCase(data) };
  },

  async create(client: any) {
    const clientData = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      ip_address: client.ipAddress,
      pole_number: client.poleNumber,
      neighborhood: client.neighborhood,
      plan_id: client.planId,
      plan_name: client.planName,
      status: client.status || 'active',
      connection_status: client.connectionStatus || 'offline',
      monthly_fee: client.monthlyFee,
      join_date: client.joinDate || new Date().toISOString().split('T')[0],
      latitude: client.latitude,
      longitude: client.longitude,
      next_billing_date: client.nextBillingDate,
      document_number: client.documentNumber,
      zone_id: client.zoneId,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) {
      // Mejorar el mensaje de error para emails duplicados
      if (error.code === '23505' && error.message.includes('clients_email_key')) {
        const enhancedError = new Error('El email ya está registrado');
        (enhancedError as any).code = error.code;
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }
      throw error;
    }

    // Log audit
    await logAudit('create', 'clients', data.id, data.name);

    return { client: toCamelCase(data) };
  },

  async update(id: string, client: any) {
    const clientData: any = {};
    if (client.name !== undefined) clientData.name = client.name;
    if (client.email !== undefined) clientData.email = client.email;
    if (client.phone !== undefined) clientData.phone = client.phone;
    if (client.address !== undefined) clientData.address = client.address;
    if (client.ipAddress !== undefined) clientData.ip_address = client.ipAddress;
    if (client.poleNumber !== undefined) clientData.pole_number = client.poleNumber;
    if (client.neighborhood !== undefined) clientData.neighborhood = client.neighborhood;
    if (client.planId !== undefined) clientData.plan_id = client.planId;
    if (client.planName !== undefined) clientData.plan_name = client.planName;
    if (client.status !== undefined) clientData.status = client.status;
    if (client.connectionStatus !== undefined) clientData.connection_status = client.connectionStatus;
    if (client.monthlyFee !== undefined) clientData.monthly_fee = client.monthlyFee;
    if (client.latitude !== undefined) clientData.latitude = client.latitude;
    if (client.longitude !== undefined) clientData.longitude = client.longitude;
    if (client.documentNumber !== undefined) clientData.document_number = client.documentNumber;
    if (client.zoneId !== undefined) clientData.zone_id = client.zoneId;

    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await logAudit('update', 'clients', data.id, data.name);

    return { client: toCamelCase(data) };
  },

  async delete(id: string) {
    // Get client name before deleting
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) throw error;

    // Log audit
    await logAudit('delete', 'clients', id, client?.name);

    return { success: true };
  },
};

// Plans API
export const plansAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;

    return { plans: data };
  },

  async create(plan: any) {
    const planData = {
      name: plan.name,
      price: plan.price,
      download_speed: plan.downloadSpeed || plan.download_speed || '',
      upload_speed: plan.uploadSpeed || plan.upload_speed || '',
      features: plan.features || [],
      popular: plan.popular || false,
    };

    const { data, error } = await supabase
      .from('plans')
      .insert([planData])
      .select()
      .single();

    if (error) throw error;

    return { plan: data };
  },

  async update(id: string, plan: any) {
    const planData: any = {};
    if (plan.name !== undefined) planData.name = plan.name;
    if (plan.price !== undefined) planData.price = plan.price;
    if (plan.downloadSpeed !== undefined) planData.download_speed = plan.downloadSpeed;
    if (plan.uploadSpeed !== undefined) planData.upload_speed = plan.uploadSpeed;
    if (plan.features !== undefined) planData.features = plan.features;
    if (plan.popular !== undefined) planData.popular = plan.popular;

    const { data, error } = await supabase
      .from('plans')
      .update(planData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { plan: data };
  },

  async delete(id: string) {
    const { error } = await supabase.from('plans').delete().eq('id', id);

    if (error) throw error;

    return { success: true };
  },
};

// Invoices API
export const invoicesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { invoices: toCamelCase(data) };
  },

  async getByClient(clientId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { invoices: toCamelCase(data) };
  },

  async create(invoice: any) {
    console.log('=== API create() - Datos recibidos del formulario ===', invoice);
    
    const invoiceData = {
      client_id: invoice.clientId,
      client_name: invoice.clientName,
      amount: invoice.amount,
      description: invoice.description,
      status: invoice.status || 'pending',
      due_date: invoice.dueDate,
      paid_date: invoice.paidDate,
    };

    console.log('=== API create() - Datos a insertar en Supabase ===', invoiceData);

    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (error) throw error;

    return { invoice: toCamelCase(data) };
  },

  async update(id: string, invoice: any) {
    const invoiceData: any = {};
    if (invoice.amount !== undefined) invoiceData.amount = invoice.amount;
    if (invoice.description !== undefined) invoiceData.description = invoice.description;
    if (invoice.status !== undefined) invoiceData.status = invoice.status;
    if (invoice.dueDate !== undefined) invoiceData.due_date = invoice.dueDate;
    if (invoice.paidDate !== undefined) invoiceData.paid_date = invoice.paidDate;

    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { invoice: toCamelCase(data) };
  },

  async delete(id: string) {
    const { error } = await supabase.from('invoices').delete().eq('id', id);

    if (error) throw error;

    return { success: true };
  },
};

// Initialize data
export const initData = async () => {
  // Check if we already have data
  const { count } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log('Data already exists');
    return { message: 'Data already initialized' };
  }

  console.log('No initial data - use the UI to add clients and plans');
  return { message: 'Use the UI to add initial data' };
};