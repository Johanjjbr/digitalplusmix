import React from 'react';

interface InvoicePrintTemplateProps {
  invoice: any;
  client?: any;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({ invoice, client }) => {
  const now = new Date();

  return (
    <div style={{
      fontFamily: '"Courier New", Courier, monospace',
      width: '48mm',
      margin: '0',
      padding: '2mm',
      fontSize: '10px',
      lineHeight: '1.2',
      backgroundColor: 'white',
      color: 'black'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '5mm',
        borderBottom: '1px dashed #000',
        paddingBottom: '2mm'
      }}>
        <h1 style={{ fontSize: '14px', margin: '0', textTransform: 'uppercase' }}>
          Digital+
        </h1>
        <p style={{ margin: '2px 0', fontSize: '9px' }}>
          Servicio de Internet
        </p>
        <p style={{ margin: '2px 0', fontSize: '9px' }}>
          Fecha: {now.toLocaleDateString('es-ES')}
        </p>
      </div>

      {/* Invoice Info */}
      <div style={{ marginBottom: '4mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="bold">Factura:</span>
          <span>#{invoice.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="bold">Cliente:</span>
          <span>{invoice.clientName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="bold">Fecha:</span>
          <span>{new Date(invoice.createdAt).toLocaleDateString('es-ES')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="bold">Vencimiento:</span>
          <span>{new Date(invoice.dueDate).toLocaleDateString('es-ES')}</span>
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: '4mm' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Descripción:</div>
        <div>{invoice.description}</div>
      </div>

      {/* Amount */}
      <div style={{
        borderTop: '1px double #000',
        marginTop: '2mm',
        paddingTop: '2mm',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Total: ${invoice.amount?.toFixed(2)}
        </div>
        {invoice.amountPaid > 0 && (
          <div style={{ fontSize: '10px', marginTop: '2px' }}>
            Pagado: ${invoice.amountPaid?.toFixed(2)}
          </div>
        )}
        {invoice.balance > 0 && (
          <div style={{ fontSize: '10px', marginTop: '2px' }}>
            Saldo: ${invoice.balance?.toFixed(2)}
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{
        textAlign: 'center',
        marginTop: '4mm',
        border: '1px solid #000',
        padding: '1px 4px',
        display: 'inline-block',
        textTransform: 'uppercase',
        fontSize: '9px'
      }}>
        {invoice.status === 'paid' ? 'PAGADO' : invoice.status === 'pending' ? 'PENDIENTE' : 'VENCIDO'}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '5mm',
        fontSize: '8px'
      }}>
        <p>Gracias por su preferencia</p>
        <p>Digital+ - Servicio de Internet</p>
      </div>
    </div>
  );
};

// Function to get printable HTML for the template
export const getPrintableInvoiceHTML = (invoice: any, client?: any): string => {
  const now = new Date();
  return `
    <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura Digital #${invoice.id.slice(0, 8)}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f9f9f9;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
          .header h1 { color: #007bff; margin: 0; }
          .header p { margin: 5px 0; color: #666; }
          
          .info-section { margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .bold { font-weight: bold; }
          
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .table th { background-color: #f8f9fa; font-weight: bold; }
          
          .total-section { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
          
          .status-badge { 
            display: inline-block; 
            padding: 5px 15px; 
            border-radius: 20px; 
            color: white; 
            font-weight: bold;
            text-transform: uppercase;
            font-size: 12px;
          }
          .status-paid { background-color: #28a745; }
          .status-pending { background-color: #ffc107; color: #000; }
          .status-overdue { background-color: #dc3545; }
          
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Digital+</h1>
            <p>Servicio de Internet</p>
            <p>Factura Digital</p>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="bold">Factura:</span>
              <span>#${invoice.id.slice(0, 8).toUpperCase()}</span>
            </div>
<div class="info-row">
  <span class="bold">Cliente:</span>
  <span>${invoice.client_name || client?.name || 'Consumidor Final'}</span>
</div>
${(client?.documentNumber || client?.document_number) ? `
<div class="info-row">
  <span class="bold">Documento:</span>
  <span>${client?.documentNumber || client?.document_number}</span>
</div>` : ''}
<div class="info-row">
  <span class="bold">Fecha de Emisión:</span>
  <span>${new Date(invoice.createdAt || invoice.created_at || now).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
</div>
<div class="info-row">
  <span class="bold">Fecha de Vencimiento:</span>
  <span>${
    (invoice.dueDate || invoice.due_date)
      ? new Date((invoice.dueDate || invoice.due_date) + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'No definida'
  }</span>
</div>
            <div class="info-row">
              <span class="bold">Estado:</span>
              <span class="status-badge ${invoice.status === 'paid' ? 'status-paid' : invoice.status === 'pending' ? 'status-pending' : 'status-overdue'}">
                ${invoice.status === 'paid' ? 'Pagado' : invoice.status === 'pending' ? 'Pendiente' : 'Vencido'}
              </span>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.description || 'Servicio de Internet'}</td>
                <td style="text-align: right;">$${Number(invoice.amount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Total:</span>
              <span>$${Number(invoice.amount).toFixed(2)}</span>
            </div>
            ${invoice.amountPaid ? `
              <div class="info-row" style="font-size: 14px; margin-top: 10px;">
                <span>Pagado:</span>
                <span>$${Number(invoice.amountPaid).toFixed(2)}</span>
              </div>
            ` : ''}
            ${invoice.balance ? `
              <div class="info-row" style="font-size: 14px;">
                <span>Saldo Pendiente:</span>
                <span>$${Number(invoice.balance).toFixed(2)}</span>
              </div>
            ` : ''}
          </div>

          ${invoice.payment_method ? `
            <div class="info-section">
              <div class="bold">Información de Pago:</div>
              <div>Método: ${invoice.payment_method}</div>
              ${invoice.payment_reference ? `<div>Referencia: ${invoice.payment_reference}</div>` : ''}
            </div>
          ` : ''}

          <div class="footer">
            <p>Gracias por elegir Digital Plus Mix</p>
            <p>Para cualquier consulta, contáctenos</p>
            <p>Generado el ${now.toLocaleString('es-ES')}</p>
          </div>
        </div>
      </body>
      </html>
  `;
};