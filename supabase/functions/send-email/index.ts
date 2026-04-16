const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = 'u.ciciurenas@gmail.com';
const BASE_URL = 'https://ibrix.lt';

// Generate request ID for tracing
const generateRequestId = () => crypto.randomUUID().slice(0, 8);

const log = (requestId: string, step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[SEND-EMAIL][${requestId}][${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

// =====================================================================
// UNIFIED EMAIL DESIGN SYSTEM
// =====================================================================
// Style tokens — used across ALL templates to keep a consistent brand look.
const FONT_STACK = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Inter,Arial,sans-serif`;
const COLOR_BG = '#f5f5f5';
const COLOR_SURFACE = '#ffffff';
const COLOR_ACCENT = '#f5f5f5';
const COLOR_TEXT = '#1a1a1a';
const COLOR_MUTED = '#6b6b6b';
const COLOR_BORDER = '#e5e5e5';
const COLOR_BRAND = '#000000';
const COLOR_LINK = '#1a1a1a';
const COLOR_CTA = '#000000';

function currentYear(): number {
  return new Date().getFullYear();
}

function formatDate(d?: Date): string {
  const date = d || new Date();
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

function getEmailHeader(): string {
  return `
    <tr>
      <td style="background:${COLOR_BRAND};padding:28px 40px;text-align:center;">
        <a href="${BASE_URL}" style="text-decoration:none;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:4px;">IBRIX</a>
      </td>
    </tr>
  `;
}

function getEmailFooter(): string {
  return `
    <tr>
      <td style="padding:32px 40px;background:${COLOR_ACCENT};border-top:1px solid ${COLOR_BORDER};text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:${COLOR_TEXT};font-weight:600;letter-spacing:0.5px;">IBRIX</p>
        <p style="margin:0 0 16px;font-size:12px;color:${COLOR_MUTED};line-height:1.6;">
          Klausimai? <a href="mailto:pagalba@ibrix.lt" style="color:${COLOR_TEXT};text-decoration:underline;">pagalba@ibrix.lt</a>
          &nbsp;·&nbsp;
          <a href="${BASE_URL}" style="color:${COLOR_TEXT};text-decoration:underline;">ibrix.lt</a>
        </p>
        <p style="margin:0;font-size:11px;color:${COLOR_MUTED};letter-spacing:0.3px;">
          © ${currentYear()} IBRIX. Visos teisės saugomos.
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:${COLOR_MUTED};">
          <a href="${BASE_URL}/privatumo-politika" style="color:${COLOR_MUTED};text-decoration:underline;">Privatumo politika</a>
          <span style="padding:0 6px;">·</span>
          <a href="${BASE_URL}/slapukai-politika" style="color:${COLOR_MUTED};text-decoration:underline;">Slapukai</a>
          <span style="padding:0 6px;">·</span>
          <a href="${BASE_URL}/pagalba" style="color:${COLOR_MUTED};text-decoration:underline;">Pagalba</a>
        </p>
      </td>
    </tr>
  `;
}

interface WrapOptions {
  title?: string;
  preheader?: string;
}

function getEmailWrapper(content: string, options: WrapOptions = {}): string {
  const title = options.title || 'IBRIX';
  const preheader = options.preheader || '';
  return `<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR_BG};font-family:${FONT_STACK};color:${COLOR_TEXT};-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;font-size:1px;color:${COLOR_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR_BG};padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:${COLOR_SURFACE};border:1px solid ${COLOR_BORDER};">
          ${getEmailHeader()}
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          ${getEmailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Section heading (small uppercase label like "UŽSAKYMO INFORMACIJA")
function getSectionTitle(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:14px;font-weight:700;color:${COLOR_TEXT};letter-spacing:1.5px;text-transform:uppercase;border-bottom:1px solid ${COLOR_BORDER};padding-bottom:10px;">${text}</h2>`;
}

// Hero/title block (e.g., "UŽSAKYMAS GAUTAS")
function getHeroBlock(eyebrow: string, title: string, subtitle?: string): string {
  return `
    <div style="text-align:center;margin-bottom:32px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;color:${COLOR_MUTED};text-transform:uppercase;font-weight:600;">${eyebrow}</p>
      <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:${COLOR_TEXT};letter-spacing:-0.5px;">${title}</h1>
      ${subtitle ? `<p style="margin:0;font-size:15px;color:${COLOR_MUTED};line-height:1.5;">${subtitle}</p>` : ''}
    </div>
  `;
}

// Light gray info table with labeled cells (FOTO 1 style)
interface InfoCell {
  label: string;
  value: string;
}

function getInfoTable(cells: InfoCell[]): string {
  // Render cells in a single row, wrapping to multiple rows of 3 on mobile via CSS.
  const cellHtml = cells.map((c, i) => {
    const isLast = i === cells.length - 1;
    return `
      <td style="padding:16px 18px;background:${COLOR_ACCENT};border-right:${isLast ? '0' : `1px solid ${COLOR_BORDER}`};vertical-align:top;">
        <p style="margin:0 0 6px;font-size:10px;color:${COLOR_MUTED};text-transform:uppercase;letter-spacing:1.2px;font-weight:600;">${c.label}</p>
        <p style="margin:0;font-size:13px;color:${COLOR_TEXT};font-weight:600;word-break:break-word;">${c.value}</p>
      </td>
    `;
  }).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;border:1px solid ${COLOR_BORDER};">
      <tr>${cellHtml}</tr>
    </table>
  `;
}

// Two-column address block
function getAddressBlock(buyerLabel: string, buyerHtml: string, shippingLabel: string, shippingHtml: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:12px;">
          ${getSectionTitle(buyerLabel)}
          <div style="font-size:14px;color:${COLOR_TEXT};line-height:1.7;">${buyerHtml}</div>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:12px;">
          ${getSectionTitle(shippingLabel)}
          <div style="font-size:14px;color:${COLOR_TEXT};line-height:1.7;">${shippingHtml}</div>
        </td>
      </tr>
    </table>
  `;
}

// CTA Button
function getCtaButton(text: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="background:${COLOR_CTA};">
          <a href="${url}" style="display:inline-block;padding:16px 40px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:1.5px;text-transform:uppercase;">${text}</a>
        </td>
      </tr>
    </table>
  `;
}

// =====================================================================
// EMAIL TEMPLATES
// =====================================================================

function getDepositConfirmedEmail(data: any): { subject: string; html: string } {
  const {
    firstName,
    lastName,
    email,
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
    invoiceNumber,
    wantsInvoice,
    invoiceCompanyName,
    invoiceVatCode,
    invoiceAddress,
    shippingEur,
    discountEur,
    createdAt,
  } = data;

  const trackingUrl = trackingToken
    ? `${BASE_URL}/siuntos-sekimas/${orderNumber}?token=${trackingToken}`
    : `${BASE_URL}/uzsakymas?order_number=${orderNumber}`;

  const isFullPayment = !hasPreorder || Number(balanceEur) === 0;
  const orderDate = createdAt ? formatDate(new Date(createdAt)) : formatDate();

  // Items table (FOTO 1 style — Produktas | Viso)
  const itemsRows = (items || []).map((item: any) => {
    const qty = item.quantity || 1;
    const unitPrice = Number(item.unit_price_eur || item.unitPriceEur || 0);
    const lineTotal = unitPrice * qty;
    const title = item.title_snapshot || item.title || 'Prekė';
    const sku = item.sku_snapshot || item.sku || '';
    const detailLine = sku ? `SKU: ${sku} · Kiekis: ${qty}` : `Kiekis: ${qty}`;
    return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid ${COLOR_BORDER};vertical-align:top;">
          <p style="margin:0 0 4px;font-size:14px;color:${COLOR_TEXT};font-weight:600;">${title}</p>
          <p style="margin:0;font-size:12px;color:${COLOR_MUTED};">${detailLine}</p>
        </td>
        <td style="padding:16px 0;border-bottom:1px solid ${COLOR_BORDER};vertical-align:top;text-align:right;font-size:14px;color:${COLOR_TEXT};font-weight:600;white-space:nowrap;">${lineTotal.toFixed(2)}€</td>
      </tr>
    `;
  }).join('');

  const subtotal = (items || []).reduce((sum: number, item: any) =>
    sum + (Number(item.unit_price_eur || item.unitPriceEur || 0) * (item.quantity || 1)), 0);
  const shipping = Number(shippingEur || 0);
  const discount = Number(discountEur || 0);
  const grandTotal = Number(totalEur) || (subtotal + shipping - discount);

  const shippingLabel = getShippingMethodLabel(shippingMethod);
  const shippingAddrLine = formatShippingAddress(shippingAddress);
  const buyerName = `${firstName || ''} ${lastName || ''}`.trim();

  // Info table cells (top — like FOTO 1)
  const infoCells: InfoCell[] = [
    { label: 'Užsakymo nr.', value: orderNumber || '—' },
    { label: 'Data', value: orderDate },
    { label: 'El. paštas', value: email || '—' },
    { label: 'Viso', value: `${grandTotal.toFixed(2)}€` },
    { label: 'Mokėjimas', value: paymentMethod || 'Online' },
  ];

  // Buyer block
  const buyerBlock = `
    <p style="margin:0;font-weight:600;">${buyerName}</p>
    ${email ? `<p style="margin:0;color:${COLOR_MUTED};font-size:13px;">${email}</p>` : ''}
    ${wantsInvoice && invoiceCompanyName ? `<p style="margin:8px 0 0;">${invoiceCompanyName}</p>` : ''}
    ${wantsInvoice && invoiceVatCode ? `<p style="margin:0;color:${COLOR_MUTED};font-size:13px;">PVM: ${invoiceVatCode}</p>` : ''}
    ${wantsInvoice && invoiceAddress ? `<p style="margin:0;color:${COLOR_MUTED};font-size:13px;">${invoiceAddress}</p>` : ''}
  `;

  // Shipping block
  const shippingBlock = `
    <p style="margin:0;font-weight:600;">${shippingLabel}</p>
    <p style="margin:0;color:${COLOR_MUTED};font-size:13px;">${shippingAddrLine}</p>
  `;

  // PVM invoice (compact, same monochrome style)
  const vatRate = 0.21;
  const netTotal = grandTotal / (1 + vatRate);
  const vatAmount = grandTotal - netTotal;
  const invoiceItemsRows = (items || []).map((item: any) => {
    const qty = item.quantity || 1;
    const unitPrice = Number(item.unit_price_eur || item.unitPriceEur || 0);
    const lineTotal = unitPrice * qty;
    const lineNet = lineTotal / (1 + vatRate);
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid ${COLOR_BORDER};font-size:12px;color:${COLOR_TEXT};">${item.title_snapshot || item.title}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${COLOR_BORDER};font-size:12px;color:${COLOR_MUTED};text-align:center;">${item.sku_snapshot || '-'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${COLOR_BORDER};font-size:12px;text-align:center;">${qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${COLOR_BORDER};font-size:12px;text-align:right;">${lineNet.toFixed(2)}€</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${COLOR_BORDER};font-size:12px;text-align:right;font-weight:600;">${lineTotal.toFixed(2)}€</td>
      </tr>
    `;
  }).join('');

  const content = `
    ${getHeroBlock('Užsakymas gautas', 'Dėkojame, ' + (firstName || '') + '!', 'Jūsų užsakymas sėkmingai priimtas. Žemiau rasite visą informaciją.')}

    ${getInfoTable(infoCells)}

    <div style="margin-bottom:32px;">
      ${getSectionTitle('Užsakymo informacija')}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <thead>
          <tr>
            <th style="padding:0 0 12px;text-align:left;font-size:11px;color:${COLOR_MUTED};font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">Produktas</th>
            <th style="padding:0 0 12px;text-align:right;font-size:11px;color:${COLOR_MUTED};font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">Viso</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">Suma</td>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">${subtotal.toFixed(2)}€</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">Pristatymas (${shippingLabel})</td>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">${shipping > 0 ? shipping.toFixed(2) + '€' : 'Nemokamas'}</td>
        </tr>
        ${discount > 0 ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">Nuolaida</td>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">−${discount.toFixed(2)}€</td>
          </tr>
        ` : ''}
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">Mokėjimo būdas</td>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">${paymentMethod || 'Online'}</td>
        </tr>
        <tr>
          <td style="padding:14px 0 6px;border-top:2px solid ${COLOR_TEXT};font-size:16px;color:${COLOR_TEXT};font-weight:700;">Viso (su PVM)</td>
          <td style="padding:14px 0 6px;border-top:2px solid ${COLOR_TEXT};font-size:16px;color:${COLOR_TEXT};font-weight:700;text-align:right;">${grandTotal.toFixed(2)}€</td>
        </tr>
        ${!isFullPayment ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">Sumokėtas depozitas</td>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">${Number(depositEur).toFixed(2)}€</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">Liks apmokėti</td>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};font-weight:600;text-align:right;">${Number(balanceEur).toFixed(2)}€</td>
          </tr>
        ` : ''}
      </table>

      ${hasPreorder && etaWeeksMin && etaWeeksMax ? `
        <p style="margin:16px 0 0;padding:12px 16px;background:${COLOR_ACCENT};font-size:13px;color:${COLOR_TEXT};">
          <strong>Numatomas pristatymas:</strong> ${etaWeeksMin}–${etaWeeksMax} sav. Likučio apmokėjimo nuorodą atsiųsime kai užsakymas bus paruoštas.
        </p>
      ` : ''}
    </div>

    ${getAddressBlock('Pirkėjas', buyerBlock, 'Pristatymas', shippingBlock)}

    <div style="text-align:center;margin:40px 0 8px;">
      ${getCtaButton('Sekti užsakymą', trackingUrl)}
    </div>

    <div style="margin-top:48px;padding-top:32px;border-top:2px solid ${COLOR_TEXT};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td>
            <p style="margin:0;font-size:18px;font-weight:800;color:${COLOR_TEXT};letter-spacing:1px;">PVM SĄSKAITA FAKTŪRA</p>
            <p style="margin:4px 0 0;font-size:12px;color:${COLOR_MUTED};">Nr. ${invoiceNumber || 'Generuojama'} · Data: ${orderDate}</p>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <p style="margin:0;font-size:14px;font-weight:700;color:${COLOR_TEXT};">IBRIX</p>
            <p style="margin:2px 0 0;font-size:12px;color:${COLOR_MUTED};">ibrix.lt · info@ibrix.lt</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;border:1px solid ${COLOR_BORDER};">
        <thead>
          <tr style="background:${COLOR_ACCENT};">
            <th style="padding:10px 12px;text-align:left;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">Prekė</th>
            <th style="padding:10px 12px;text-align:center;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">SKU</th>
            <th style="padding:10px 12px;text-align:center;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">Kiek.</th>
            <th style="padding:10px 12px;text-align:right;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">Be PVM</th>
            <th style="padding:10px 12px;text-align:right;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">Su PVM</th>
          </tr>
        </thead>
        <tbody>${invoiceItemsRows}</tbody>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td></td>
          <td style="width:280px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:6px 0;font-size:12px;color:${COLOR_MUTED};">Suma be PVM:</td>
                <td style="padding:6px 0;font-size:12px;color:${COLOR_TEXT};text-align:right;">${netTotal.toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:12px;color:${COLOR_MUTED};">PVM (21%):</td>
                <td style="padding:6px 0;font-size:12px;color:${COLOR_TEXT};text-align:right;">${vatAmount.toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-top:2px solid ${COLOR_TEXT};font-size:14px;color:${COLOR_TEXT};font-weight:700;">Viso:</td>
                <td style="padding:10px 0;border-top:2px solid ${COLOR_TEXT};font-size:14px;color:${COLOR_TEXT};font-weight:700;text-align:right;">${grandTotal.toFixed(2)}€</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0;font-size:11px;color:${COLOR_MUTED};text-align:center;">
        Ši sąskaita faktūra yra automatiškai sugeneruota ir galioja be parašo.
      </p>
    </div>
  `;

  return {
    subject: isFullPayment
      ? `Užsakymas ${orderNumber} — patvirtintas`
      : `Užsakymas ${orderNumber} — depozitas gautas`,
    html: getEmailWrapper(content, {
      title: `Užsakymas ${orderNumber}`,
      preheader: `Ačiū ${firstName || ''}! Užsakymas ${orderNumber} priimtas. Viso: ${grandTotal.toFixed(2)}€`,
    }),
  };
}

function getBalanceRequestEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, balanceEur, paymentUrl, customMessage } = data;

  const content = `
    ${getHeroBlock('Likučio apmokėjimas', 'Jūsų užsakymas paruoštas', `Sveiki, ${firstName}. Liko apmokėti likutį, kad pradėtumėme siuntimą.`)}

    ${getInfoTable([
      { label: 'Užsakymo nr.', value: orderNumber },
      { label: 'Liko apmokėti', value: `${Number(balanceEur).toFixed(2)}€` },
    ])}

    ${customMessage ? `
      <div style="margin-bottom:32px;padding:20px;background:${COLOR_ACCENT};border-left:3px solid ${COLOR_TEXT};">
        <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.6;font-style:italic;">${customMessage}</p>
      </div>
    ` : ''}

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton('Apmokėti dabar', paymentUrl)}
      <p style="margin:16px 0 0;font-size:12px;color:${COLOR_MUTED};">Apmokėjus iškart pradėsime ruošti siuntą.</p>
    </div>
  `;

  return {
    subject: `Užsakymas ${orderNumber} — liko apmokėti ${Number(balanceEur).toFixed(2)}€`,
    html: getEmailWrapper(content, {
      title: `Likučio apmokėjimas ${orderNumber}`,
      preheader: `Liko apmokėti ${Number(balanceEur).toFixed(2)}€ už užsakymą ${orderNumber}`,
    }),
  };
}

function getBalancePaidEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, amountEur } = data;

  const content = `
    ${getHeroBlock('Mokėjimas gautas', `Ačiū, ${firstName}!`, 'Jūsų likučio apmokėjimas sėkmingai priimtas.')}

    ${getInfoTable([
      { label: 'Užsakymo nr.', value: orderNumber },
      { label: 'Apmokėta', value: `${Number(amountEur).toFixed(2)}€` },
      { label: 'Statusas', value: 'Apmokėta' },
    ])}

    <div style="padding:20px;background:${COLOR_ACCENT};text-align:center;margin-bottom:32px;">
      <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.6;">
        Pradedame ruošti jūsų siuntą. Kai išsiųsime, gausite sekimo numerį el. paštu.
      </p>
    </div>
  `;

  return {
    subject: `Užsakymas ${orderNumber} — mokėjimas gautas`,
    html: getEmailWrapper(content, {
      title: `Mokėjimas gautas ${orderNumber}`,
      preheader: `${Number(amountEur).toFixed(2)}€ apmokėta. Pradedame siuntimą.`,
    }),
  };
}

function getShippedEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, trackingNumber, carrierName, trackingUrl } = data;

  const content = `
    ${getHeroBlock('Siunta išsiųsta', 'Jūsų užsakymas pakeliui', `Sveiki${firstName ? ', ' + firstName : ''}. Užsakymas ${orderNumber} jau išsiųstas.`)}

    ${getInfoTable([
      { label: 'Užsakymo nr.', value: orderNumber },
      { label: 'Vežėjas', value: carrierName || 'Kurjeris' },
      { label: 'Sekimo nr.', value: trackingNumber || '—' },
    ])}

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton('Sekti siuntą', trackingUrl)}
    </div>
  `;

  return {
    subject: `Užsakymas ${orderNumber} — išsiųsta`,
    html: getEmailWrapper(content, {
      title: `Siunta išsiųsta ${orderNumber}`,
      preheader: `Vežėjas: ${carrierName || 'Kurjeris'} · Sekimo nr.: ${trackingNumber || ''}`,
    }),
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
    ${getHeroBlock('Klientų aptarnavimas', 'Nauja kliento užklausa', `Tipas: ${requestTypeLabels[requestType] || requestType}`)}

    ${getInfoTable([
      { label: 'Užsakymas', value: orderNumber },
      { label: 'Klientas', value: userEmail },
      { label: 'Tipas', value: requestTypeLabels[requestType] || requestType },
    ])}

    <div>
      ${getSectionTitle('Pranešimas')}
      <div style="padding:20px;background:${COLOR_ACCENT};font-size:14px;color:${COLOR_TEXT};line-height:1.6;white-space:pre-wrap;">${message}</div>
    </div>
  `;

  return {
    subject: `[SUPPORT] Užsakymas ${orderNumber} — ${requestTypeLabels[requestType] || requestType}`,
    html: getEmailWrapper(content, { title: 'Nauja užklausa' }),
  };
}

function getGiftCardEmail(data: any): { subject: string; html: string } {
  const { recipientName, senderName, code, amount, personalMessage } = data;

  const content = `
    ${getHeroBlock('Dovanų kuponas', `Sveiki, ${recipientName}!`, `${senderName || 'Draugas'} atsiuntė jums IBRIX dovanų kuponą.`)}

    <div style="background:${COLOR_BRAND};padding:40px 24px;text-align:center;margin-bottom:32px;">
      <p style="margin:0 0 8px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:2px;">Kupono vertė</p>
      <p style="margin:0 0 24px;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:-1px;">${amount}€</p>
      <div style="background:rgba(255,255,255,0.1);padding:14px 20px;display:inline-block;">
        <p style="margin:0;font-family:'Courier New',monospace;font-size:20px;color:#ffffff;letter-spacing:3px;font-weight:700;">${code}</p>
      </div>
    </div>

    ${personalMessage ? `
      <div style="margin-bottom:32px;padding:20px;background:${COLOR_ACCENT};border-left:3px solid ${COLOR_TEXT};">
        <p style="margin:0;font-size:14px;color:${COLOR_TEXT};font-style:italic;line-height:1.6;">"${personalMessage}"</p>
        <p style="margin:8px 0 0;font-size:12px;color:${COLOR_MUTED};">— ${senderName || 'Draugas'}</p>
      </div>
    ` : ''}

    <div style="margin-bottom:32px;">
      ${getSectionTitle('Kaip panaudoti')}
      <ol style="margin:0;padding-left:20px;font-size:14px;color:${COLOR_TEXT};line-height:1.8;">
        <li>Prisijunkite prie <a href="${BASE_URL}/auth" style="color:${COLOR_LINK};">ibrix.lt</a></li>
        <li>Eikite į „Mano paskyra" → „Aktyvuoti dovanų kuponą"</li>
        <li>Įveskite kodą: <strong>${code}</strong></li>
      </ol>
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton('Aktyvuoti kuponą', `${BASE_URL}/auth`)}
    </div>
  `;

  return {
    subject: `${senderName || 'Draugas'} atsiuntė jums ${amount}€ IBRIX kuponą`,
    html: getEmailWrapper(content, {
      title: 'IBRIX dovanų kuponas',
      preheader: `${amount}€ kuponas · Kodas: ${code}`,
    }),
  };
}

function getGiftCardConfirmationEmail(data: any): { subject: string; html: string } {
  const { recipientName, amount, code } = data;

  const content = `
    ${getHeroBlock('Pirkimas patvirtintas', 'Dovanų kuponas išsiųstas', 'Jūsų pirktas kuponas sėkmingai pasiekė gavėją.')}

    ${getInfoTable([
      { label: 'Gavėjas', value: recipientName },
      { label: 'Vertė', value: `${amount}€` },
      { label: 'Kodas', value: code },
    ])}

    <p style="margin:0;text-align:center;font-size:14px;color:${COLOR_MUTED};">
      Gavėjas gavo el. laišką su kuponu ir aktyvavimo instrukcijomis.
    </p>
  `;

  return {
    subject: `Dovanų kuponas ${amount}€ — pirkimas patvirtintas`,
    html: getEmailWrapper(content, { title: 'Kuponas išsiųstas' }),
  };
}

function getNewsletterEmail(data: any): { subject: string; html: string } {
  const { firstName, subject, content } = data;

  const htmlContent = content
    .split('\n\n')
    .map((p: string) => `<p style="margin:0 0 16px;font-size:14px;color:${COLOR_TEXT};line-height:1.7;">${p}</p>`)
    .join('');

  const emailContent = `
    ${getHeroBlock('Naujienlaiškis', `Sveiki, ${firstName}!`)}
    <div>${htmlContent}</div>
  `;

  return {
    subject,
    html: getEmailWrapper(emailContent, { title: subject }),
  };
}

function getAdminOrderNotificationEmail(data: any): { subject: string; html: string } {
  const {
    orderNumber, customerName, customerEmail, customerPhone,
    items, subtotalEur, discountEur, shippingEur, totalEur,
    depositEur, balanceEur, shippingMethod, shippingAddress,
    paymentMethod, hasPreorder, etaWeeksMin, etaWeeksMax,
  } = data;

  const itemsRows = (items || []).map((item: any) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid ${COLOR_BORDER};">
        <p style="margin:0;font-size:13px;color:${COLOR_TEXT};font-weight:600;">${item.title_snapshot || item.title}</p>
        <p style="margin:4px 0 0;font-size:11px;color:${COLOR_MUTED};">SKU: ${item.sku_snapshot || '-'}</p>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid ${COLOR_BORDER};text-align:center;font-size:13px;">${item.quantity}</td>
      <td style="padding:12px 8px;border-bottom:1px solid ${COLOR_BORDER};text-align:right;font-size:13px;font-weight:600;">${(Number(item.unit_price_eur || item.unitPriceEur) * item.quantity).toFixed(2)}€</td>
    </tr>
  `).join('');

  const content = `
    ${getHeroBlock('Admin · Naujas užsakymas', orderNumber, `${customerName} · ${hasPreorder ? 'Depozitas' : 'Pilnas mokėjimas'}: ${Number(depositEur).toFixed(2)}€`)}

    ${getInfoTable([
      { label: 'Užsakymas', value: orderNumber },
      { label: 'Klientas', value: customerName },
      { label: 'Apmokėta', value: `${Number(depositEur).toFixed(2)}€` },
      { label: 'Viso', value: `${Number(totalEur).toFixed(2)}€` },
      { label: 'Mokėjimas', value: paymentMethod || 'Online' },
    ])}

    <div style="margin-bottom:32px;">
      ${getSectionTitle('Kontaktai')}
      <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.7;">
        <a href="mailto:${customerEmail}" style="color:${COLOR_LINK};">${customerEmail}</a>
        ${customerPhone ? `<br><a href="tel:${customerPhone}" style="color:${COLOR_LINK};">${customerPhone}</a>` : ''}
      </p>
    </div>

    <div style="margin-bottom:32px;">
      ${getSectionTitle('Prekės')}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <thead>
          <tr>
            <th style="padding:0 8px 10px;text-align:left;font-size:11px;color:${COLOR_MUTED};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">Prekė</th>
            <th style="padding:0 8px 10px;text-align:center;font-size:11px;color:${COLOR_MUTED};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">Kiek.</th>
            <th style="padding:0 8px 10px;text-align:right;font-size:11px;color:${COLOR_MUTED};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">Suma</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
    </div>

    <div style="margin-bottom:32px;">
      ${getSectionTitle('Pristatymas')}
      <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.6;">
        ${getShippingMethodLabel(shippingMethod)}<br>
        <span style="color:${COLOR_MUTED};">${formatShippingAddress(shippingAddress)}</span>
      </p>
      ${hasPreorder && etaWeeksMin && etaWeeksMax ? `<p style="margin:8px 0 0;padding:10px;background:${COLOR_ACCENT};font-size:13px;">ETA: ${etaWeeksMin}–${etaWeeksMax} sav.</p>` : ''}
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton('Atidaryti admin', `${BASE_URL}/admin`)}
    </div>
  `;

  return {
    subject: `Naujas užsakymas ${orderNumber} — ${Number(depositEur).toFixed(2)}€`,
    html: getEmailWrapper(content, { title: `Naujas užsakymas ${orderNumber}` }),
  };
}

function getInquiryReplyEmail(data: any): { subject: string; html: string } {
  const { customerName, replyMessage, conversationUrl, originalTopic } = data;

  const content = `
    ${getHeroBlock('Atsakymas į užklausą', `Sveiki, ${customerName}!`, `Atsakėme į jūsų užklausą: ${originalTopic}`)}

    <div style="margin-bottom:32px;padding:20px;background:${COLOR_ACCENT};border-left:3px solid ${COLOR_TEXT};">
      <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.7;white-space:pre-wrap;">${replyMessage}</p>
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton('Tęsti pokalbį', conversationUrl)}
    </div>
  `;

  return {
    subject: `Atsakymas į jūsų užklausą — ${originalTopic}`,
    html: getEmailWrapper(content, { title: 'Atsakymas į užklausą' }),
  };
}

function getAdminInquiryNotificationEmail(data: any): { subject: string; html: string } {
  const { customerName, customerEmail, topic, message, conversationUrl } = data;

  const content = `
    ${getHeroBlock('Admin · Naujas atsakymas', customerName, topic)}

    ${getInfoTable([
      { label: 'Klientas', value: customerName },
      { label: 'El. paštas', value: customerEmail },
      { label: 'Tema', value: topic },
    ])}

    <div style="margin-bottom:32px;">
      ${getSectionTitle('Žinutė')}
      <div style="padding:20px;background:${COLOR_ACCENT};font-size:14px;color:${COLOR_TEXT};line-height:1.6;white-space:pre-wrap;">${message}</div>
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton('Atidaryti pokalbį', conversationUrl)}
    </div>
  `;

  return {
    subject: `Naujas atsakymas nuo ${customerName} — ${topic}`,
    html: getEmailWrapper(content, { title: 'Naujas atsakymas' }),
  };
}

function getInquiryReceivedEmail(data: any): { subject: string; html: string } {
  const { firstName, topic, message, orderNumber, conversationToken } = data;
  const conversationUrl = conversationToken ? `${BASE_URL}/pokalbis/${conversationToken}` : BASE_URL;

  const content = `
    ${getHeroBlock('Užklausa gauta', `Ačiū, ${firstName}!`, 'Gavome jūsų žinutę ir greitai atsakysime.')}

    ${getInfoTable([
      { label: 'Tema', value: topic },
      ...(orderNumber ? [{ label: 'Užsakymas', value: orderNumber }] : []),
      { label: 'Atsakysime per', value: '24 val.' },
    ])}

    <div style="margin-bottom:32px;">
      ${getSectionTitle('Jūsų žinutė')}
      <div style="padding:20px;background:${COLOR_ACCENT};font-size:14px;color:${COLOR_TEXT};line-height:1.6;white-space:pre-wrap;">${message}</div>
    </div>

    ${conversationToken ? `
      <div style="text-align:center;margin:40px 0;">
        ${getCtaButton('Peržiūrėti pokalbį', conversationUrl)}
      </div>
    ` : ''}
  `;

  return {
    subject: `Gavome jūsų užklausą — ${topic}`,
    html: getEmailWrapper(content, { title: 'Užklausa gauta' }),
  };
}

function getPasswordResetEmail(data: any): { subject: string; html: string } {
  const { email, resetUrl, firstName } = data;

  const content = `
    ${getHeroBlock('Slaptažodžio atkūrimas', 'Atkurti slaptažodį', `Sveiki${firstName ? ', ' + firstName : ''}. Gavome prašymą atkurti jūsų IBRIX paskyros slaptažodį.`)}

    ${getInfoTable([
      { label: 'Paskyra', value: email },
      { label: 'Galioja', value: '1 val.' },
    ])}

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton('Atkurti slaptažodį', resetUrl)}
      <p style="margin:16px 0 0;font-size:12px;color:${COLOR_MUTED};">
        Jei mygtukas neveikia, nukopijuokite šią nuorodą:<br>
        <a href="${resetUrl}" style="color:${COLOR_LINK};word-break:break-all;">${resetUrl}</a>
      </p>
    </div>

    <div style="padding:16px;background:${COLOR_ACCENT};font-size:13px;color:${COLOR_MUTED};line-height:1.6;text-align:center;">
      Jei neprašėte atkurti slaptažodžio, ignoruokite šį laišką. Jūsų paskyra išliks saugi.
    </div>
  `;

  return {
    subject: 'IBRIX — slaptažodžio atkūrimas',
    html: getEmailWrapper(content, {
      title: 'Slaptažodžio atkūrimas',
      preheader: 'Atkurkite IBRIX slaptažodį per 1 val.',
    }),
  };
}

function getVerificationCodeEmail(data: any): { subject: string; html: string } {
  const { firstName, code, email } = data;

  const content = `
    ${getHeroBlock('Patvirtinimas', `Sveiki${firstName ? ', ' + firstName : ''}!`, 'Įveskite šį kodą norėdami patvirtinti savo el. paštą.')}

    <div style="text-align:center;padding:32px 24px;background:${COLOR_ACCENT};margin-bottom:32px;">
      <p style="margin:0 0 12px;font-size:11px;color:${COLOR_MUTED};text-transform:uppercase;letter-spacing:2px;font-weight:600;">Jūsų kodas</p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:42px;font-weight:800;color:${COLOR_TEXT};letter-spacing:12px;">${code}</p>
    </div>

    ${getInfoTable([
      ...(email ? [{ label: 'Paskyra', value: email }] : []),
      { label: 'Galioja', value: '15 min.' },
    ])}

    <div style="padding:16px;background:${COLOR_ACCENT};font-size:13px;color:${COLOR_MUTED};line-height:1.6;text-align:center;">
      Jei neprašėte šio kodo, ignoruokite šį laišką.
    </div>
  `;

  return {
    subject: `IBRIX — patvirtinimo kodas ${code}`,
    html: getEmailWrapper(content, {
      title: 'Patvirtinimo kodas',
      preheader: `Jūsų patvirtinimo kodas: ${code}`,
    }),
  };
}

function getWelcomeEmail(data: any): { subject: string; html: string } {
  const { firstName, lastName, email, username } = data;

  const content = `
    ${getHeroBlock('Sveiki atvykę!', `Sveiki, ${firstName}!`, 'Jūsų IBRIX paskyra sėkmingai sukurta.')}

    ${getInfoTable([
      { label: 'Vardas', value: `${firstName || ''} ${lastName || ''}`.trim() || '—' },
      { label: 'El. paštas', value: email || '—' },
      ...(username ? [{ label: 'Slapyvardis', value: username }] : []),
    ])}

    <div style="margin-bottom:32px;">
      ${getSectionTitle('Ką galite daryti')}
      <ul style="margin:0;padding-left:20px;font-size:14px;color:${COLOR_TEXT};line-height:1.8;">
        <li>Naršyti pilną <a href="${BASE_URL}/produktai" style="color:${COLOR_LINK};">konstruktorių katalogą</a></li>
        <li>Rinkti lojalumo taškus už kiekvieną pirkinį</li>
        <li>Gauti išankstinę prieigą prie naujų rinkinių</li>
        <li>Tvarkyti savo kolekciją <a href="${BASE_URL}/account" style="color:${COLOR_LINK};">savo paskyroje</a></li>
      </ul>
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton('Pradėti naršyti', `${BASE_URL}/produktai`)}
    </div>
  `;

  return {
    subject: 'Sveiki atvykę į IBRIX!',
    html: getEmailWrapper(content, {
      title: 'Sveiki atvykę į IBRIX',
      preheader: 'Jūsų IBRIX paskyra sėkmingai sukurta.',
    }),
  };
}

function getEmailChangeEmail(data: any): { subject: string; html: string } {
  const { firstName, confirmUrl, newEmail } = data;

  const content = `
    ${getHeroBlock('El. pašto keitimas', 'Patvirtinkite naują el. paštą', `Sveiki${firstName ? ', ' + firstName : ''}. Jūs paprašėte pakeisti savo IBRIX paskyros el. paštą.`)}

    ${getInfoTable([
      { label: 'Naujas el. paštas', value: newEmail },
      { label: 'Galioja', value: '24 val.' },
    ])}

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton('Patvirtinti el. paštą', confirmUrl)}
      <p style="margin:16px 0 0;font-size:12px;color:${COLOR_MUTED};">
        Jei mygtukas neveikia, nukopijuokite šią nuorodą:<br>
        <a href="${confirmUrl}" style="color:${COLOR_LINK};word-break:break-all;">${confirmUrl}</a>
      </p>
    </div>

    <div style="padding:16px;background:${COLOR_ACCENT};font-size:13px;color:${COLOR_MUTED};line-height:1.6;text-align:center;">
      Jei neprašėte pakeisti el. pašto, ignoruokite šį laišką.
    </div>
  `;

  return {
    subject: 'IBRIX — patvirtinkite naują el. paštą',
    html: getEmailWrapper(content, {
      title: 'Patvirtinkite el. paštą',
      preheader: `Patvirtinkite naują el. paštą: ${newEmail}`,
    }),
  };
}

// =====================================================================
// HELPERS
// =====================================================================

function getShippingMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    'omniva_locker': 'Omniva paštomatas',
    'lp_express_locker': 'LP Express paštomatas',
    'dpd_locker': 'DPD paštomatas',
    'venipak_locker': 'Venipak paštomatas',
    'courier': 'Kurjeris į namus',
  };
  return labels[method] || method || 'Pristatymas';
}

function formatShippingAddress(address: any): string {
  if (!address) return 'Nenurodyta';
  if (address.lockerAddress) {
    return `${address.lockerName || ''}${address.lockerName ? ', ' : ''}${address.lockerAddress}`;
  }
  if (address.street) {
    return `${address.street}, ${address.city || ''} ${address.postalCode || ''}`.trim();
  }
  return 'Nenurodyta';
}

// =====================================================================
// REQUEST HANDLER
// =====================================================================

Deno.serve(async (req: Request) => {
  const requestId = generateRequestId();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, dryRun, ...data } = await req.json();
    log(requestId, 'Email request received', { type, email, dryRun, orderNumber: data.orderNumber });

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
        emailContent = getGiftCardEmail(data.data || data);
        recipientEmail = data.data?.recipientEmail || data.recipientEmail || data.to || email;
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
      case 'email_change':
        emailContent = getEmailChangeEmail(data.data || data);
        recipientEmail = data.data?.newEmail || data.newEmail || email;
        break;
      default:
        log(requestId, 'Unknown email type', { type });
        return new Response(JSON.stringify({ error: 'Unknown email type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!recipientEmail && !dryRun) {
      log(requestId, 'Missing recipient email', { type });
      return new Response(JSON.stringify({ error: 'Missing recipient email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (dryRun) {
      log(requestId, 'Dry run - returning HTML preview');
      return new Response(JSON.stringify({
        success: true,
        dryRun: true,
        html: emailContent.html,
        subject: emailContent.subject,
        to: recipientEmail || 'preview@example.com',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey || resendApiKey === 'test' || resendApiKey.length < 10) {
      log(requestId, 'WARNING: RESEND_API_KEY not configured', { to: recipientEmail });
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

    const fromEmail = 'IBRIX <info@ibrix.lt>';

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
        log(requestId, 'DOMAIN NOT VERIFIED - Trying fallback sender', { error: emailData.message });
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
        if (!fallbackResponse.ok) throw new Error(fallbackData.message || 'Failed to send email via fallback');
        log(requestId, 'Email sent via fallback (resend.dev)', { emailId: fallbackData.id });
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
    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    log(requestId, 'Email error', { error: error.message, stack: error.stack });
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
