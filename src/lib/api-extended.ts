import { supabase } from './supabase';
import { authService } from './auth';

// ==================== AUDIT LOGGING ====================

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
    // Don't throw - audit logging shouldn't break the main operation
  }
}

// ==================== INVOICE EXTENSIONS ====================

export const invoicesExtendedAPI = {
  // Register payment for an invoice
  async registerPayment(
    invoiceId: string,
    paymentData: {
      paymentMethod: string;
      paymentReference?: string;
      notes?: string;
    }
  ) {
    const currentUser = authService.getCurrentUser();

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: paymentData.paymentMethod,
        payment_reference: paymentData.paymentReference,
        paid_by: currentUser?.id,
        notes: paymentData.notes,
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    await logAudit('update', 'invoices', invoiceId, `Pago registrado`);

    return { invoice: data };
  },

  // Generate invoice for a specific client
  async generateForClient(clientId: string) {
    // Get client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) throw clientError;

    if (!client.monthly_fee || client.monthly_fee <= 0) {
      throw new Error('El cliente no tiene una tarifa mensual configurada');
    }

    // Calculate due date (10th of next month)
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 10);

    const invoiceData = {
      client_id: clientId,
      client_name: client.name,
      amount: client.monthly_fee,
      description: `Factura mensual - ${client.plan_name || 'Servicio'}`,
      status: 'pending',
      due_date: dueDate.toISOString().split('T')[0],
      is_monthly_auto: false, // Manual generation
    };

    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (error) throw error;

    await logAudit('create', 'invoices', data.id, `Factura para ${client.name}`);

    return { invoice: data };
  },

  // Generate monthly invoices for all active clients
  async generateMonthlyInvoices() {
    const { data, error } = await supabase.rpc('generate_monthly_invoices', {
      cutoff_day: 10,
    });

    if (error) throw error;

    await logAudit('create', 'invoices', 'bulk', `Facturas mensuales generadas (${data?.length || 0})`);

    return { invoices: data || [], count: data?.length || 0 };
  },

  // Print invoice (generate printable HTML)
  getPrintableInvoice(invoice: any, client?: any) {
    const now = new Date();
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura #${invoice.id.slice(0, 8)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { color: #2563eb; margin: 0; }
          .info { margin-bottom: 30px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .info-label { font-weight: bold; }
          .amount { font-size: 24px; color: #2563eb; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f3f4f6; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          .status { padding: 4px 12px; border-radius: 4px; display: inline-block; }
          .status-paid { background-color: #10b981; color: white; }
          .status-pending { background-color: #f59e0b; color: white; }
          .status-overdue { background-color: #ef4444; color: white; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="no-print" onclick="window.print()" style="padding: 10px 20px; margin-bottom: 20px; cursor: pointer;">
          Imprimir Factura
        </button>
        
        <div class="header">
          <h1>Digital+ ISP</h1>
          <p>Sistema de Gestión de TV e Internet</p>
        </div>

        <div class="info">
          <div class="info-row">
            <div><span class="info-label">Factura #:</span> ${invoice.id.slice(0, 8).toUpperCase()}</div>
            <div><span class="info-label">Fecha:</span> ${new Date(invoice.created_at).toLocaleDateString('es-ES')}</div>
          </div>
          <div class="info-row">
            <div><span class="info-label">Cliente:</span> ${invoice.client_name || client?.name || 'N/A'}</div>
            <div><span class="info-label">Estado:</span> 
              <span class="status status-${invoice.status}">
                ${invoice.status === 'paid' ? 'Pagado' : invoice.status === 'pending' ? 'Pendiente' : 'Vencido'}
              </span>
            </div>
          </div>
          <div class="info-row">
            <div><span class="info-label">Fecha de Vencimiento:</span> ${new Date(invoice.due_date).toLocaleDateString('es-ES')}</div>
            ${invoice.paid_date ? `<div><span class="info-label">Fecha de Pago:</span> ${new Date(invoice.paid_date).toLocaleDateString('es-ES')}</div>` : ''}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th style="text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.description || 'Servicio mensual'}</td>
              <td style="text-align: right;">$${Number(invoice.amount).toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th>TOTAL</th>
              <th style="text-align: right;" class="amount">$${Number(invoice.amount).toFixed(2)}</th>
            </tr>
          </tfoot>
        </table>

        ${invoice.payment_method ? `
          <div class="info">
            <div class="info-row">
              <div><span class="info-label">Método de Pago:</span> ${invoice.payment_method}</div>
              ${invoice.payment_reference ? `<div><span class="info-label">Referencia:</span> ${invoice.payment_reference}</div>` : ''}
            </div>
            ${invoice.notes ? `<div><span class="info-label">Notas:</span> ${invoice.notes}</div>` : ''}
          </div>
        ` : ''}

        <div class="footer">
          <p>Gracias por su preferencia</p>
          <p>Digital+ ISP - Conectando tu mundo</p>
          <p>Generado el: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}</p>
        </div>
      </body>
      </html>
    `;

    return html;
  },
};

// ==================== BATCH OPERATIONS ====================

export const batchOperationsAPI = {
  // Update overdue invoices
  async updateOverdueInvoices() {
    const { data, error } = await supabase.rpc('update_overdue_invoices');

    if (error) throw error;

    return { updated: data || [], count: data?.length || 0 };
  },

  // Update delinquent clients
  async updateDelinquentClients() {
    const { data, error } = await supabase.rpc('update_delinquent_clients');

    if (error) throw error;

    return { updated: data || [], count: data?.length || 0 };
  },

  // Run all maintenance tasks
  async runMaintenance() {
    const overdueInvoices = await this.updateOverdueInvoices();
    const delinquentClients = await this.updateDelinquentClients();

    await logAudit(
      'update',
      'system',
      'maintenance',
      `Mantenimiento: ${overdueInvoices.count} facturas vencidas, ${delinquentClients.count} clientes morosos`
    );

    return {
      overdueInvoices: overdueInvoices.count,
      delinquentClients: delinquentClients.count,
    };
  },
};

// ==================== AUDIT LOGS ====================

export const auditLogsAPI = {
  async getAll(limit = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { logs: data };
  },

  async getByUser(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { logs: data };
  },

  async getByEntity(entityType: string, entityId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { logs: data };
  },
};

// Export the logging function for use in other APIs
export { logAudit };
