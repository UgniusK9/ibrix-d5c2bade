const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) => {
  console.log(`[SEND-EMAIL] ${step}`, details ? JSON.stringify(details) : '');
};

// Email templates
function getDepositConfirmedEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, depositEur, balanceEur, totalEur, hasPreorder, etaWeeksMin, etaWeeksMax, trackingToken, items } = data;
  
  const trackingUrl = trackingToken 
    ? `https://ibrix.lt/siuntos-sekimas?token=${trackingToken}`
    : 'https://ibrix.lt';

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, ...data } = await req.json();
    log('Email request received', { type, email });

    // Get email content based on type
    let emailContent: { subject: string; html: string };
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
      default:
        log('Unknown email type', { type });
        return new Response(JSON.stringify({ error: 'Unknown email type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey || resendApiKey === 'test' || resendApiKey.length < 10) {
      // Fallback: Log email content for admin to manually send
      log('RESEND_API_KEY not configured - email logged for manual sending', {
        to: email,
        subject: emailContent.subject,
        preview: emailContent.html.substring(0, 200),
      });

      return new Response(JSON.stringify({
        success: true,
        fallback: true,
        message: 'Email logged (RESEND not configured)',
        email: {
          to: email,
          subject: emailContent.subject,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send via Resend using fetch API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'IBRIX <info@ibrix.lt>',
        to: [email],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(emailData.message || 'Failed to send email');
    }

    log('Email sent via Resend', emailData);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log('Email error', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
