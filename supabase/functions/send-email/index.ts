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

// Password reset email
function getPasswordResetEmail(data: any): { subject: string; html: string } {
  const { email, resetUrl } = data;

  const content = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:64px;height:64px;background:#fef3c7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">🔐</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1f2937;">Slaptažodžio atkūrimas</h2>
      <p style="margin:0;color:#6b7280;">Gavome prašymą atkurti jūsų slaptažodį.</p>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
        Atkurti slaptažodį
      </a>
    </div>

    <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0;color:#6b7280;font-size:14px;text-align:center;">
        Jei negalite paspausti mygtuko, nukopijuokite šią nuorodą į naršyklę:<br>
        <a href="${resetUrl}" style="color:#4f46e5;word-break:break-all;">${resetUrl}</a>
      </p>
    </div>

    <div style="background:#fef3c7;padding:16px;border-radius:8px;margin-bottom:24px;">
      <p style="margin:0;color:#92400e;font-size:14px;text-align:center;">
        ⏱ Ši nuoroda galioja <strong>1 valandą</strong>
      </p>
    </div>

    <div style="text-align:center;padding:20px;background:#f9fafb;border-radius:8px;">
      <p style="margin:0;font-size:13px;color:#9ca3af;">
        Jei neprašėte atkurti slaptažodžio, tiesiog ignoruokite šį laišką.<br>
        Jūsų paskyra išliks saugi.
      </p>
    </div>
  `;

  return {
    subject: 'Slaptažodžio atkūrimas – IBRIX',
    html: wrapEmail(content),
  };
}

// Helper functions - LEGO-inspired email designs

function getVerificationCodeEmail(data: any): { subject: string; html: string } {
  const { firstName, code } = data;

  const html = `
    <!DOCTYPE html>
    <html lang="lt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IBRIX – Suaktyvinkite savo paskyrą</title>
    </head>
    <body style="margin:0;padding:0;background-color:#d4e8f7;font-family:Arial,Helvetica,sans-serif;">
      <!-- Background pattern wrapper -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#d4e8f7;background-image:url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjE1IiByeD0iMyIgZmlsbD0iI2M0ZGNlYyIgb3BhY2l0eT0iMC40Ii8+PHJlY3QgeD0iNjAiIHk9IjUwIiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIHJ4PSI0IiBmaWxsPSIjYzRkY2VjIiBvcGFjaXR5PSIwLjMiIHRyYW5zZm9ybT0icm90YXRlKDE1IDcyLjUgNjIuNSkiLz48cmVjdCB4PSIyMCIgeT0iNjUiIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMiIgcng9IjIiIGZpbGw9IiNjNGRjZWMiIG9wYWNpdHk9IjAuMzUiIHRyYW5zZm9ybT0icm90YXRlKC0xMCAzMCA3MSkiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=');">
        <tr>
          <td align="center" style="padding:40px 16px;">
            
            <!-- Main container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
              
              <!-- Logo -->
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#1a1a2e;padding:14px 28px;border-radius:8px;">
                        <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:2px;">IBRIX</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Heading -->
              <tr>
                <td align="center" style="padding-bottom:32px;">
                  <h1 style="margin:0;font-size:32px;font-weight:700;color:#006cb7;line-height:1.2;">Suaktyvinkite savo paskyrą</h1>
                </td>
              </tr>

              <!-- White Content Card -->
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                    <tr>
                      <td style="padding:32px 32px 28px;">
                        
                        <!-- Intro Text -->
                        <p style="margin:0 0 28px;font-size:16px;color:#333333;line-height:1.6;text-align:center;">
                          Dėkojame, kad užsiregistravote IBRIX paskyrai gauti. Štai kodas, kurio jums reikės norint tęsti. Tiesiog nukopijuokite jį į lauką ekrane, iš kurio ką tik atėjote, ir būsite pasirengę pradėti!
                        </p>

                        <!-- Code Box -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                          <tr>
                            <td align="center">
                              <table cellpadding="0" cellspacing="0" style="border:2px solid #006cb7;border-radius:6px;padding:20px 48px;">
                                <tr>
                                  <td style="font-size:36px;font-weight:700;color:#1a1a2e;letter-spacing:6px;font-family:Arial,Helvetica,sans-serif;">
                                    ${code}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- Expiration -->
                        <p style="margin:0 0 24px;font-size:15px;color:#333333;text-align:center;">
                          Jūsų kodas veiks <strong>24 valandas</strong>.
                        </p>

                        <!-- Ignore Text -->
                        <p style="margin:0 0 24px;font-size:14px;color:#666666;text-align:center;line-height:1.5;">
                          Jei neužsiregistravote gauti IBRIX paskyros, jums nieko daryti nereikia. Galite tiesiog ignoruoti šį el. laišką.
                        </p>

                        <!-- Support Line -->
                        <p style="margin:0;font-size:14px;color:#666666;text-align:center;line-height:1.5;padding-top:16px;border-top:1px solid #e5e5e5;">
                          Neįmanoma atsakyti į šį el. laišką. Jei turite klausimų, kreipkitės į <a href="mailto:pagalba@ibrix.lt" style="color:#006cb7;text-decoration:underline;">klientų aptarnavimo centrą</a>.
                        </p>
                        
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:40px 20px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom:16px;">
                        <p style="margin:0;font-size:13px;color:#555555;line-height:1.6;">
                          IBRIX, IBRIX logotipas ir kiti IBRIX žymenys yra IBRIX prekių ženklai.<br>
                          © 2026 IBRIX. Visos teisės saugomos.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p style="margin:0;font-size:13px;">
                          <a href="https://ibrix.lt/privatumo-politika" style="color:#006cb7;text-decoration:underline;">Privatumo politika</a>
                          <span style="color:#999999;padding:0 8px;">|</span>
                          <a href="https://ibrix.lt/slapukai-politika" style="color:#006cb7;text-decoration:underline;">Slapukų informacija</a>
                          <span style="color:#999999;padding:0 8px;">|</span>
                          <a href="https://ibrix.lt/pagalba" style="color:#006cb7;text-decoration:underline;">IBRIX.lt/service</a>
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

  return {
    subject: 'IBRIX – Suaktyvinkite savo paskyrą',
    html,
  };
}

function getWelcomeEmail(data: any): { subject: string; html: string } {
  const { firstName, lastName, email } = data;
  const baseUrl = 'https://ibrix.lt';

  const html = `
    <!DOCTYPE html>
    <html lang="lt">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IBRIX – Sveikiname susikūrus IBRIX paskyrą!</title>
    </head>
    <body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
        <tr>
          <td align="center" style="padding:0;">
            
            <!-- Main container -->
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
              
              <!-- Decorative Header with Shapes -->
              <tr>
                <td style="position:relative;padding:24px 0 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="33%" align="left" valign="top" style="padding-left:20px;">
                        <!-- Blue shape left -->
                        <div style="width:60px;height:60px;background:#0073cf;border-radius:8px;transform:rotate(-15deg);"></div>
                      </td>
                      <td width="34%" align="center" valign="top">
                        <!-- Purple shape center -->
                        <div style="width:50px;height:50px;background:#6b4c9a;border-radius:8px;transform:rotate(10deg);margin-top:10px;"></div>
                      </td>
                      <td width="33%" align="right" valign="top" style="padding-right:20px;">
                        <!-- Teal shape right -->
                        <div style="width:55px;height:55px;background:#00a3a3;border-radius:8px;transform:rotate(20deg);"></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Logo -->
              <tr>
                <td align="center" style="padding:24px 0 32px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#1a1a2e;padding:14px 28px;border-radius:8px;">
                        <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:2px;">IBRIX</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Heading -->
              <tr>
                <td align="center" style="padding:0 20px 12px;">
                  <h1 style="margin:0;font-size:28px;font-weight:700;color:#1a1a2e;line-height:1.3;">Sveikiname susikūrus IBRIX paskyrą!</h1>
                </td>
              </tr>

              <!-- Subtext -->
              <tr>
                <td align="center" style="padding:0 20px 32px;">
                  <p style="margin:0;font-size:16px;color:#666666;line-height:1.5;">
                    Džiaugiamės, kad prisijungėte prie mūsų bendruomenės.
                  </p>
                </td>
              </tr>

              <!-- Section Title -->
              <tr>
                <td align="center" style="padding:0 20px 16px;">
                  <h2 style="margin:0;font-size:18px;font-weight:700;color:#1a1a2e;">Štai ką turi žinoti:</h2>
                </td>
              </tr>

              <!-- Account Info Card -->
              <tr>
                <td style="padding:0 20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
                    <tr>
                      <td style="padding:20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="56" valign="top">
                              <!-- Avatar circle -->
                              <div style="width:48px;height:48px;background:#ffd500;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;line-height:48px;">
                                <span style="font-size:24px;">😊</span>
                              </div>
                            </td>
                            <td valign="top" style="padding-left:12px;">
                              <p style="margin:0 0 4px;font-size:13px;color:#888888;">Naudotojo el. paštas</p>
                              <p style="margin:0 0 12px;font-size:15px;color:#006cb7;font-weight:500;">${email}</p>
                              <p style="margin:0 0 4px;font-size:13px;color:#888888;">Vardas</p>
                              <p style="margin:0;font-size:15px;color:#1a1a2e;font-weight:500;">${firstName} ${lastName}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Info Bullets -->
              <tr>
                <td style="padding:0 20px 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="44" valign="top">
                        <div style="width:36px;height:36px;background:#ff6b6b;border-radius:50%;text-align:center;line-height:36px;">
                          <span style="font-size:18px;">⚙️</span>
                        </div>
                      </td>
                      <td valign="middle" style="padding-left:12px;">
                        <p style="margin:0;font-size:15px;color:#333333;line-height:1.5;">
                          Savo <a href="${baseUrl}/account/settings" style="color:#006cb7;text-decoration:underline;">paskyros nustatymuose</a> galite pakeisti savo duomenis.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 20px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="44" valign="top">
                        <div style="width:36px;height:36px;background:#4ecdc4;border-radius:50%;text-align:center;line-height:36px;">
                          <span style="font-size:18px;">🛒</span>
                        </div>
                      </td>
                      <td valign="middle" style="padding-left:12px;">
                        <p style="margin:0;font-size:15px;color:#333333;line-height:1.5;">
                          IBRIX paskyrą galite naudoti apsipirkdami svetainėje <a href="${baseUrl}" style="color:#006cb7;text-decoration:underline;">ibrix.lt</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Purple Benefits Panel -->
              <tr>
                <td style="padding:0 20px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#4a2c6a;border-radius:12px;overflow:hidden;">
                    <tr>
                      <td style="padding:28px 24px;">
                        
                        <!-- Panel Title -->
                        <h3 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#ffffff;text-align:center;">Taip pat gali gauti...</h3>

                        <!-- Benefit 1 -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                          <tr>
                            <td width="70" valign="top">
                              <div style="width:60px;height:60px;background:#5a3d7a;border-radius:8px;text-align:center;line-height:60px;">
                                <span style="font-size:28px;">💰</span>
                              </div>
                            </td>
                            <td valign="top" style="padding-left:14px;">
                              <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#ffd500;">Lojalumo taškai</p>
                              <p style="margin:0;font-size:14px;color:#e0d4ec;line-height:1.4;">Rink taškus už kiekvieną pirkinį ir paversk juos nuolaidomis.</p>
                            </td>
                          </tr>
                        </table>

                        <!-- Benefit 2 -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                          <tr>
                            <td width="70" valign="top">
                              <div style="width:60px;height:60px;background:#5a3d7a;border-radius:8px;text-align:center;line-height:60px;">
                                <span style="font-size:28px;">🏷️</span>
                              </div>
                            </td>
                            <td valign="top" style="padding-left:14px;">
                              <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#ffd500;">Ypatingos nuolaidos</p>
                              <p style="margin:0;font-size:14px;color:#e0d4ec;line-height:1.4;">Ekskliuzyvūs pasiūlymai ir akcijos tik nariams.</p>
                            </td>
                          </tr>
                        </table>

                        <!-- Benefit 3 -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                          <tr>
                            <td width="70" valign="top">
                              <div style="width:60px;height:60px;background:#5a3d7a;border-radius:8px;text-align:center;line-height:60px;">
                                <span style="font-size:28px;">⚡</span>
                              </div>
                            </td>
                            <td valign="top" style="padding-left:14px;">
                              <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#ffd500;">Greitas apmokėjimas</p>
                              <p style="margin:0;font-size:14px;color:#e0d4ec;line-height:1.4;">Išsaugoti adresai ir mokėjimo duomenys greitesniam apsipirkimui.</p>
                            </td>
                          </tr>
                        </table>

                        <!-- Benefit 4 -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="70" valign="top">
                              <div style="width:60px;height:60px;background:#5a3d7a;border-radius:8px;text-align:center;line-height:60px;">
                                <span style="font-size:28px;">🚀</span>
                              </div>
                            </td>
                            <td valign="top" style="padding-left:14px;">
                              <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#ffd500;">Išankstinė prieiga</p>
                              <p style="margin:0;font-size:14px;color:#e0d4ec;line-height:1.4;">Pasinaudok išankstine prieiga prie naujų rinkinių, kad jų netektų laukti eilėje.</p>
                            </td>
                          </tr>
                        </table>

                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td align="center" style="padding:0 20px 40px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:#1a1a2e;border-radius:30px;">
                        <a href="${baseUrl}/produktai" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">
                          Susipažinti su naryste
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:32px 20px;border-top:1px solid #e5e5e5;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding-bottom:12px;">
                        <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">Prašome neatsakyti į šį el. laišką.</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom:20px;">
                        <p style="margin:0;font-size:14px;color:#555555;">
                          Jei turite klausimų, susisiekite su <a href="mailto:pagalba@ibrix.lt" style="color:#006cb7;text-decoration:underline;">klientų aptarnavimo skyriumi</a>.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom:16px;">
                        <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
                          IBRIX, IBRIX logotipas ir kiti IBRIX žymenys yra IBRIX prekių ženklai.<br>
                          © 2026 IBRIX. Visos teisės saugomos.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p style="margin:0;font-size:13px;">
                          <a href="${baseUrl}/privatumo-politika" style="color:#006cb7;text-decoration:underline;">Privatumo politika</a>
                          <span style="color:#999999;padding:0 8px;">|</span>
                          <a href="${baseUrl}/slapukai-politika" style="color:#006cb7;text-decoration:underline;">Slapukų informacija</a>
                          <span style="color:#999999;padding:0 8px;">|</span>
                          <a href="${baseUrl}/pagalba" style="color:#006cb7;text-decoration:underline;">IBRIX.lt/service</a>
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

  return {
    subject: 'IBRIX – Sveikiname susikūrus IBRIX paskyrą!',
    html,
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
      case 'digital_gift_card':
        emailContent = getGiftCardEmail(data);
        recipientEmail = data.recipientEmail || data.to || email;
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
      case 'password_reset':
        emailContent = getPasswordResetEmail(data);
        recipientEmail = data.email || email;
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
