const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email for notifications
const ADMIN_EMAIL = 'u.ciciurenas@gmail.com';

// Generate request ID for tracing
const generateRequestId = () => crypto.randomUUID().slice(0, 8);

const log = (requestId: string, step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[SEND-EMAIL][${requestId}][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

// Email templates
function getDepositConfirmedEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, depositEur, balanceEur, totalEur, hasPreorder, etaWeeksMin, etaWeeksMax, trackingToken, items } = data;
  
  const baseUrl = 'https://ibrix.lt';
  const trackingUrl = trackingToken 
    ? `${baseUrl}/siuntos-sekimas/${orderNumber}?token=${trackingToken}`
    : baseUrl;

  const etaText = hasPreorder && etaWeeksMin && etaWeeksMax
    ? `<p style="color:#666;">Numatomas pristatymas: ${etaWeeksMin}-${etaWeeksMax} sav.</p>`
    : '';

  const itemsHtml = items?.map((item: any) => 
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${item.title_snapshot || item.title}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${item.unit_deposit_eur || item.unitDepositEur}€</td>
    </tr>`
  ).join('') || '';

  return {
    subject: `Užsakymas ${orderNumber} - depozitas gautas`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a1a;">Ačiū, ${firstName}!</h1>
        <p>Jūsų užsakymo <strong>${orderNumber}</strong> depozitas sėkmingai gautas.</p>
        
        <div style="background:#f9f9f9;padding:20px;border-radius:8px;margin:20px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd;">Prekė</th>
                <th style="text-align:center;padding:8px;border-bottom:2px solid #ddd;">Kiekis</th>
                <th style="text-align:right;padding:8px;border-bottom:2px solid #ddd;">Depozitas</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        
        <div style="background:#f0f9f0;padding:20px;border-radius:8px;margin:20px 0;">
          <p style="margin:5px 0;"><strong>Sumokėtas depozitas:</strong> ${depositEur}€</p>
          <p style="margin:5px 0;"><strong>Likusi suma (bus prašoma vėliau):</strong> ${balanceEur}€</p>
          <p style="margin:5px 0;font-size:18px;"><strong>Bendra užsakymo suma:</strong> ${totalEur}€</p>
        </div>
        
        ${etaText}
        
        <div style="margin:30px 0;">
          <a href="${trackingUrl}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
            Sekti užsakymą
          </a>
        </div>
        
        <p style="color:#666;font-size:14px;">
          Kai prekė bus paruošta siuntimui, atsiųsime nuorodą apmokėti likusią sumą.
        </p>
        
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;">IBRIX | ibrix.lt</p>
      </div>
    `,
  };
}

function getBalanceRequestEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, balanceEur, paymentUrl } = data;

  return {
    subject: `Užsakymas ${orderNumber} - apmokėkite likusią sumą`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a1a;">Sveiki, ${firstName}!</h1>
        <p>Jūsų užsakymas <strong>${orderNumber}</strong> paruoštas siuntimui.</p>
        
        <div style="background:#fff3cd;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ffc107;">
          <p style="margin:0;font-size:18px;"><strong>Liko apmokėti: ${balanceEur}€</strong></p>
        </div>
        
        <p>Kai apmokėsite likusią sumą, iškart pradėsime siuntimą.</p>
        
        <div style="margin:30px 0;">
          <a href="${paymentUrl}" style="display:inline-block;background:#22c55e;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-size:16px;">
            Apmokėti ${balanceEur}€
          </a>
        </div>
        
        <p style="color:#666;font-size:14px;">
          Jei turite klausimų, susisiekite su mumis: info@ibrix.lt
        </p>
        
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;">IBRIX | ibrix.lt</p>
      </div>
    `,
  };
}

function getBalancePaidEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, amountEur } = data;

  return {
    subject: `Užsakymas ${orderNumber} - mokėjimas gautas`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a1a;">Ačiū, ${firstName}!</h1>
        <p>Jūsų užsakymo <strong>${orderNumber}</strong> likutis <strong>${amountEur}€</strong> sėkmingai gautas.</p>
        
        <div style="background:#f0f9f0;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #22c55e;">
          <p style="margin:0;font-size:16px;">✓ Pradedame ruošti siuntą!</p>
        </div>
        
        <p>Kai išsiųsime, gausite sekimo numerį.</p>
        
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;">IBRIX | ibrix.lt</p>
      </div>
    `,
  };
}

function getShippedEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, trackingNumber, carrierName, trackingUrl } = data;

  return {
    subject: `Užsakymas ${orderNumber} - išsiųsta!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a1a;">Sveiki, ${firstName}!</h1>
        <p>Jūsų užsakymas <strong>${orderNumber}</strong> išsiųstas!</p>
        
        <div style="background:#e0f2fe;padding:20px;border-radius:8px;margin:20px 0;">
          <p style="margin:5px 0;"><strong>Vežėjas:</strong> ${carrierName || 'Kurjeris'}</p>
          ${trackingNumber ? `<p style="margin:5px 0;"><strong>Sekimo numeris:</strong> ${trackingNumber}</p>` : ''}
        </div>
        
        <div style="margin:30px 0;">
          <a href="${trackingUrl}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
            Sekti siuntą
          </a>
        </div>
        
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;">IBRIX | ibrix.lt</p>
      </div>
    `,
  };
}

function getSupportRequestEmail(data: any): { subject: string; html: string } {
  const { orderNumber, requestType, message, userEmail } = data.data || data;

  const requestTypeLabels: Record<string, string> = {
    'return': 'Prekės grąžinimas',
    'missing_parts': 'Trūkstamos detalės',
    'other': 'Kita informacija',
  };

  return {
    subject: `[SUPPORT] Užsakymas ${orderNumber} - ${requestTypeLabels[requestType] || requestType}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a1a;">Nauja kliento užklausa</h1>
        
        <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
          <p style="margin:5px 0;"><strong>Užsakymas:</strong> ${orderNumber}</p>
          <p style="margin:5px 0;"><strong>Kliento el. paštas:</strong> ${userEmail}</p>
          <p style="margin:5px 0;"><strong>Užklausos tipas:</strong> ${requestTypeLabels[requestType] || requestType}</p>
        </div>
        
        <div style="background:#fffbeb;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b;">
          <p style="margin:0;"><strong>Pranešimas:</strong></p>
          <p style="margin:10px 0;white-space:pre-wrap;">${message}</p>
        </div>
        
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;">IBRIX Support System</p>
      </div>
    `,
  };
}

function getGiftCardEmail(data: any): { subject: string; html: string } {
  const { recipientName, senderName, code, amount, personalMessage } = data;

  return {
    subject: `${senderName || 'Draugas'} atsiuntė jums dovanų kuponą!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a1a;">Sveiki, ${recipientName}!</h1>
        <p>${senderName || 'Draugas'} atsiuntė jums IBRIX dovanų kuponą!</p>
        
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:30px;border-radius:12px;margin:20px 0;text-align:center;">
          <p style="margin:0;font-size:14px;opacity:0.9;">IBRIX Dovanų kuponas</p>
          <p style="margin:10px 0;font-size:36px;font-weight:bold;">${amount}€</p>
          <p style="margin:10px 0;font-family:monospace;font-size:20px;background:rgba(255,255,255,0.2);padding:10px;border-radius:6px;">${code}</p>
        </div>
        
        ${personalMessage ? `
          <div style="background:#f9f9f9;padding:20px;border-radius:8px;margin:20px 0;font-style:italic;">
            "${personalMessage}"
          </div>
        ` : ''}
        
        <p>Norėdami panaudoti kuponą:</p>
        <ol>
          <li>Užsiregistruokite arba prisijunkite ibrix.lt</li>
          <li>Eikite į "Mano paskyra" → "Aktyvuoti dovanų kuponą"</li>
          <li>Įveskite kodą: <strong>${code}</strong></li>
        </ol>
        
        <div style="margin:30px 0;">
          <a href="https://ibrix.lt/auth" style="display:inline-block;background:#4f46e5;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;">
            Aktyvuoti kuponą
          </a>
        </div>
        
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;">IBRIX | ibrix.lt</p>
      </div>
    `,
  };
}

function getNewsletterEmail(data: any): { subject: string; html: string } {
  const { firstName, subject, content } = data;

  // Convert markdown-like content to basic HTML
  const htmlContent = content
    .split('\n\n')
    .map((p: string) => `<p style="margin:15px 0;">${p}</p>`)
    .join('');

  return {
    subject: subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a1a;">Sveiki, ${firstName}!</h1>
        
        <div style="margin:20px 0;">
          ${htmlContent}
        </div>
        
        <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">
        <p style="color:#999;font-size:12px;">
          IBRIX | ibrix.lt<br>
          <a href="https://ibrix.lt/account" style="color:#999;">Atsisakyti prenumeratos</a>
        </p>
      </div>
    `,
  };
}

// NEW: Admin order notification email
function getAdminOrderNotificationEmail(data: any): { subject: string; html: string } {
  const { 
    orderNumber, 
    customerName, 
    customerEmail, 
    customerPhone,
    items, 
    subtotalEur, 
    discountEur, 
    shippingEur, 
    totalEur,
    depositEur,
    balanceEur,
    shippingMethod,
    shippingAddress,
    paymentMethod,
    paymentType,
    hasPreorder,
    etaWeeksMin,
    etaWeeksMax,
  } = data;

  const itemsHtml = items?.map((item: any) => 
    `<tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">${item.title_snapshot || item.title}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${item.unit_price_eur || item.unitPriceEur}€</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${((item.unit_price_eur || item.unitPriceEur) * item.quantity).toFixed(2)}€</td>
    </tr>`
  ).join('') || '';

  const addressHtml = shippingAddress?.lockerAddress 
    ? shippingAddress.lockerAddress
    : shippingAddress?.street 
      ? `${shippingAddress.street}, ${shippingAddress.city} ${shippingAddress.postalCode}`
      : 'Nenurodyta';

  return {
    subject: `🛒 Naujas užsakymas ${orderNumber} - ${depositEur}€`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">
        <div style="background:#22c55e;color:white;padding:20px;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;font-size:24px;">🎉 Naujas užsakymas!</h1>
          <p style="margin:10px 0 0;font-size:20px;font-weight:bold;">${orderNumber}</p>
        </div>
        
        <div style="background:#f9f9f9;padding:20px;border:1px solid #eee;border-top:0;">
          <!-- Customer Info -->
          <div style="background:white;padding:15px;border-radius:8px;margin-bottom:15px;">
            <h2 style="margin:0 0 10px;font-size:16px;color:#666;">👤 Klientas</h2>
            <p style="margin:5px 0;"><strong>Vardas:</strong> ${customerName}</p>
            <p style="margin:5px 0;"><strong>El. paštas:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
            ${customerPhone ? `<p style="margin:5px 0;"><strong>Telefonas:</strong> <a href="tel:${customerPhone}">${customerPhone}</a></p>` : ''}
          </div>
          
          <!-- Order Items -->
          <div style="background:white;padding:15px;border-radius:8px;margin-bottom:15px;">
            <h2 style="margin:0 0 10px;font-size:16px;color:#666;">📦 Prekės</h2>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f5f5f5;">
                  <th style="text-align:left;padding:10px;">Prekė</th>
                  <th style="text-align:center;padding:10px;">Kiekis</th>
                  <th style="text-align:right;padding:10px;">Vnt. kaina</th>
                  <th style="text-align:right;padding:10px;">Suma</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          
          <!-- Totals -->
          <div style="background:white;padding:15px;border-radius:8px;margin-bottom:15px;">
            <h2 style="margin:0 0 10px;font-size:16px;color:#666;">💰 Sumos</h2>
            <table style="width:100%;">
              <tr>
                <td style="padding:5px 0;">Prekės:</td>
                <td style="text-align:right;padding:5px 0;">${subtotalEur}€</td>
              </tr>
              ${discountEur > 0 ? `
              <tr>
                <td style="padding:5px 0;color:#22c55e;">Nuolaida:</td>
                <td style="text-align:right;padding:5px 0;color:#22c55e;">-${discountEur}€</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:5px 0;">Pristatymas:</td>
                <td style="text-align:right;padding:5px 0;">${shippingEur === 0 ? 'Nemokamas' : shippingEur + '€'}</td>
              </tr>
              <tr style="border-top:2px solid #ddd;">
                <td style="padding:10px 0;font-weight:bold;font-size:18px;">IŠ VISO:</td>
                <td style="text-align:right;padding:10px 0;font-weight:bold;font-size:18px;">${totalEur}€</td>
              </tr>
            </table>
            
            ${hasPreorder ? `
            <div style="background:#fff3cd;padding:10px;border-radius:4px;margin-top:10px;">
              <p style="margin:0;"><strong>Pre-order mokėjimas:</strong></p>
              <p style="margin:5px 0;">✅ Sumokėtas depozitas: <strong>${depositEur}€</strong></p>
              <p style="margin:5px 0;">⏳ Liko sumokėti: <strong>${balanceEur}€</strong></p>
              ${etaWeeksMin && etaWeeksMax ? `<p style="margin:5px 0;">📅 ETA: ${etaWeeksMin}-${etaWeeksMax} sav.</p>` : ''}
            </div>
            ` : `
            <div style="background:#f0f9f0;padding:10px;border-radius:4px;margin-top:10px;">
              <p style="margin:0;">✅ <strong>Pilnai apmokėta: ${depositEur}€</strong></p>
            </div>
            `}
          </div>
          
          <!-- Shipping -->
          <div style="background:white;padding:15px;border-radius:8px;margin-bottom:15px;">
            <h2 style="margin:0 0 10px;font-size:16px;color:#666;">🚚 Pristatymas</h2>
            <p style="margin:5px 0;"><strong>Būdas:</strong> ${shippingMethod}</p>
            <p style="margin:5px 0;"><strong>Adresas:</strong> ${addressHtml}</p>
          </div>
          
          <!-- Payment -->
          <div style="background:white;padding:15px;border-radius:8px;">
            <h2 style="margin:0 0 10px;font-size:16px;color:#666;">💳 Mokėjimas</h2>
            <p style="margin:5px 0;"><strong>Būdas:</strong> ${paymentMethod}</p>
            <p style="margin:5px 0;"><strong>Tipas:</strong> ${paymentType === 'deposit' ? 'Depozitas' : 'Pilnas mokėjimas'}</p>
          </div>
        </div>
        
        <div style="text-align:center;padding:20px;">
          <a href="https://ibrix.lt/admin" style="display:inline-block;background:#4f46e5;color:white;padding:14px 28px;text-decoration:none;border-radius:6px;font-size:16px;">
            Peržiūrėti Admin
          </a>
        </div>
        
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">IBRIX Admin Notification</p>
      </div>
    `,
  };
}

Deno.serve(async (req: Request) => {
  const requestId = generateRequestId();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, ...data } = await req.json();
    log(requestId, 'Email request received', { type, email, orderNumber: data.orderNumber });

    // Get email content based on type
    let emailContent: { subject: string; html: string };
    let recipientEmail = email;
    
    switch (type) {
      case 'deposit_confirmed':
        emailContent = getDepositConfirmedEmail(data);
        break;
      case 'balance_request':
        emailContent = getBalanceRequestEmail(data);
        break;
      case 'balance_paid':
        emailContent = getBalancePaidEmail(data);
        break;
      case 'shipped':
        emailContent = getShippedEmail(data);
        break;
      case 'support_request':
        emailContent = getSupportRequestEmail(data);
        recipientEmail = 'info@ibrix.lt'; // Admin email for support
        break;
      case 'gift_card':
        emailContent = getGiftCardEmail(data);
        break;
      case 'newsletter':
        emailContent = getNewsletterEmail(data);
        break;
      case 'admin_order_notification':
        emailContent = getAdminOrderNotificationEmail(data);
        recipientEmail = ADMIN_EMAIL; // Always send to admin
        break;
      default:
        log(requestId, 'Unknown email type', { type });
        return new Response(JSON.stringify({ error: 'Unknown email type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Validate email
    if (!recipientEmail) {
      log(requestId, 'Missing recipient email', { type });
      return new Response(JSON.stringify({ error: 'Missing recipient email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey || resendApiKey === 'test' || resendApiKey.length < 10) {
      // Fallback: Log email content for manual sending
      log(requestId, '⚠️ WARNING: RESEND_API_KEY not configured - email logged for manual sending', {
        to: recipientEmail,
        subject: emailContent.subject,
        action_required: 'Configure RESEND_API_KEY and verify ibrix.lt domain in Resend dashboard',
      });

      return new Response(JSON.stringify({
        success: true,
        fallback: true,
        message: 'Email logged (RESEND not configured)',
        email: { to: recipientEmail, subject: emailContent.subject },
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine sender - use resend.dev fallback if domain not verified
    let fromEmail = 'IBRIX <info@ibrix.lt>';
    
    // Try to send via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      // Check if it's a domain verification error
      if (emailData.message?.includes('verify') || emailData.message?.includes('domain')) {
        log(requestId, '⚠️ DOMAIN NOT VERIFIED - Trying fallback sender', {
          error: emailData.message,
        });
        
        // Try with resend.dev fallback
        const fallbackResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'IBRIX <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: emailContent.subject,
            html: emailContent.html,
          }),
        });

        const fallbackData = await fallbackResponse.json();
        
        if (!fallbackResponse.ok) {
          throw new Error(fallbackData.message || 'Failed to send email via fallback');
        }
        
        log(requestId, 'Email sent via fallback (resend.dev)', { 
          emailId: fallbackData.id,
          to: recipientEmail,
        });

        return new Response(JSON.stringify({
          success: true,
          emailId: fallbackData.id,
          warning: 'Domain not verified. Email sent from resend.dev fallback.',
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(emailData.message || 'Failed to send email');
    }

    log(requestId, 'Email sent via Resend', { emailId: emailData.id, to: recipientEmail });

    return new Response(JSON.stringify({
      success: true,
      emailId: emailData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log(requestId, 'Email error', { error: error.message, stack: error.stack });
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
