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

// Professional email wrapper
function wrapEmail(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="lt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IBRIX</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px;">IBRIX</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding:40px;">
                  ${content}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align:center;">
                        <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Kilo klausimų?</p>
                        <a href="mailto:pagalba@ibrix.lt" style="color:#4f46e5;text-decoration:none;font-weight:500;">pagalba@ibrix.lt</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="text-align:center;padding-top:16px;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">© 2024 IBRIX. Visos teisės saugomos.</p>
                        <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">
                          <a href="https://ibrix.lt" style="color:#9ca3af;">ibrix.lt</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Email templates
function getDepositConfirmedEmail(data: any): { subject: string; html: string } {
  const { 
    firstName, 
    orderNumber, 
    depositEur, 
    balanceEur, 
    totalEur, 
    hasPreorder, 
    etaWeeksMin, 
    etaWeeksMax, 
    trackingToken, 
    items,
    shippingMethod,
    shippingAddress,
    paymentMethod,
  } = data;
  
  const baseUrl = 'https://ibrix.lt';
  const trackingUrl = trackingToken 
    ? `${baseUrl}/siuntos-sekimas/${orderNumber}?token=${trackingToken}`
    : baseUrl;

  const isFullPayment = !hasPreorder || balanceEur === 0;

  const itemsHtml = items?.map((item: any) => 
    `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0;font-weight:500;color:#1f2937;">${item.title_snapshot || item.title}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">SKU: ${item.sku_snapshot || '-'}</p>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:center;color:#4b5563;">${item.quantity} vnt.</td>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;color:#1f2937;font-weight:500;">${((item.unit_price_eur || item.unitPriceEur) * item.quantity).toFixed(2)}€</td>
    </tr>`
  ).join('') || '';

  const shippingLabel = getShippingMethodLabel(shippingMethod);
  const addressHtml = formatShippingAddress(shippingAddress);

  const content = `
    <!-- Thank You Message -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">✓</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Ačiū, ${firstName}!</h2>
      <p style="margin:0;color:#6b7280;">Jūsų užsakymas sėkmingai priimtas</p>
    </div>

    <!-- Order Number Badge -->
    <div style="background:#f3f4f6;padding:16px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Užsakymo numeris</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#1f2937;">${orderNumber}</p>
    </div>

    <!-- Items Table -->
    <div style="margin-bottom:24px;">
      <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2937;padding-bottom:8px;border-bottom:2px solid #1a1a2e;">Užsakytos prekės</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 0;font-size:12px;color:#6b7280;font-weight:500;text-transform:uppercase;">Prekė</th>
            <th style="text-align:center;padding:8px 0;font-size:12px;color:#6b7280;font-weight:500;text-transform:uppercase;">Kiekis</th>
            <th style="text-align:right;padding:8px 0;font-size:12px;color:#6b7280;font-weight:500;text-transform:uppercase;">Suma</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Payment Summary -->
    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2937;">Mokėjimo informacija</h3>
      ${isFullPayment ? `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;">
          <span style="color:#6b7280;">Iš viso:</span>
          <span style="font-weight:600;color:#1f2937;">${totalEur}€</span>
        </div>
        <div style="background:#dcfce7;padding:12px;border-radius:6px;margin-top:12px;text-align:center;">
          <p style="margin:0;color:#166534;font-weight:600;">✓ Pilnai apmokėta</p>
        </div>
      ` : `
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Bendra suma:</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;color:#1f2937;">${totalEur}€</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Sumokėtas depozitas:</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#22c55e;">${depositEur}€</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb;">Likusi suma (vėliau):</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#f59e0b;border-top:1px solid #e5e7eb;">${balanceEur}€</td>
          </tr>
        </table>
        ${hasPreorder && etaWeeksMin && etaWeeksMax ? `
          <div style="background:#fef3c7;padding:12px;border-radius:6px;margin-top:12px;">
            <p style="margin:0;color:#92400e;font-size:14px;">
              ⏱ Numatomas pristatymo laikas: <strong>${etaWeeksMin}-${etaWeeksMax} sav.</strong>
            </p>
            <p style="margin:8px 0 0;color:#92400e;font-size:13px;">
              Kai prekė bus paruošta, atsiųsime nuorodą apmokėti likusią sumą.
            </p>
          </div>
        ` : ''}
      `}
      ${paymentMethod ? `
        <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">Mokėjimo būdas: ${paymentMethod}</p>
      ` : ''}
    </div>

    <!-- Shipping Info -->
    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:24px;">
      <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1f2937;">Pristatymo informacija</h3>
      <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Pristatymo būdas:</p>
      <p style="margin:0 0 12px;font-weight:500;color:#1f2937;">${shippingLabel}</p>
      <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Adresas:</p>
      <p style="margin:0;font-weight:500;color:#1f2937;">${addressHtml}</p>
    </div>

    <!-- CTA Buttons -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${trackingUrl}" style="display:inline-block;background:#1a1a2e;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;margin-bottom:12px;">
        Sekti užsakymą
      </a>
    </div>

    <!-- Support Link -->
    <div style="text-align:center;padding:20px;background:#fef2f2;border-radius:8px;">
      <p style="margin:0 0 12px;color:#991b1b;font-size:14px;">Kilo problema su užsakymu?</p>
      <a href="mailto:pagalba@ibrix.lt?subject=Užsakymas ${orderNumber}" style="display:inline-block;background:#dc2626;color:#ffffff;padding:10px 24px;text-decoration:none;border-radius:6px;font-weight:500;font-size:14px;">
        Susisiekite su mumis
      </a>
    </div>
  `;

  return {
    subject: isFullPayment 
      ? `Užsakymas ${orderNumber} - mokėjimas gautas ✓`
      : `Užsakymas ${orderNumber} - depozitas gautas ✓`,
    html: wrapEmail(content),
  };
}

function getBalanceRequestEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, balanceEur, paymentUrl, customMessage } = data;

  const content = `
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:#fef3c7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">📦</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Sveiki, ${firstName}!</h2>
      <p style="margin:0;color:#6b7280;">Jūsų užsakymas paruoštas siuntimui</p>
    </div>

    <!-- Order Number -->
    <div style="background:#f3f4f6;padding:16px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Užsakymo numeris</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#1f2937;">${orderNumber}</p>
    </div>

    ${customMessage ? `
      <!-- Custom Message -->
      <div style="background:#eff6ff;padding:16px;border-radius:8px;margin-bottom:24px;border-left:4px solid #3b82f6;">
        <p style="margin:0;color:#1e40af;font-style:italic;">"${customMessage}"</p>
      </div>
    ` : ''}

    <!-- Amount Due -->
    <div style="background:#fef3c7;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:14px;color:#92400e;">Liko apmokėti:</p>
      <p style="margin:0;font-size:36px;font-weight:700;color:#92400e;">${balanceEur}€</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${paymentUrl}" style="display:inline-block;background:#22c55e;color:#ffffff;padding:16px 48px;text-decoration:none;border-radius:8px;font-weight:700;font-size:18px;">
        Apmokėti dabar
      </a>
      <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">
        Kai apmokėsite, iškart pradėsime siuntimą
      </p>
    </div>

    <!-- Support -->
    <div style="text-align:center;padding-top:16px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:13px;color:#6b7280;">
        Turite klausimų? Rašykite 
        <a href="mailto:pagalba@ibrix.lt?subject=Užsakymas ${orderNumber}" style="color:#4f46e5;">pagalba@ibrix.lt</a>
      </p>
    </div>
  `;

  return {
    subject: `Užsakymas ${orderNumber} - liko apmokėti ${balanceEur}€`,
    html: wrapEmail(content),
  };
}

function getBalancePaidEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, amountEur } = data;

  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">✓</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Ačiū, ${firstName}!</h2>
      <p style="margin:0;color:#6b7280;">Jūsų mokėjimas sėkmingai gautas</p>
    </div>

    <div style="background:#dcfce7;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:14px;color:#166534;">Užsakymas ${orderNumber}</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#166534;">${amountEur}€ apmokėta</p>
    </div>

    <div style="background:#f3f4f6;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <p style="margin:0;color:#4b5563;">
        🚀 Pradedame ruošti jūsų siuntą!<br>
        Kai išsiųsime, gausite sekimo numerį.
      </p>
    </div>
  `;

  return {
    subject: `Užsakymas ${orderNumber} - mokėjimas gautas ✓`,
    html: wrapEmail(content),
  };
}

function getShippedEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, trackingNumber, carrierName, trackingUrl } = data;

  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:#dbeafe;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">🚚</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Siunta pakeliui!</h2>
      <p style="margin:0;color:#6b7280;">Jūsų užsakymas ${orderNumber} išsiųstas</p>
    </div>

    <div style="background:#eff6ff;padding:20px;border-radius:8px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Vežėjas:</td>
          <td style="padding:8px 0;text-align:right;font-weight:500;color:#1f2937;">${carrierName || 'Kurjeris'}</td>
        </tr>
        ${trackingNumber ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Sekimo numeris:</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;color:#1f2937;font-family:monospace;">${trackingNumber}</td>
          </tr>
        ` : ''}
      </table>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${trackingUrl}" style="display:inline-block;background:#1a1a2e;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">
        Sekti siuntą
      </a>
    </div>
  `;

  return {
    subject: `Užsakymas ${orderNumber} - išsiųsta! 🚚`,
    html: wrapEmail(content),
  };
}

function getSupportRequestEmail(data: any): { subject: string; html: string } {
  const { orderNumber, requestType, message, userEmail } = data.data || data;

  const requestTypeLabels: Record<string, string> = {
    'return': 'Prekės grąžinimas',
    'missing_parts': 'Trūkstamos detalės',
    'other': 'Kita informacija',
  };

  const content = `
    <h2 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#1f2937;">Nauja kliento užklausa</h2>

    <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Užsakymas:</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#1f2937;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Kliento el. paštas:</td>
          <td style="padding:8px 0;text-align:right;"><a href="mailto:${userEmail}" style="color:#4f46e5;">${userEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Užklausos tipas:</td>
          <td style="padding:8px 0;text-align:right;font-weight:500;color:#1f2937;">${requestTypeLabels[requestType] || requestType}</td>
        </tr>
      </table>
    </div>

    <div style="background:#fef3c7;padding:20px;border-radius:8px;border-left:4px solid #f59e0b;">
      <p style="margin:0 0 8px;font-weight:600;color:#92400e;">Pranešimas:</p>
      <p style="margin:0;color:#78350f;white-space:pre-wrap;">${message}</p>
    </div>
  `;

  return {
    subject: `[SUPPORT] Užsakymas ${orderNumber} - ${requestTypeLabels[requestType] || requestType}`,
    html: wrapEmail(content),
  };
}

function getGiftCardEmail(data: any): { subject: string; html: string } {
  const { recipientName, senderName, code, amount, personalMessage } = data;

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:#fef3c7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">🎁</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Sveiki, ${recipientName}!</h2>
      <p style="margin:0;color:#6b7280;">${senderName || 'Draugas'} atsiuntė jums dovanų kuponą!</p>
    </div>

    <!-- Gift Card Visual -->
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px;border-radius:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">IBRIX Dovanų kuponas</p>
      <p style="margin:0 0 16px;font-size:48px;font-weight:700;color:#ffffff;">${amount}€</p>
      <div style="background:rgba(255,255,255,0.1);padding:12px 24px;border-radius:8px;display:inline-block;">
        <p style="margin:0;font-family:monospace;font-size:24px;color:#fbbf24;letter-spacing:2px;">${code}</p>
      </div>
    </div>

    ${personalMessage ? `
      <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-style:italic;color:#4b5563;">"${personalMessage}"</p>
        <p style="margin:12px 0 0;font-size:13px;color:#9ca3af;">— ${senderName || 'Draugas'}</p>
      </div>
    ` : ''}

    <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-weight:600;color:#1f2937;">Kaip panaudoti kuponą?</p>
      <ol style="margin:0;padding-left:20px;color:#4b5563;">
        <li style="margin-bottom:8px;">Prisijunkite arba užsiregistruokite <a href="https://ibrix.lt/auth" style="color:#4f46e5;">ibrix.lt</a></li>
        <li style="margin-bottom:8px;">Eikite į "Mano paskyra" → "Aktyvuoti dovanų kuponą"</li>
        <li>Įveskite kodą: <strong>${code}</strong></li>
      </ol>
    </div>

    <div style="text-align:center;">
      <a href="https://ibrix.lt/auth" style="display:inline-block;background:#1a1a2e;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">
        Aktyvuoti kuponą
      </a>
    </div>
  `;

  return {
    subject: `🎁 ${senderName || 'Draugas'} atsiuntė jums ${amount}€ dovanų kuponą!`,
    html: wrapEmail(content),
  };
}

function getGiftCardConfirmationEmail(data: any): { subject: string; html: string } {
  const { recipientName, amount, code } = data;

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">✓</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Dovanų kuponas išsiųstas!</h2>
      <p style="margin:0;color:#6b7280;">Jūsų ${amount}€ dovanų kuponas sėkmingai nupirktas</p>
    </div>

    <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0 0 8px;color:#6b7280;">Gavėjas:</p>
      <p style="margin:0;font-weight:600;color:#1f2937;">${recipientName}</p>
      <p style="margin:16px 0 8px;color:#6b7280;">Kupono kodas:</p>
      <p style="margin:0;font-family:monospace;font-size:18px;color:#1f2937;">${code}</p>
    </div>

    <p style="margin:0;text-align:center;color:#6b7280;font-size:14px;">
      Gavėjas gavo el. laišką su kuponu ir aktyvavimo instrukcijomis.
    </p>
  `;

  return {
    subject: `Dovanų kuponas ${amount}€ sėkmingai nupirktas ✓`,
    html: wrapEmail(content),
  };
}

function getNewsletterEmail(data: any): { subject: string; html: string } {
  const { firstName, subject, content } = data;

  const htmlContent = content
    .split('\n\n')
    .map((p: string) => `<p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">${p}</p>`)
    .join('');

  const emailContent = `
    <h2 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#1f2937;">Sveiki, ${firstName}!</h2>
    ${htmlContent}
  `;

  return {
    subject: subject,
    html: wrapEmail(emailContent),
  };
}

// Admin order notification email - IMPROVED
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
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0;font-weight:500;color:#1f2937;">${item.title_snapshot || item.title}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">SKU: ${item.sku_snapshot || '-'}</p>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#4b5563;">${item.quantity}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#1f2937;">${(item.unit_price_eur || item.unitPriceEur).toFixed(2)}€</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:500;color:#1f2937;">${((item.unit_price_eur || item.unitPriceEur) * item.quantity).toFixed(2)}€</td>
    </tr>`
  ).join('') || '';

  const shippingLabel = getShippingMethodLabel(shippingMethod);
  const addressHtml = formatShippingAddress(shippingAddress);

  const content = `
    <!-- Alert Banner -->
    <div style="background:#dcfce7;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:14px;color:#166534;">🎉 NAUJAS UŽSAKYMAS</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#166534;">${orderNumber}</p>
    </div>

    <!-- Amount Paid -->
    <div style="background:#1a1a2e;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:14px;color:#9ca3af;">${hasPreorder ? 'Sumokėtas depozitas' : 'Apmokėta'}</p>
      <p style="margin:0;font-size:32px;font-weight:700;color:#22c55e;">${depositEur}€</p>
      ${hasPreorder && balanceEur > 0 ? `<p style="margin:8px 0 0;font-size:14px;color:#fbbf24;">Liko: ${balanceEur}€</p>` : ''}
    </div>

    <!-- Customer Info -->
    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:16px;">
      <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;">👤 Kliento informacija</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#6b7280;width:120px;">Vardas:</td>
          <td style="padding:6px 0;font-weight:500;color:#1f2937;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;">El. paštas:</td>
          <td style="padding:6px 0;"><a href="mailto:${customerEmail}" style="color:#4f46e5;font-weight:500;">${customerEmail}</a></td>
        </tr>
        ${customerPhone ? `
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Telefonas:</td>
            <td style="padding:6px 0;"><a href="tel:${customerPhone}" style="color:#4f46e5;font-weight:500;">${customerPhone}</a></td>
          </tr>
        ` : ''}
      </table>
    </div>

    <!-- Order Items -->
    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:16px;">
      <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;">📦 Prekės</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background:#e5e7eb;">
            <th style="text-align:left;padding:10px 8px;font-size:12px;color:#4b5563;">Prekė</th>
            <th style="text-align:center;padding:10px 8px;font-size:12px;color:#4b5563;">Kiekis</th>
            <th style="text-align:right;padding:10px 8px;font-size:12px;color:#4b5563;">Vnt.</th>
            <th style="text-align:right;padding:10px 8px;font-size:12px;color:#4b5563;">Suma</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:16px;">
      <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;">💰 Sumos</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#6b7280;">Prekės:</td>
          <td style="padding:6px 0;text-align:right;color:#1f2937;">${subtotalEur}€</td>
        </tr>
        ${discountEur > 0 ? `
          <tr>
            <td style="padding:6px 0;color:#22c55e;">Nuolaida:</td>
            <td style="padding:6px 0;text-align:right;color:#22c55e;">-${discountEur}€</td>
          </tr>
        ` : ''}
        <tr>
          <td style="padding:6px 0;color:#6b7280;">Pristatymas:</td>
          <td style="padding:6px 0;text-align:right;color:#1f2937;">${shippingEur === 0 ? 'Nemokamas' : shippingEur + '€'}</td>
        </tr>
        <tr style="border-top:2px solid #1f2937;">
          <td style="padding:12px 0;font-weight:700;font-size:16px;color:#1f2937;">IŠ VISO:</td>
          <td style="padding:12px 0;text-align:right;font-weight:700;font-size:16px;color:#1f2937;">${totalEur}€</td>
        </tr>
      </table>
    </div>

    <!-- Shipping -->
    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:16px;">
      <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;">🚚 Pristatymas</h3>
      <p style="margin:0 0 8px;color:#6b7280;">Būdas: <span style="font-weight:500;color:#1f2937;">${shippingLabel}</span></p>
      <p style="margin:0;color:#6b7280;">Adresas: <span style="font-weight:500;color:#1f2937;">${addressHtml}</span></p>
    </div>

    <!-- Payment -->
    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;font-size:14px;font-weight:600;color:#1f2937;text-transform:uppercase;letter-spacing:0.5px;">💳 Mokėjimas</h3>
      <p style="margin:0 0 8px;color:#6b7280;">Būdas: <span style="font-weight:500;color:#1f2937;">${paymentMethod || 'Kortelė'}</span></p>
      <p style="margin:0;color:#6b7280;">Tipas: <span style="font-weight:500;color:#1f2937;">${hasPreorder ? 'Pre-order depozitas' : 'Pilnas mokėjimas'}</span></p>
      ${hasPreorder && etaWeeksMin && etaWeeksMax ? `
        <p style="margin:12px 0 0;padding:8px;background:#fef3c7;border-radius:4px;color:#92400e;font-size:14px;">
          📅 ETA: ${etaWeeksMin}-${etaWeeksMax} savaičių
        </p>
      ` : ''}
    </div>

    <!-- CTA -->
    <div style="text-align:center;">
      <a href="https://ibrix.lt/admin" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Peržiūrėti Admin
      </a>
    </div>
  `;

  return {
    subject: `🛒 Naujas užsakymas ${orderNumber} - ${depositEur}€`,
    html: wrapEmail(content),
  };
}

// Inquiry reply email for customers
function getInquiryReplyEmail(data: any): { subject: string; html: string } {
  const { customerName, replyMessage, conversationUrl, originalTopic } = data;

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1f2937;">Sveiki, ${customerName}!</h2>
    
    <p style="color:#4b5563;margin:0 0 16px;line-height:1.6;">
      Atsakėme į jūsų užklausą: <strong>${originalTopic}</strong>
    </p>

    <!-- Reply Message -->
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:#1f2937;line-height:1.6;white-space:pre-wrap;">${replyMessage}</p>
    </div>

    <p style="color:#4b5563;margin:24px 0 16px;line-height:1.6;">
      Jei turite papildomų klausimų, galite tęsti pokalbį:
    </p>

    <!-- CTA Button -->
    <div style="text-align:center;margin:32px 0;">
      <a href="${conversationUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
        Tęsti pokalbį
      </a>
    </div>

    <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
      Arba atidarykite šią nuorodą naršyklėje:<br>
      <a href="${conversationUrl}" style="color:#4f46e5;word-break:break-all;">${conversationUrl}</a>
    </p>
  `;

  return {
    subject: `Atsakymas į jūsų užklausą – ${originalTopic}`,
    html: wrapEmail(content),
  };
}

// Admin notification when customer replies to inquiry
function getAdminInquiryNotificationEmail(data: any): { subject: string; html: string } {
  const { customerName, customerEmail, topic, message, conversationUrl } = data;

  const content = `
    <!-- Alert Banner -->
    <div style="background:#fef3c7;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:14px;color:#92400e;">💬 NAUJAS KLIENTO ATSAKYMAS</p>
      <p style="margin:0;font-size:18px;font-weight:600;color:#92400e;">${customerName}</p>
    </div>

    <!-- Customer Info -->
    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:16px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#6b7280;width:100px;">Klientas:</td>
          <td style="padding:6px 0;font-weight:500;color:#1f2937;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;">El. paštas:</td>
          <td style="padding:6px 0;"><a href="mailto:${customerEmail}" style="color:#4f46e5;font-weight:500;">${customerEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;">Tema:</td>
          <td style="padding:6px 0;font-weight:500;color:#1f2937;">${topic}</td>
        </tr>
      </table>
    </div>

    <!-- Message -->
    <div style="background:#eff6ff;padding:20px;border-radius:8px;border-left:4px solid #3b82f6;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:600;color:#1e40af;">Žinutė:</p>
      <p style="margin:0;color:#1e40af;white-space:pre-wrap;">${message}</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;">
      <a href="${conversationUrl}" style="display:inline-block;background:#1a1a2e;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">
        Peržiūrėti užklausas
      </a>
    </div>
  `;

  return {
    subject: `💬 Naujas atsakymas nuo ${customerName} – ${topic}`,
    html: wrapEmail(content),
  };
}

// Inquiry received auto-reply email for customers
function getInquiryReceivedEmail(data: any): { subject: string; html: string } {
  const { firstName, topic, message, orderNumber, conversationToken } = data;
  const baseUrl = 'https://ibrix.lt';
  const conversationUrl = conversationToken ? `${baseUrl}/pokalbis/${conversationToken}` : baseUrl;

  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:#dbeafe;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">📬</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Gavome jūsų užklausą!</h2>
      <p style="margin:0;color:#6b7280;">Sveiki, ${firstName}! Dėkojame, kad susisiekėte su mumis.</p>
    </div>

    <!-- Request Summary -->
    <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;color:#6b7280;">Tema:</td>
          <td style="padding:8px 0;text-align:right;font-weight:500;color:#1f2937;">${topic}</td>
        </tr>
        ${orderNumber ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Užsakymo nr.:</td>
            <td style="padding:8px 0;text-align:right;font-weight:500;color:#1f2937;">${orderNumber}</td>
          </tr>
        ` : ''}
      </table>
    </div>

    <!-- Original Message -->
    <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-weight:600;color:#1e40af;">Jūsų žinutė:</p>
      <p style="margin:0;color:#1e3a5f;line-height:1.6;white-space:pre-wrap;">${message}</p>
    </div>

    <!-- Response Time -->
    <div style="background:#dcfce7;padding:16px;border-radius:8px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;color:#166534;font-size:14px;">
        ⏱ Paprastai atsakome per <strong>24 valandas</strong> darbo dienomis
      </p>
    </div>

    <!-- Conversation Link -->
    ${conversationToken ? `
      <div style="text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 16px;color:#4b5563;">Peržiūrėti savo užklausą ir atsakymą galite čia:</p>
        <a href="${conversationUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">
          Peržiūrėti pokalbį
        </a>
      </div>
    ` : ''}

    <div style="text-align:center;padding:20px;background:#f9fafb;border-radius:8px;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Jei turite papildomų klausimų, galite atsakyti į šį laišką arba parašyti mums 
        <a href="mailto:pagalba@ibrix.lt" style="color:#4f46e5;">pagalba@ibrix.lt</a>
      </p>
    </div>
  `;

  return {
    subject: `Gavome jūsų užklausą – ${topic}`,
    html: wrapEmail(content),
  };
}

// Helper functions
function getVerificationCodeEmail(data: any): { subject: string; html: string } {
  const { firstName, code } = data;

  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:#dbeafe;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">✉️</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Suaktyvinkite savo paskyrą</h2>
      <p style="margin:0;color:#6b7280;">Sveiki, ${firstName}! Štai jūsų patvirtinimo kodas:</p>
    </div>

    <!-- Code Display -->
    <div style="background:#f3f4f6;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;border:2px dashed #d1d5db;">
      <p style="margin:0;font-size:36px;font-weight:700;color:#1f2937;letter-spacing:8px;font-family:monospace;">${code}</p>
    </div>

    <div style="background:#fef3c7;padding:16px;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0;color:#92400e;font-size:14px;text-align:center;">
        ⏱ Kodas galioja <strong>24 valandas</strong>
      </p>
    </div>

    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;text-align:center;">
      Tiesiog nukopijuokite šį kodą į patvirtinimo langą ir jūsų paskyra bus aktyvuota.
    </p>

    <div style="text-align:center;padding:20px;background:#f9fafb;border-radius:8px;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Jei neprisiregistravote IBRIX paskyrą, tiesiog ignoruokite šį laišką.
      </p>
    </div>
  `;

  return {
    subject: 'Jūsų IBRIX paskyros patvirtinimo kodas',
    html: wrapEmail(content),
  };
}

function getWelcomeEmail(data: any): { subject: string; html: string } {
  const { firstName, lastName, email } = data;
  const baseUrl = 'https://ibrix.lt';

  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">🎉</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Sveikiname susikūrus IBRIX paskyrą!</h2>
      <p style="margin:0;color:#6b7280;">Džiaugiamės, kad prisijungėte prie mūsų bendruomenės.</p>
    </div>

    <!-- Account Info -->
    <div style="background:#f3f4f6;padding:24px;border-radius:12px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1f2937;">Štai ką turi žinoti:</h3>
      
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px;background:#ffffff;border-radius:8px;">
        <div style="width:40px;height:40px;background:#ffd500;border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:20px;">👤</span>
        </div>
        <div>
          <p style="margin:0;font-size:12px;color:#6b7280;">Naudotojo vardas</p>
          <p style="margin:0;font-weight:600;color:#1f2937;">${email}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Vardas</p>
          <p style="margin:0;font-weight:500;color:#1f2937;">${firstName} ${lastName}</p>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding:12px;background:#ffffff;border-radius:8px;">
        <div style="width:40px;height:40px;background:#e5e7eb;border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:20px;">⚙️</span>
        </div>
        <div>
          <p style="margin:0;font-size:14px;color:#4b5563;">
            Savo <a href="${baseUrl}/account/settings" style="color:#0b6bd3;">paskyros nustatymuose</a> gali pakeisti savo duomenis.
          </p>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#ffffff;border-radius:8px;">
        <div style="width:40px;height:40px;background:#e5e7eb;border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:20px;">🛒</span>
        </div>
        <div>
          <p style="margin:0;font-size:14px;color:#4b5563;">
            IBRIX paskyrą gali naudoti apsipirkdamas svetainėje <a href="${baseUrl}" style="color:#0b6bd3;">ibrix.lt</a>
          </p>
        </div>
      </div>
    </div>

    <!-- Benefits -->
    <div style="background:#eff6ff;padding:24px;border-radius:12px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1e40af;text-align:center;">Ką gauni su IBRIX paskyra?</h3>
      
      <div style="display:grid;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:20px;">💰</span>
          <div>
            <p style="margin:0;font-weight:600;color:#1e40af;">Lojalumo taškai</p>
            <p style="margin:0;font-size:13px;color:#3b82f6;">Rink taškus su kiekvienu pirkiniu</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:20px;">🏷️</span>
          <div>
            <p style="margin:0;font-weight:600;color:#1e40af;">Ypatingos nuolaidos</p>
            <p style="margin:0;font-size:13px;color:#3b82f6;">Eksliuzyvūs pasiūlymai tik nariams</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:20px;">📦</span>
          <div>
            <p style="margin:0;font-weight:600;color:#1e40af;">Greitas apmokėjimas</p>
            <p style="margin:0;font-size:13px;color:#3b82f6;">Išsaugoti adresai ir mokėjimo duomenys</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;">
      <a href="${baseUrl}/produktai" style="display:inline-block;background:#1a1a2e;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">
        Pradėti apsipirkti
      </a>
    </div>
  `;

  return {
    subject: 'Sveiki atvykę į IBRIX! 🎉',
    html: wrapEmail(content),
  };
}

function getShippingMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    'omniva_locker': 'Omniva paštomatas',
    'lp_express_locker': 'LP Express paštomatas',
    'dpd_locker': 'DPD paštomatas',
    'courier': 'Kurjeris į namus',
  };
  return labels[method] || method || 'Pristatymas';
}

function formatShippingAddress(address: any): string {
  if (!address) return 'Nenurodyta';
  
  if (address.lockerAddress) {
    return `${address.lockerName || ''}, ${address.lockerAddress}`;
  }
  
  if (address.street) {
    return `${address.street}, ${address.city} ${address.postalCode || ''}`.trim();
  }
  
  return 'Nenurodyta';
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
        recipientEmail = 'info@ibrix.lt';
        break;
      case 'gift_card':
        emailContent = getGiftCardEmail(data);
        recipientEmail = data.recipientEmail || email;
        break;
      case 'gift_card_confirmation':
        emailContent = getGiftCardConfirmationEmail(data);
        break;
      case 'newsletter':
        emailContent = getNewsletterEmail(data);
        break;
      case 'inquiry_reply':
        emailContent = getInquiryReplyEmail(data);
        recipientEmail = data.to || email;
        break;
      case 'admin_inquiry_notification':
        emailContent = getAdminInquiryNotificationEmail(data);
        recipientEmail = ADMIN_EMAIL;
        break;
      case 'admin_order_notification':
        emailContent = getAdminOrderNotificationEmail(data);
        recipientEmail = ADMIN_EMAIL;
        break;
      case 'verification_code':
        emailContent = getVerificationCodeEmail(data.data || data);
        recipientEmail = data.data?.email || data.email || email;
        break;
      case 'welcome':
        emailContent = getWelcomeEmail(data.data || data);
        recipientEmail = data.data?.email || data.email || email;
        break;
      case 'inquiry_received':
        emailContent = getInquiryReceivedEmail(data.data || data);
        recipientEmail = data.data?.email || data.email || email;
        break;
      default:
        log(requestId, 'Unknown email type', { type });
        return new Response(JSON.stringify({ error: 'Unknown email type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!recipientEmail) {
      log(requestId, 'Missing recipient email', { type });
      return new Response(JSON.stringify({ error: 'Missing recipient email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey || resendApiKey === 'test' || resendApiKey.length < 10) {
      log(requestId, '⚠️ WARNING: RESEND_API_KEY not configured', {
        to: recipientEmail,
        subject: emailContent.subject,
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

    let fromEmail = 'IBRIX <info@ibrix.lt>';
    
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
      if (emailData.message?.includes('verify') || emailData.message?.includes('domain')) {
        log(requestId, '⚠️ DOMAIN NOT VERIFIED - Trying fallback sender', { error: emailData.message });
        
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
        
        log(requestId, 'Email sent via fallback (resend.dev)', { emailId: fallbackData.id, to: recipientEmail });

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
