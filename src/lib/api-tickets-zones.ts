import { supabase } from './supabase';
import { authService } from './auth';
import type { Ticket, TicketComment, Zone, Payment, Invoice, TicketInput, TicketCommentInput, ZoneInput } from './supabase';

// Helper to convert snake_case to camelCase
function toCamelCase(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
  }
  return newObj;
}

// Helper to convert camelCase to snake_case
function toSnakeCase(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key]);
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

  async create(ticket: TicketInput) {
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

  async update(id: string, ticket: TicketInput) {
    const ticketData: Record<string, unknown> = {};
    if (ticket.title !== undefined) ticketData.title = ticket.title;
    if (ticket.description !== undefined) ticketData.description = ticket.description;
    if (ticket.category !== undefined) ticketData.category = ticket.category;
    if (ticket.priority !== undefined) ticketData.priority = ticket.priority;
    if (ticket.status !== undefined) ticketData.status = ticket.status;
    if (ticket.assigned_to !== undefined) ticketData.assigned_to = ticket.assigned_to;
    if ((ticket as Record<string, unknown>).assignedTo !== undefined) ticketData.assigned_to = (ticket as Record<string, unknown>).assignedTo;
    if (ticket.scheduled_visit_date !== undefined) ticketData.scheduled_visit_date = ticket.scheduled_visit_date;
    if ((ticket as Record<string, unknown>).scheduledVisitDate !== undefined) ticketData.scheduled_visit_date = (ticket as Record<string, unknown>).scheduledVisitDate;
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

  async create(comment: TicketCommentInput) {
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

  async create(zone: ZoneInput) {
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

  async update(id: string, zone: ZoneInput) {
    const zoneData: Record<string, unknown> = {};
    if (zone.name !== undefined) zoneData.name = zone.name;
    if (zone.description !== undefined) zoneData.description = zone.description;
    if (zone.color !== undefined) zoneData.color = zone.color;
    if (zone.center_latitude !== undefined) zoneData.center_latitude = zone.center_latitude;
    if ((zone as Record<string, unknown>).centerLatitude !== undefined) zoneData.center_latitude = (zone as Record<string, unknown>).centerLatitude;
    if (zone.center_longitude !== undefined) zoneData.center_longitude = zone.center_longitude;
    if ((zone as Record<string, unknown>).centerLongitude !== undefined) zoneData.center_longitude = (zone as Record<string, unknown>).centerLongitude;

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

  // Procesar pago con excedente - aplica automáticamente a siguientes facturas
  async createWithExcess(
    clientId: string,
    invoiceId: string,
    totalAmount: number,
    paymentMethod: string,
    paymentReference?: string,
    notes?: string
  ) {
    const currentUser = authService.getCurrentUser();
    const paymentsCreated: Payment[] = [];
    const invoicesUpdated: Invoice[] = [];

    try {
      // 1. Obtener la factura actual con validación
      const { data: currentInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw new Error(`Error al obtener factura: ${invoiceError.message}`);
      if (!currentInvoice) throw new Error('Factura no encontrada');

      // Calcular balance actual de forma segura
      const amountPaid = currentInvoice.amount_paid || 0;
      const currentBalance = currentInvoice.balance !== null && currentInvoice.balance !== undefined
        ? currentInvoice.balance
        : currentInvoice.amount - amountPaid;

      if (currentBalance <= 0) {
        throw new Error('La factura ya está completamente pagada');
      }

      let remainingAmount = totalAmount;

      // 2. Aplicar pago a la factura actual
      const amountForCurrentInvoice = Math.min(remainingAmount, currentBalance);

      if (amountForCurrentInvoice > 0) {
        const paymentData = {
          invoice_id: invoiceId,
          client_id: clientId,
          amount: amountForCurrentInvoice,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          notes: notes,
          paid_by: currentUser?.id,
          payment_date: new Date().toISOString().split('T')[0],
        };

        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .insert([paymentData])
          .select()
          .single();

        if (paymentError) throw new Error(`Error al crear pago: ${paymentError.message}`);
        paymentsCreated.push(payment);

        // Actualizar factura actual
        const newAmountPaid = amountPaid + amountForCurrentInvoice;
        const newBalance = currentInvoice.amount - newAmountPaid;
        const newStatus = newBalance <= 0 ? 'paid' : 'pending';

        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            amount_paid: newAmountPaid,
            balance: newBalance,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', invoiceId);

        if (updateError) throw new Error(`Error al actualizar factura: ${updateError.message}`);

        invoicesUpdated.push({ ...currentInvoice, amount_paid: newAmountPaid, balance: newBalance, status: newStatus });

        await logAudit('create', 'payments', payment.id, `Pago de $${amountForCurrentInvoice}`);
        remainingAmount -= amountForCurrentInvoice;
      }

      // 3. Si hay excedente, obtener siguientes facturas pendientes
      if (remainingAmount > 0) {
        const { data: pendingInvoices, error: pendingError } = await supabase
          .from('invoices')
          .select('*')
          .eq('client_id', clientId)
          .neq('id', invoiceId)
          .in('status', ['pending', 'overdue'])
          .order('due_date', { ascending: true });

        if (pendingError) throw new Error(`Error al obtener facturas pendientes: ${pendingError.message}`);

        // 4. Aplicar excedente a las siguientes facturas
        for (const invoice of pendingInvoices || []) {
          if (remainingAmount <= 0) break;

          const invoiceAmountPaid = invoice.amount_paid || 0;
          const invoiceBalance = invoice.balance !== null && invoice.balance !== undefined
            ? invoice.balance
            : invoice.amount - invoiceAmountPaid;

          if (invoiceBalance <= 0) continue;

          const amountForInvoice = Math.min(remainingAmount, invoiceBalance);

          const paymentData = {
            invoice_id: invoice.id,
            client_id: clientId,
            amount: amountForInvoice,
            payment_method: paymentMethod,
            payment_reference: paymentReference,
            notes: `Pago aplicado automáticamente desde excedente`,
            paid_by: currentUser?.id,
            payment_date: new Date().toISOString().split('T')[0],
          };

          const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert([paymentData])
            .select()
            .single();

          if (paymentError) throw new Error(`Error al crear pago excedente: ${paymentError.message}`);
          paymentsCreated.push(payment);

          // Actualizar factura
          const newInvoiceAmountPaid = invoiceAmountPaid + amountForInvoice;
          const newInvoiceBalance = invoice.amount - newInvoiceAmountPaid;
          const newInvoiceStatus = newInvoiceBalance <= 0 ? 'paid' : 'pending';

          const { error: updateError } = await supabase
            .from('invoices')
            .update({
              amount_paid: newInvoiceAmountPaid,
              balance: newInvoiceBalance,
              status: newInvoiceStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', invoice.id);

          if (updateError) throw new Error(`Error al actualizar factura excedente: ${updateError.message}`);

          invoicesUpdated.push({ ...invoice, amount_paid: newInvoiceAmountPaid, balance: newInvoiceBalance, status: newInvoiceStatus });

          await logAudit('create', 'payments', payment.id, `Pago automático de $${amountForInvoice}`);
          remainingAmount -= amountForInvoice;
        }
      }

      // 5. Si aún queda dinero, guardarlo como saldo a favor
      if (remainingAmount > 0) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('credit_balance')
          .eq('id', clientId)
          .single();

        if (clientError) {
          // Verificar si es error de columna faltante
          if (clientError.code === '42703') {
            throw new Error(
              'La columna "credit_balance" no existe en la tabla clients. ' +
              'Ejecuta el script ADD_CREDIT_BALANCE.sql en SQL Editor de Supabase.'
            );
          }
          throw new Error(`Error al obtener cliente: ${clientError.message}`);
        }

        const currentCreditBalance = client?.credit_balance || 0;
        const newCreditBalance = currentCreditBalance + remainingAmount;

        const { error: updateError } = await supabase
          .from('clients')
          .update({ credit_balance: newCreditBalance })
          .eq('id', clientId);

        if (updateError) throw new Error(`Error al actualizar saldo a favor: ${updateError.message}`);

        await logAudit('update', 'clients', clientId, `Saldo a favor actualizado: $${newCreditBalance}`);
      }

      return {
        success: true,
        paymentsCreated: toCamelCase(paymentsCreated),
        invoicesUpdated: toCamelCase(invoicesUpdated),
        creditBalanceAdded: remainingAmount > 0 ? remainingAmount : 0,
        totalApplied: totalAmount - remainingAmount,
        remainingAmount,
      };

    } catch (error) {
      // Log del error pero no lo imprimimos en consola en producción
      await logAudit('create', 'payments', 'error', `Error en pago excedente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    }
  },

  async delete(id: string) {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },

  // Obtener todos los pagos de una fecha específica
  async getByDate(date: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        clients:client_id (
          name,
          email,
          phone
        ),
        invoices:invoice_id (
          description,
          amount
        )
      `)
      .eq('payment_date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { payments: toCamelCase(data) };
  },

  // Obtener todos los pagos de hoy
  async getToday() {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDate(today);
  },
};