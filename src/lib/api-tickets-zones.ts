import { supabase } from './supabase';
import { authService } from './auth';
import type { Ticket, TicketComment, Zone, Payment } from './supabase';

// Helper to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  
  const newObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = toCamelCase(obj[key]);
  }
  return newObj;
}

// Helper to convert camelCase to snake_case
function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  
  const newObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[snakeKey] = toSnakeCase(obj[key]);
  }
  return newObj;
}

// Audit logging helper
async function logAudit(
  action: 'create' | 'update' | 'delete',
  entityType: string,
  entityId: string,
  entityName?: string
) {
  try {
    const currentUser = authService.getCurrentUser();
    await supabase.from('audit_logs').insert([
      {
        user_id: currentUser?.id,
        user_email: currentUser?.email || 'anonymous',
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
      },
    ]);
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

// ==================== TICKETS API ====================

export const ticketsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { tickets: toCamelCase(data) };
  },

  async getOne(id: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { ticket: toCamelCase(data) };
  },

  async getByClient(clientId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { tickets: toCamelCase(data) };
  },

  async create(ticket: Partial<Ticket>) {
    const currentUser = authService.getCurrentUser();
    
    const ticketData = {
      client_id: ticket.clientId,
      client_name: ticket.clientName,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority || 'medium',
      status: ticket.status || 'open',
      assigned_to: ticket.assignedTo,
      reported_by: currentUser?.id,
      scheduled_visit_date: ticket.scheduledVisitDate,
      notes: ticket.notes,
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();

    if (error) throw error;

    await logAudit('create', 'tickets', data.id, ticket.title);
    return { ticket: toCamelCase(data) };
  },

  async update(id: string, ticket: Partial<Ticket>) {
    const ticketData: any = {};
    if (ticket.title !== undefined) ticketData.title = ticket.title;
    if (ticket.description !== undefined) ticketData.description = ticket.description;
    if (ticket.category !== undefined) ticketData.category = ticket.category;
    if (ticket.priority !== undefined) ticketData.priority = ticket.priority;
    if (ticket.status !== undefined) ticketData.status = ticket.status;
    if (ticket.assignedTo !== undefined) ticketData.assigned_to = ticket.assignedTo;
    if (ticket.scheduledVisitDate !== undefined) ticketData.scheduled_visit_date = ticket.scheduledVisitDate;
    if (ticket.notes !== undefined) ticketData.notes = ticket.notes;

    // If status is being changed to resolved or closed, set resolved_at
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticketData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tickets')
      .update(ticketData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit('update', 'tickets', data.id, data.title);
    return { ticket: toCamelCase(data) };
  },

  async delete(id: string) {
    const { data: ticket } = await supabase
      .from('tickets')
      .select('title')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('tickets').delete().eq('id', id);

    if (error) throw error;

    await logAudit('delete', 'tickets', id, ticket?.title);
    return { success: true };
  },
};

// ==================== TICKET COMMENTS API ====================

export const ticketCommentsAPI = {
  async getByTicket(ticketId: string) {
    const { data, error } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { comments: toCamelCase(data) };
  },

  async create(comment: Partial<TicketComment>) {
    const currentUser = authService.getCurrentUser();

    const commentData = {
      ticket_id: comment.ticketId,
      user_id: currentUser?.id,
      user_name: currentUser?.full_name || 'Usuario',
      comment: comment.comment,
      is_internal: comment.isInternal || false,
    };

    const { data, error } = await supabase
      .from('ticket_comments')
      .insert([commentData])
      .select()
      .single();

    if (error) throw error;
    return { comment: toCamelCase(data) };
  },

  async delete(id: string) {
    const { error } = await supabase.from('ticket_comments').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};

// ==================== ZONES API ====================

export const zonesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return { zones: toCamelCase(data) };
  },

  async getOne(id: string) {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { zone: toCamelCase(data) };
  },

  async create(zone: Partial<Zone>) {
    const zoneData = {
      name: zone.name,
      description: zone.description,
      color: zone.color || '#3B82F6',
      center_latitude: zone.centerLatitude,
      center_longitude: zone.centerLongitude,
    };

    const { data, error } = await supabase
      .from('zones')
      .insert([zoneData])
      .select()
      .single();

    if (error) throw error;

    await logAudit('create', 'zones', data.id, zone.name);
    return { zone: toCamelCase(data) };
  },

  async update(id: string, zone: Partial<Zone>) {
    const zoneData: any = {};
    if (zone.name !== undefined) zoneData.name = zone.name;
    if (zone.description !== undefined) zoneData.description = zone.description;
    if (zone.color !== undefined) zoneData.color = zone.color;
    if (zone.centerLatitude !== undefined) zoneData.center_latitude = zone.centerLatitude;
    if (zone.centerLongitude !== undefined) zoneData.center_longitude = zone.centerLongitude;

    const { data, error } = await supabase
      .from('zones')
      .update(zoneData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit('update', 'zones', data.id, data.name);
    return { zone: toCamelCase(data) };
  },

  async delete(id: string) {
    const { data: zone } = await supabase
      .from('zones')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('zones').delete().eq('id', id);

    if (error) throw error;

    await logAudit('delete', 'zones', id, zone?.name);
    return { success: true };
  },

  async getClientsInZone(zoneId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('zone_id', zoneId)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) throw error;
    return { clients: toCamelCase(data) };
  },
};

// ==================== PAYMENTS API ====================

export const paymentsAPI = {
  async getByInvoice(invoiceId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return { payments: toCamelCase(data) };
  },

  async create(payment: Partial<Payment>) {
    const currentUser = authService.getCurrentUser();

    const paymentData = {
      invoice_id: payment.invoiceId,
      client_id: payment.clientId,
      amount: payment.amount,
      payment_method: payment.paymentMethod,
      payment_reference: payment.paymentReference,
      notes: payment.notes,
      paid_by: currentUser?.id,
      payment_date: payment.paymentDate || new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;

    await logAudit('create', 'payments', data.id, `Pago de $${payment.amount}`);
    return { payment: toCamelCase(data) };
  },

  async delete(id: string) {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
};
