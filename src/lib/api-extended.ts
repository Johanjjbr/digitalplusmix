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
        user_id:     currentUser?.id,
        user_email:  currentUser?.email || 'anonymous',
        action,
        entity_type: entityType,
        entity_id:   entityId,
        entity_name: entityName,
      },
    ]);
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

// ==================== INVOICE EXTENSIONS ====================

interface InvoiceOverrides {
  description?: string;
  amount?:      number;
  dueDate?:     string;
  status?:      'paid' | 'pending' | 'overdue';
  invoiceType?: 'plan' | 'advance' | 'custom';
}

export const invoicesExtendedAPI = {

  async registerPayment(
    invoiceId: string,
    paymentData: {
      paymentMethod:     string;
      paymentReference?: string;
      notes?:            string;
    }
  ) {
    const currentUser = authService.getCurrentUser();

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status:            'paid',
        paid_date:         new Date().toISOString().split('T')[0],
        payment_method:    paymentData.paymentMethod,
        payment_reference: paymentData.paymentReference,
        paid_by:           currentUser?.id,
        notes:             paymentData.notes,
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    await logAudit('update', 'invoices', invoiceId, 'Pago registrado');
    return { invoice: data };
  },

  /**
   * Genera una factura para un cliente aplicando automáticamente
   * el saldo a favor si existe.
   *
   * Si se pasan `overrides`, se usan sus valores (descripción, monto,
   * dueDate) en lugar de los calculados automáticamente. Esto permite
   * que el formulario InvoiceFormDialog controle qué se crea, sin
   * perder la lógica de saldo a favor.
   */
  async generateForClient(clientId: string, overrides: InvoiceOverrides = {}) {
    // 1. Obtener datos del cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError) throw clientError;

    if (!client.monthly_fee || client.monthly_fee <= 0) {
      throw new Error('El cliente no tiene una tarifa mensual configurada');
    }

    // 2. Calcular fecha de vencimiento
    //    - Si el formulario manda un dueDate (advance o custom) se respeta.
    //    - Si no, se usa el día 10 del mes actual (tipo 'plan').
    const now = new Date();
    const fallbackDueDate = new Date(now.getFullYear(), now.getMonth(), 10)
      .toISOString()
      .split('T')[0];

    const dueDate = overrides.dueDate ?? fallbackDueDate;

    // 3. Monto base: el del formulario si viene, si no el del plan
    const baseAmount = overrides.amount ?? client.monthly_fee;

    // 4. Descripción: la del formulario si viene, si no una genérica
    const description =
      overrides.description ??
      `Factura mensual - ${client.plan_name || 'Servicio'} - ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;

    // 5. Aplicar saldo a favor
    let amountPending       = baseAmount;
    let creditBalanceUsed   = 0;
    let newCreditBalance    = client.credit_balance || 0;

    if (newCreditBalance > 0) {
      if (newCreditBalance >= amountPending) {
        // El saldo cubre todo
        creditBalanceUsed = amountPending;
        newCreditBalance -= amountPending;
        amountPending     = 0;
      } else {
        // El saldo cubre solo parte
        creditBalanceUsed  = newCreditBalance;
        amountPending     -= newCreditBalance;
        newCreditBalance   = 0;
      }
    }

    // 6. Construir registro de factura
    const descFinal = creditBalanceUsed > 0
      ? `${description} (Saldo a favor aplicado: $${creditBalanceUsed.toFixed(2)})`
      : description;

    const invoiceData = {
      client_id:       clientId,
      client_name:     client.name,
      amount:          baseAmount,
      description:     descFinal,
      // Si el formulario mandó un status explícito (ej: 'paid') lo respetamos,
      // de lo contrario decidimos según si quedó balance o no.
      status:
        overrides.status === 'paid'
          ? 'paid'
          : amountPending === 0
          ? 'paid'
          : 'pending',
      due_date:        dueDate,
      is_monthly_auto: false,
      amount_paid:     creditBalanceUsed,
      balance:         amountPending,
    };

    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (error) throw error;

    // 7. Actualizar saldo a favor del cliente si se usó algo
    if (creditBalanceUsed > 0) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ credit_balance: newCreditBalance })
        .eq('id', clientId);

      if (updateError) {
        console.error('Error updating credit balance:', updateError);
      }

      await logAudit(
        'update',
        'clients',
        clientId,
        `Saldo a favor aplicado: $${creditBalanceUsed.toFixed(2)}`
      );
    }

    await logAudit('create', 'invoices', data.id, `Factura para ${client.name}`);

    return {
      invoice:          data,
      creditBalanceUsed,
      newCreditBalance,
    };
  },

  async generateMonthlyInvoices() {
    const { data, error } = await supabase.rpc('generate_monthly_invoices');
    if (error) throw error;

    await logAudit(
      'create',
      'invoices',
      'bulk',
      `Facturas mensuales generadas (${data?.length || 0})`
    );

    return { invoices: data || [], count: data?.length || 0 };
  },

  getPrintableInvoice(invoice: any, client?: any) {
    const now = new Date();
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket #${invoice.id.slice(0, 8)}</title>
        <style>
          @page { size: 48mm 297mm; margin: 0; }
          body { font-family: "Courier New", Courier, monospace; width: 48mm; margin: 0; padding: 2mm; font-size: 10px; line-height: 1.2; }
          .header { text-align: center; margin-bottom: 5mm; border-bottom: 1px dashed #000; padding-bottom: 2mm; }
          .header h1 { font-size: 14px; margin: 0; text-transform: uppercase; }
          .header p { margin: 2px 0; font-size: 9px; }
          .section { margin-bottom: 4mm; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .bold { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
          th { border-bottom: 1px dashed #000; text-align: left; font-size: 9px; }
          td { padding: 2mm 0; vertical-align: top; }
          .total-row { border-top: 1px double #000; margin-top: 2mm; padding-top: 2mm; }
          .amount-big { font-size: 14px; font-weight: bold; }
          .status-tag { border: 1px solid #000; padding: 1px 4px; display: inline-block; text-transform: uppercase; font-size: 9px; }
          .footer { text-align: center; margin-top: 6mm; font-size: 9px; border-top: 1px dashed #000; padding-top: 3mm; }
          @media print { .no-print { display: none; } body { padding: 0; margin: 0; } }
        </style>
      </head>
      <body>
        <button class="no-print" onclick="window.print()" style="width:100%;padding:10px;margin-bottom:10px;">IMPRIMIR TICKET</button>
        <div class="header">
          <h1>Digital+ ISP</h1>
          <p>Servicios de Internet y TV</p>
          <p>---------------------------</p>
        </div>
        <div class="section">
          <div class="info-row"><span>TICKET:</span><span class="bold">#${invoice.id.slice(0, 8).toUpperCase()}</span></div>
          <div class="info-row"><span>FECHA:</span><span>${new Date(invoice.created_at || now).toLocaleDateString('es-ES')}</span></div>
          <div class="info-row">
            <span>ESTADO:</span>
            <span class="status-tag">${invoice.status === 'paid' ? 'PAGADO' : invoice.status === 'pending' ? 'PENDIENTE' : 'VENCIDO'}</span>
          </div>
        </div>
        <div class="section"><span class="bold">CLIENTE:</span><br>${invoice.client_name || client?.name || 'Consumidor Final'}</div>
        <table>
          <thead><tr><th>DESC.</th><th style="text-align:right;">TOTAL</th></tr></thead>
          <tbody>
            <tr>
              <td>${invoice.description || 'Servicio Internet'}</td>
              <td style="text-align:right;">$${Number(invoice.amount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <div class="total-row">
          <div class="info-row">
            <span class="bold">TOTAL A PAGAR:</span>
            <span class="amount-big">$${Number(invoice.amount).toFixed(2)}</span>
          </div>
        </div>
        ${invoice.payment_method ? `
          <div class="section" style="margin-top:4mm;">
            <span class="bold">PAGO:</span> ${invoice.payment_method.toUpperCase()}<br>
            ${invoice.payment_reference ? `REF: ${invoice.payment_reference}` : ''}
          </div>` : ''}
        <div class="footer">
          <p>Vence: ${invoice.due_date ? new Date(invoice.due_date + 'T00:00:00').toLocaleDateString('es-ES') : '-'}</p>
          <p>¡Gracias por su pago!</p>
          <p>Digital+ ISP</p>
          <p>${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')} - ${now.toLocaleDateString()}</p>
          <br><p>. . . . . . . . . . . . .</p>
        </div>
      </body>
      </html>
    `;
    return html;
  },
};

// ==================== BATCH OPERATIONS ====================

export const batchOperationsAPI = {
  async updateOverdueInvoices() {
    const { data, error } = await supabase.rpc('update_overdue_invoices');
    if (error) throw error;
    return { updated: data || [], count: data?.length || 0 };
  },

  async updateDelinquentClients() {
    const { data, error } = await supabase.rpc('update_delinquent_clients');
    if (error) throw error;
    return { updated: data || [], count: data?.length || 0 };
  },

  async runMaintenance() {
    const overdueInvoices    = await this.updateOverdueInvoices();
    const delinquentClients  = await this.updateDelinquentClients();

    await logAudit(
      'update',
      'system',
      'maintenance',
      `Mantenimiento: ${overdueInvoices.count} facturas vencidas, ${delinquentClients.count} clientes morosos`
    );

    return {
      overdueInvoices:   overdueInvoices.count,
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

export { logAudit };