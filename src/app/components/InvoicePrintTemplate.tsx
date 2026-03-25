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
          <span>{invoice.client_name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="bold">Fecha:</span>
          <span>{new Date(invoice.created_at).toLocaleDateString('es-ES')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span className="bold">Vencimiento:</span>
          <span>{new Date(invoice.due_date).toLocaleDateString('es-ES')}</span>
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
      <title>Factura #${invoice.id.slice(0, 8)}</title>
      <style>
        @page { size: 48mm 297mm; margin: 0; }
        body {
          font-family: "Courier New", Courier, monospace;
          width: 48mm;
          margin: 0;
          padding: 2mm;
          font-size: 10px;
          line-height: 1.2;
        }
        .header { text-align: center; margin-bottom: 5mm; border-bottom: 1px dashed #000; padding-bottom: 2mm; }
        .header h1 { font-size: 14px; margin: 0; text-transform: uppercase; }
        .header p { margin: 2px 0; font-size: 9px; }

        .section { margin-bottom: 4mm; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .bold { font-weight: bold; }

        .total-row { border-top: 1px double #000; margin-top: 2mm; padding-top: 2mm; }
        .amount-big { font-size: 14px; font-weight: bold; }

        .status-tag {
          border: 1px solid #000;
          padding: 1px 4px;
          display: inline-block;
          text-transform: uppercase;
          font-size: 9px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Digital+</h1>
        <p>Servicio de Internet</p>
        <p>Fecha: ${now.toLocaleDateString('es-ES')}</p>
      </div>

      <div class="section">
        <div class="info-row">
          <span class="bold">Factura:</span>
          <span>#${invoice.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="bold">Cliente:</span>
          <span>${invoice.client_name}</span>
        </div>
        <div class="info-row">
          <span class="bold">Fecha:</span>
          <span>${new Date(invoice.created_at).toLocaleDateString('es-ES')}</span>
        </div>
        <div class="info-row">
          <span class="bold">Vencimiento:</span>
          <span>${new Date(invoice.due_date).toLocaleDateString('es-ES')}</span>
        </div>
      </div>

      <div class="section">
        <div class="bold">Descripción:</div>
        <div>${invoice.description}</div>
      </div>

      <div class="total-row" style="text-align: center;">
        <div class="amount-big">Total: $${invoice.amount?.toFixed(2)}</div>
        ${invoice.amountPaid > 0 ? `<div>Pagado: $${invoice.amountPaid?.toFixed(2)}</div>` : ''}
        ${invoice.balance > 0 ? `<div>Saldo: $${invoice.balance?.toFixed(2)}</div>` : ''}
      </div>

      <div style="text-align: center; margin-top: 4mm;">
        <span class="status-tag">
          ${invoice.status === 'paid' ? 'PAGADO' : invoice.status === 'pending' ? 'PENDIENTE' : 'VENCIDO'}
        </span>
      </div>

      <div style="text-align: center; margin-top: 5mm; font-size: 8px;">
        <p>Gracias por su preferencia</p>
        <p>Digital+ - Servicio de Internet</p>
      </div>
    </body>
    </html>
  `;
};