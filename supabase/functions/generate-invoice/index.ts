import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate PDF-like HTML invoice that can be printed/saved as PDF
function generateInvoiceHTML(order: any, items: any[]): string {
  const orderDate = new Date(order.paid_at || order.created_at);
  const formattedDate = orderDate.toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${item.title_snapshot}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.sku_snapshot}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.unit_price_eur.toFixed(2)} €</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">${(item.unit_price_eur * item.quantity).toFixed(2)} €</td>
    </tr>
  `).join('');

  const vatRate = 0.21;
  const netTotal = order.subtotal_eur / (1 + vatRate);
  const vatAmount = order.subtotal_eur - netTotal;

  return `
<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sąskaita faktūra ${order.invoice_number || order.order_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 14px;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.5;
    }
    
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1e4ed8;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #1e4ed8;
    }
    
    .invoice-info {
      text-align: right;
    }
    
    .invoice-number {
      font-size: 20px;
      font-weight: 600;
      color: #1e4ed8;
    }
    
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .party h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .party-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .items-table th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .items-table th:nth-child(3),
    .items-table th:nth-child(4),
    .items-table th:nth-child(5) {
      text-align: right;
    }
    
    .totals {
      display: flex;
      justify-content: flex-end;
    }
    
    .totals-table {
      width: 300px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    
    .totals-row.final {
      border-top: 2px solid #1e4ed8;
      padding-top: 12px;
      margin-top: 8px;
      font-size: 18px;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    @media print {
      body { print-color-adjust: exact; }
      .invoice { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">IBRIX</div>
      <div class="invoice-info">
        <div class="invoice-number">${order.invoice_number || order.order_number}</div>
        <div>${formattedDate}</div>
      </div>
    </div>
    
    <div class="parties">
      <div class="party">
        <h3>Pardavėjas</h3>
        <div class="party-name">IBRIX</div>
        <div>info@ibrix.lt</div>
        <div>Lietuva</div>
      </div>
      
      <div class="party">
        <h3>Pirkėjas</h3>
        ${order.wants_invoice && order.invoice_company_name ? `
          <div class="party-name">${order.invoice_company_name}</div>
          ${order.invoice_vat_code ? `<div>Įmonės/PVM kodas: ${order.invoice_vat_code}</div>` : ''}
          ${order.invoice_address ? `<div>${order.invoice_address}</div>` : ''}
        ` : `
          <div class="party-name">${order.first_name} ${order.last_name}</div>
        `}
        <div>${order.email}</div>
        ${order.phone ? `<div>${order.phone}</div>` : ''}
      </div>
    </div>
    
    <table class="items-table">
      <thead>
        <tr>
          <th>Prekė</th>
          <th>SKU</th>
          <th style="text-align:center;">Kiekis</th>
          <th style="text-align:right;">Vnt. kaina</th>
          <th style="text-align:right;">Suma</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-table">
        <div class="totals-row">
          <span>Tarpinė suma:</span>
          <span>${order.subtotal_eur.toFixed(2)} €</span>
        </div>
        ${order.discount_eur > 0 ? `
          <div class="totals-row" style="color:#16a34a;">
            <span>Nuolaida:</span>
            <span>-${order.discount_eur.toFixed(2)} €</span>
          </div>
        ` : ''}
        <div class="totals-row">
          <span>Pristatymas:</span>
          <span>${order.shipping_eur > 0 ? order.shipping_eur.toFixed(2) + ' €' : 'Nemokamas'}</span>
        </div>
        <div class="totals-row">
          <span>PVM (21%):</span>
          <span>${vatAmount.toFixed(2)} €</span>
        </div>
        <div class="totals-row final">
          <span>Viso:</span>
          <span>${order.total_eur.toFixed(2)} €</span>
        </div>
      </div>
    </div>
    
    ${order.preorder_flag ? `
      <div style="margin-top:30px;padding:16px;background:#fef3c7;border-radius:8px;">
        <strong>Pre-order užsakymas</strong>
        <p style="margin:4px 0 0;color:#92400e;">
          Sumokėtas depozitas: ${order.deposit_total_eur.toFixed(2)} €. 
          Likusi suma (${order.balance_total_eur.toFixed(2)} €) bus prašoma apmokėti prieš siuntimą.
        </p>
      </div>
    ` : ''}
    
    <div class="footer">
      <p>Ačiū, kad perkate IBRIX!</p>
      <p>ibrix.lt | info@ibrix.lt</p>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { orderId, action } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Items fetch error:', itemsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch order items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate invoice number if not exists
    if (!order.invoice_number && order.wants_invoice) {
      const { data: invoiceNumber, error: invoiceError } = await supabase.rpc('generate_invoice_number');
      
      if (!invoiceError && invoiceNumber) {
        await supabase
          .from('orders')
          .update({ invoice_number: invoiceNumber })
          .eq('id', orderId);
        
        order.invoice_number = invoiceNumber;
      }
    }

    // Generate HTML invoice
    const invoiceHTML = generateInvoiceHTML(order, items || []);

    if (action === 'html') {
      return new Response(invoiceHTML, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Default: return invoice data and HTML for frontend rendering
    return new Response(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        invoice_number: order.invoice_number,
        created_at: order.created_at,
        total_eur: order.total_eur,
        wants_invoice: order.wants_invoice,
      },
      html: invoiceHTML,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Invoice generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
