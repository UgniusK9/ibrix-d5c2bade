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
// LANGUAGE SUPPORT (lt default, en on demand)
// =====================================================================
// Callers pass `lang: 'lt' | 'en'` alongside the other template fields
// (inside the nested `data` object when one is used, otherwise top-level).
// Anything missing/other than 'en' falls back to Lithuanian, and the
// Lithuanian strings below are byte-identical to the original hardcoded copy.
type EmailLang = 'lt' | 'en';

function getLang(data: any): EmailLang {
  const raw = data?.lang ?? data?.data?.lang;
  return raw === 'en' ? 'en' : 'lt';
}

// Shared dictionary for recurring user-facing labels (info-table labels,
// section titles, totals rows, buttons, footer). Longer sentences live as
// per-template `en ? ... : ...` conditionals next to the Lithuanian original.
function strings(lang: EmailLang): Record<string, string> {
  const en = lang === 'en';
  return {
    orderNo: en ? 'Order no.' : 'Užsakymo nr.',
    date: en ? 'Date' : 'Data',
    email: en ? 'Email' : 'El. paštas',
    total: en ? 'Total' : 'Viso',
    payment: en ? 'Payment' : 'Mokėjimas',
    balanceDue: en ? 'Balance due' : 'Liko apmokėti',
    paid: en ? 'Paid' : 'Apmokėta',
    status: en ? 'Status' : 'Statusas',
    carrier: en ? 'Carrier' : 'Vežėjas',
    trackingNo: en ? 'Tracking no.' : 'Sekimo nr.',
    order: en ? 'Order' : 'Užsakymas',
    customer: en ? 'Customer' : 'Klientas',
    type: en ? 'Type' : 'Tipas',
    recipient: en ? 'Recipient' : 'Gavėjas',
    value: en ? 'Value' : 'Vertė',
    code: en ? 'Code' : 'Kodas',
    account: en ? 'Account' : 'Paskyra',
    validFor: en ? 'Valid for' : 'Galioja',
    name: en ? 'Name' : 'Vardas',
    nickname: en ? 'Nickname' : 'Slapyvardis',
    topic: en ? 'Subject' : 'Tema',
    replyWithin: en ? 'Reply within' : 'Atsakysime per',
    newEmail: en ? 'New email' : 'Naujas el. paštas',
    product: en ? 'Product' : 'Produktas',
    item: en ? 'Item' : 'Prekė',
    products: en ? 'Products' : 'Prekės',
    qty: en ? 'Qty' : 'Kiek.',
    qtyWord: en ? 'Qty' : 'Kiekis',
    exVat: en ? 'Ex VAT' : 'Be PVM',
    inclVat: en ? 'Incl. VAT' : 'Su PVM',
    subtotal: en ? 'Subtotal' : 'Suma',
    delivery: en ? 'Delivery' : 'Pristatymas',
    free: en ? 'Free' : 'Nemokamas',
    discount: en ? 'Discount' : 'Nuolaida',
    paymentMethod: en ? 'Payment method' : 'Mokėjimo būdas',
    totalInclVat: en ? 'Total (incl. VAT)' : 'Viso (su PVM)',
    depositPaid: en ? 'Deposit paid' : 'Sumokėtas depozitas',
    subtotalExVat: en ? 'Subtotal ex VAT:' : 'Suma be PVM:',
    vatRate: en ? 'VAT (21%):' : 'PVM (21%):',
    totalColon: en ? 'Total:' : 'Viso:',
    buyer: en ? 'Customer' : 'Pirkėjas',
    contacts: en ? 'Contacts' : 'Kontaktai',
    message: en ? 'Message' : 'Pranešimas',
    yourMessage: en ? 'Your message' : 'Jūsų žinutė',
    messageShort: en ? 'Message' : 'Žinutė',
    orderDetails: en ? 'Order details' : 'Užsakymo informacija',
    howToRedeem: en ? 'How to redeem' : 'Kaip panaudoti',
    whatYouCanDo: en ? 'What you can do' : 'Ką galite daryti',
    questions: en ? 'Questions?' : 'Klausimai?',
    rights: en ? 'All rights reserved.' : 'Visos teisės saugomos.',
    privacy: en ? 'Privacy policy' : 'Privatumo politika',
    cookies: en ? 'Cookie policy' : 'Slapukai',
    help: en ? 'Help' : 'Pagalba',
    ctaTrackOrder: en ? 'Track your order' : 'Sekti užsakymą',
    ctaTrackParcel: en ? 'Track parcel' : 'Sekti siuntą',
    ctaPayNow: en ? 'Pay now' : 'Apmokėti dabar',
    ctaActivate: en ? 'Activate gift card' : 'Aktyvuoti kuponą',
    ctaOpenAdmin: en ? 'Open admin' : 'Atidaryti admin',
    ctaContinue: en ? 'Continue conversation' : 'Tęsti pokalbį',
    ctaOpenConvo: en ? 'Open conversation' : 'Atidaryti pokalbį',
    ctaViewConvo: en ? 'View conversation' : 'Peržiūrėti pokalbį',
    ctaReset: en ? 'Reset password' : 'Atkurti slaptažodį',
    ctaConfirmEmail: en ? 'Confirm email' : 'Patvirtinti el. paštą',
    ctaBrowse: en ? 'Start browsing' : 'Pradėti naršyti',
    notSpecified: en ? 'Not specified' : 'Nenurodyta',
    courier: en ? 'Courier' : 'Kurjeris',
    courierHome: en ? 'Courier to your door' : 'Kurjeris į namus',
    deliveryFallback: en ? 'Delivery' : 'Pristatymas',
    deposit: en ? 'Deposit' : 'Depozitas',
    fullPayment: en ? 'Full payment' : 'Pilnas mokėjimas',
  };
}

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

function getEmailFooter(lang: EmailLang = 'lt'): string {
  const s = strings(lang);
  return `
    <tr>
      <td style="padding:32px 40px;background:${COLOR_ACCENT};border-top:1px solid ${COLOR_BORDER};text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:${COLOR_TEXT};font-weight:600;letter-spacing:0.5px;">IBRIX</p>
        <p style="margin:0 0 16px;font-size:12px;color:${COLOR_MUTED};line-height:1.6;">
          ${s.questions} <a href="mailto:pagalba@ibrix.lt" style="color:${COLOR_TEXT};text-decoration:underline;">pagalba@ibrix.lt</a>
          &nbsp;·&nbsp;
          <a href="${BASE_URL}" style="color:${COLOR_TEXT};text-decoration:underline;">ibrix.lt</a>
        </p>
        <p style="margin:0;font-size:11px;color:${COLOR_MUTED};letter-spacing:0.3px;">
          © ${currentYear()} IBRIX. ${s.rights}
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:${COLOR_MUTED};">
          <a href="${BASE_URL}/privatumo-politika" style="color:${COLOR_MUTED};text-decoration:underline;">${s.privacy}</a>
          <span style="padding:0 6px;">·</span>
          <a href="${BASE_URL}/slapukai-politika" style="color:${COLOR_MUTED};text-decoration:underline;">${s.cookies}</a>
          <span style="padding:0 6px;">·</span>
          <a href="${BASE_URL}/pagalba" style="color:${COLOR_MUTED};text-decoration:underline;">${s.help}</a>
        </p>
      </td>
    </tr>
  `;
}

interface WrapOptions {
  title?: string;
  preheader?: string;
}

function getEmailWrapper(content: string, options: WrapOptions = {}, lang: EmailLang = 'lt'): string {
  const title = options.title || 'IBRIX';
  const preheader = options.preheader || '';
  return `<!DOCTYPE html>
<html lang="${lang}">
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
          ${getEmailFooter(lang)}
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

  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

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
    const title = item.title_snapshot || item.title || (en ? 'Product' : 'Prekė');
    const sku = item.sku_snapshot || item.sku || '';
    const detailLine = sku ? `SKU: ${sku} · ${s.qtyWord}: ${qty}` : `${s.qtyWord}: ${qty}`;
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

  const shippingLabel = getShippingMethodLabel(shippingMethod, lang);
  const shippingAddrLine = formatShippingAddress(shippingAddress, lang);
  const buyerName = `${firstName || ''} ${lastName || ''}`.trim();

  // Info table cells (top — like FOTO 1)
  const infoCells: InfoCell[] = [
    { label: s.orderNo, value: orderNumber || '-' },
    { label: s.date, value: orderDate },
    { label: s.email, value: email || '-' },
    { label: s.total, value: `${grandTotal.toFixed(2)}€` },
    { label: s.payment, value: paymentMethod || 'Online' },
  ];

  // Buyer block
  const buyerBlock = `
    <p style="margin:0;font-weight:600;">${buyerName}</p>
    ${email ? `<p style="margin:0;color:${COLOR_MUTED};font-size:13px;">${email}</p>` : ''}
    ${wantsInvoice && invoiceCompanyName ? `<p style="margin:8px 0 0;">${invoiceCompanyName}</p>` : ''}
    ${wantsInvoice && invoiceVatCode ? `<p style="margin:0;color:${COLOR_MUTED};font-size:13px;">${en ? 'VAT' : 'PVM'}: ${invoiceVatCode}</p>` : ''}
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
    ${getHeroBlock(en ? 'Order received' : 'Užsakymas gautas', (en ? 'Thank you, ' : 'Dėkojame, ') + (firstName || '') + '!', en ? 'Your order has been placed successfully. You will find all the details below.' : 'Jūsų užsakymas sėkmingai priimtas. Žemiau rasite visą informaciją.')}

    ${getInfoTable(infoCells)}

    <div style="margin-bottom:32px;">
      ${getSectionTitle(s.orderDetails)}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <thead>
          <tr>
            <th style="padding:0 0 12px;text-align:left;font-size:11px;color:${COLOR_MUTED};font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">${s.product}</th>
            <th style="padding:0 0 12px;text-align:right;font-size:11px;color:${COLOR_MUTED};font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">${s.total}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">${s.subtotal}</td>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">${subtotal.toFixed(2)}€</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">${s.delivery} (${shippingLabel})</td>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">${shipping > 0 ? shipping.toFixed(2) + '€' : s.free}</td>
        </tr>
        ${discount > 0 ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">${s.discount}</td>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">−${discount.toFixed(2)}€</td>
          </tr>
        ` : ''}
        <tr>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">${s.paymentMethod}</td>
          <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">${paymentMethod || 'Online'}</td>
        </tr>
        <tr>
          <td style="padding:14px 0 6px;border-top:2px solid ${COLOR_TEXT};font-size:16px;color:${COLOR_TEXT};font-weight:700;">${s.totalInclVat}</td>
          <td style="padding:14px 0 6px;border-top:2px solid ${COLOR_TEXT};font-size:16px;color:${COLOR_TEXT};font-weight:700;text-align:right;">${grandTotal.toFixed(2)}€</td>
        </tr>
        ${!isFullPayment ? `
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">${s.depositPaid}</td>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};text-align:right;">${Number(depositEur).toFixed(2)}€</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_MUTED};">${s.balanceDue}</td>
            <td style="padding:6px 0;font-size:13px;color:${COLOR_TEXT};font-weight:600;text-align:right;">${Number(balanceEur).toFixed(2)}€</td>
          </tr>
        ` : ''}
      </table>

      ${hasPreorder && etaWeeksMin && etaWeeksMax ? `
        <p style="margin:16px 0 0;padding:12px 16px;background:${COLOR_ACCENT};font-size:13px;color:${COLOR_TEXT};">
          <strong>${en ? 'Estimated delivery:' : 'Numatomas pristatymas:'}</strong> ${etaWeeksMin}–${etaWeeksMax} ${en ? 'weeks. We will send the balance payment link once your order is ready.' : 'sav. Likučio apmokėjimo nuorodą atsiųsime kai užsakymas bus paruoštas.'}
        </p>
      ` : ''}
    </div>

    ${getAddressBlock(s.buyer, buyerBlock, s.delivery, shippingBlock)}

    <div style="text-align:center;margin:40px 0 8px;">
      ${getCtaButton(s.ctaTrackOrder, trackingUrl)}
    </div>

    <div style="margin-top:48px;padding-top:32px;border-top:2px solid ${COLOR_TEXT};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td>
            <p style="margin:0;font-size:18px;font-weight:800;color:${COLOR_TEXT};letter-spacing:1px;">${en ? 'VAT INVOICE' : 'PVM SĄSKAITA FAKTŪRA'}</p>
            <p style="margin:4px 0 0;font-size:12px;color:${COLOR_MUTED};">${en ? 'No.' : 'Nr.'} ${invoiceNumber || (en ? 'Pending' : 'Generuojama')} · ${en ? 'Date' : 'Data'}: ${orderDate}</p>
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
            <th style="padding:10px 12px;text-align:left;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">${s.item}</th>
            <th style="padding:10px 12px;text-align:center;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">SKU</th>
            <th style="padding:10px 12px;text-align:center;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">${s.qty}</th>
            <th style="padding:10px 12px;text-align:right;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">${s.exVat}</th>
            <th style="padding:10px 12px;text-align:right;font-size:10px;color:${COLOR_MUTED};font-weight:700;text-transform:uppercase;letter-spacing:1px;">${s.inclVat}</th>
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
                <td style="padding:6px 0;font-size:12px;color:${COLOR_MUTED};">${s.subtotalExVat}</td>
                <td style="padding:6px 0;font-size:12px;color:${COLOR_TEXT};text-align:right;">${netTotal.toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:12px;color:${COLOR_MUTED};">${s.vatRate}</td>
                <td style="padding:6px 0;font-size:12px;color:${COLOR_TEXT};text-align:right;">${vatAmount.toFixed(2)}€</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-top:2px solid ${COLOR_TEXT};font-size:14px;color:${COLOR_TEXT};font-weight:700;">${s.totalColon}</td>
                <td style="padding:10px 0;border-top:2px solid ${COLOR_TEXT};font-size:14px;color:${COLOR_TEXT};font-weight:700;text-align:right;">${grandTotal.toFixed(2)}€</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0;font-size:11px;color:${COLOR_MUTED};text-align:center;">
        ${en ? 'This invoice was generated automatically and is valid without a signature.' : 'Ši sąskaita faktūra yra automatiškai sugeneruota ir galioja be parašo.'}
      </p>
    </div>
  `;

  return {
    subject: isFullPayment
      ? (en ? `Order ${orderNumber}, confirmed` : `Užsakymas ${orderNumber}, patvirtintas`)
      : (en ? `Order ${orderNumber}, deposit received` : `Užsakymas ${orderNumber}, depozitas gautas`),
    html: getEmailWrapper(content, {
      title: en ? `Order ${orderNumber}` : `Užsakymas ${orderNumber}`,
      preheader: en ? `Thank you, ${firstName || ''}! Order ${orderNumber} received. Total: ${grandTotal.toFixed(2)}€` : `Ačiū ${firstName || ''}! Užsakymas ${orderNumber} priimtas. Viso: ${grandTotal.toFixed(2)}€`,
    }, lang),
  };
}

function getBalanceRequestEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, balanceEur, paymentUrl, customMessage } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const content = `
    ${getHeroBlock(en ? 'Balance payment' : 'Likučio apmokėjimas', en ? 'Your order is ready' : 'Jūsų užsakymas paruoštas', (en ? `Hello, ${firstName}. One last step, pay the remaining balance so we can ship your order.` : `Sveiki, ${firstName}. Liko apmokėti likutį, kad pradėtumėme siuntimą.`))}

    ${getInfoTable([
      { label: s.orderNo, value: orderNumber },
      { label: s.balanceDue, value: `${Number(balanceEur).toFixed(2)}€` },
    ])}

    ${customMessage ? `
      <div style="margin-bottom:32px;padding:20px;background:${COLOR_ACCENT};border-left:3px solid ${COLOR_TEXT};">
        <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.6;font-style:italic;">${customMessage}</p>
      </div>
    ` : ''}

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton(s.ctaPayNow, paymentUrl)}
      <p style="margin:16px 0 0;font-size:12px;color:${COLOR_MUTED};">${en ? 'We will start preparing your parcel as soon as the payment arrives.' : 'Apmokėjus iškart pradėsime ruošti siuntą.'}</p>
    </div>
  `;

  return {
    subject: en ? `Order ${orderNumber}, ${Number(balanceEur).toFixed(2)}€ balance due` : `Užsakymas ${orderNumber}, liko apmokėti ${Number(balanceEur).toFixed(2)}€`,
    html: getEmailWrapper(content, {
      title: en ? `Balance payment ${orderNumber}` : `Likučio apmokėjimas ${orderNumber}`,
      preheader: en ? `${Number(balanceEur).toFixed(2)}€ balance due for order ${orderNumber}` : `Liko apmokėti ${Number(balanceEur).toFixed(2)}€ už užsakymą ${orderNumber}`,
    }, lang),
  };
}

function getBalancePaidEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, amountEur } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const content = `
    ${getHeroBlock(en ? 'Payment received' : 'Mokėjimas gautas', (en ? `Thank you, ${firstName}!` : `Ačiū, ${firstName}!`), en ? 'Your balance payment has been received.' : 'Jūsų likučio apmokėjimas sėkmingai priimtas.')}

    ${getInfoTable([
      { label: s.orderNo, value: orderNumber },
      { label: s.paid, value: `${Number(amountEur).toFixed(2)}€` },
      { label: s.status, value: s.paid },
    ])}

    <div style="padding:20px;background:${COLOR_ACCENT};text-align:center;margin-bottom:32px;">
      <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.6;">
        ${en ? 'We are now preparing your parcel. Once it ships, you will receive the tracking number by email.' : 'Pradedame ruošti jūsų siuntą. Kai išsiųsime, gausite sekimo numerį el. paštu.'}
      </p>
    </div>
  `;

  return {
    subject: en ? `Order ${orderNumber}, payment received` : `Užsakymas ${orderNumber}, mokėjimas gautas`,
    html: getEmailWrapper(content, {
      title: en ? `Payment received ${orderNumber}` : `Mokėjimas gautas ${orderNumber}`,
      preheader: en ? `${Number(amountEur).toFixed(2)}€ paid. We are preparing your shipment.` : `${Number(amountEur).toFixed(2)}€ apmokėta. Pradedame siuntimą.`,
    }, lang),
  };
}

function getShippedEmail(data: any): { subject: string; html: string } {
  const { firstName, orderNumber, trackingNumber, carrierName, trackingUrl } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);
  const carrier = carrierName || s.courier;

  const content = `
    ${getHeroBlock(en ? 'Parcel shipped' : 'Siunta išsiųsta', en ? 'Your order is on its way' : 'Jūsų užsakymas pakeliui', (en ? `Hello${firstName ? ', ' + firstName : ''}. Order ${orderNumber} has been shipped.` : `Sveiki${firstName ? ', ' + firstName : ''}. Užsakymas ${orderNumber} jau išsiųstas.`))}

    ${getInfoTable([
      { label: s.orderNo, value: orderNumber },
      { label: s.carrier, value: carrier },
      { label: s.trackingNo, value: trackingNumber || '-' },
    ])}

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton(s.ctaTrackParcel, trackingUrl)}
    </div>
  `;

  return {
    subject: en ? `Order ${orderNumber}, shipped` : `Užsakymas ${orderNumber}, išsiųsta`,
    html: getEmailWrapper(content, {
      title: en ? `Parcel shipped ${orderNumber}` : `Siunta išsiųsta ${orderNumber}`,
      preheader: en ? `Carrier: ${carrier} · Tracking no.: ${trackingNumber || ''}` : `Vežėjas: ${carrier} · Sekimo nr.: ${trackingNumber || ''}`,
    }, lang),
  };
}

function getSupportRequestEmail(data: any): { subject: string; html: string } {
  const { orderNumber, requestType, message, userEmail } = data.data || data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const requestTypeLabels: Record<string, string> = en ? {
    'return': 'Product return',
    'missing_parts': 'Missing parts',
    'other': 'Other',
  } : {
    'return': 'Prekės grąžinimas',
    'missing_parts': 'Trūkstamos detalės',
    'other': 'Kita informacija',
  };

  const content = `
    ${getHeroBlock(en ? 'Customer support' : 'Klientų aptarnavimas', en ? 'New customer request' : 'Nauja kliento užklausa', `${en ? 'Type' : 'Tipas'}: ${requestTypeLabels[requestType] || requestType}`)}

    ${getInfoTable([
      { label: s.order, value: orderNumber },
      { label: s.customer, value: userEmail },
      { label: s.type, value: requestTypeLabels[requestType] || requestType },
    ])}

    <div>
      ${getSectionTitle(s.message)}
      <div style="padding:20px;background:${COLOR_ACCENT};font-size:14px;color:${COLOR_TEXT};line-height:1.6;white-space:pre-wrap;">${message}</div>
    </div>
  `;

  return {
    subject: en ? `[SUPPORT] Order ${orderNumber}, ${requestTypeLabels[requestType] || requestType}` : `[SUPPORT] Užsakymas ${orderNumber}, ${requestTypeLabels[requestType] || requestType}`,
    html: getEmailWrapper(content, { title: en ? 'New request' : 'Nauja užklausa' }, lang),
  };
}

function getGiftCardEmail(data: any): { subject: string; html: string } {
  const { recipientName, senderName, code, amount, personalMessage } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);
  const sender = senderName || (en ? 'A friend' : 'Draugas');

  const content = `
    ${getHeroBlock(en ? 'Gift card' : 'Dovanų kuponas', (en ? `Hello, ${recipientName}!` : `Sveiki, ${recipientName}!`), en ? `${sender} sent you an IBRIX gift card.` : `${sender} atsiuntė jums IBRIX dovanų kuponą.`)}

    <div style="background:${COLOR_BRAND};padding:40px 24px;text-align:center;margin-bottom:32px;">
      <p style="margin:0 0 8px;font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:2px;">${en ? 'Gift card value' : 'Kupono vertė'}</p>
      <p style="margin:0 0 24px;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:-1px;">${amount}€</p>
      <div style="background:rgba(255,255,255,0.1);padding:14px 20px;display:inline-block;">
        <p style="margin:0;font-family:'Courier New',monospace;font-size:20px;color:#ffffff;letter-spacing:3px;font-weight:700;">${code}</p>
      </div>
    </div>

    ${personalMessage ? `
      <div style="margin-bottom:32px;padding:20px;background:${COLOR_ACCENT};border-left:3px solid ${COLOR_TEXT};">
        <p style="margin:0;font-size:14px;color:${COLOR_TEXT};font-style:italic;line-height:1.6;">"${personalMessage}"</p>
        <p style="margin:8px 0 0;font-size:12px;color:${COLOR_MUTED};">${sender}</p>
      </div>
    ` : ''}

    <div style="margin-bottom:32px;">
      ${getSectionTitle(s.howToRedeem)}
      <ol style="margin:0;padding-left:20px;font-size:14px;color:${COLOR_TEXT};line-height:1.8;">
        <li>${en ? 'Log in at' : 'Prisijunkite prie'} <a href="${BASE_URL}/auth" style="color:${COLOR_LINK};">ibrix.lt</a></li>
        <li>${en ? 'Go to "My account" → "Activate gift card"' : 'Eikite į „Mano paskyra" → „Aktyvuoti dovanų kuponą"'}</li>
        <li>${en ? 'Enter the code:' : 'Įveskite kodą:'} <strong>${code}</strong></li>
      </ol>
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton(s.ctaActivate, `${BASE_URL}/auth`)}
    </div>
  `;

  return {
    subject: en ? `${sender} sent you a ${amount}€ IBRIX gift card` : `${sender} atsiuntė jums ${amount}€ IBRIX kuponą`,
    html: getEmailWrapper(content, {
      title: en ? 'IBRIX gift card' : 'IBRIX dovanų kuponas',
      preheader: en ? `${amount}€ gift card · Code: ${code}` : `${amount}€ kuponas · Kodas: ${code}`,
    }, lang),
  };
}

function getGiftCardConfirmationEmail(data: any): { subject: string; html: string } {
  const { recipientName, amount, code } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const content = `
    ${getHeroBlock(en ? 'Purchase confirmed' : 'Pirkimas patvirtintas', en ? 'Gift card sent' : 'Dovanų kuponas išsiųstas', en ? 'Your gift card has reached its recipient.' : 'Jūsų pirktas kuponas sėkmingai pasiekė gavėją.')}

    ${getInfoTable([
      { label: s.recipient, value: recipientName },
      { label: s.value, value: `${amount}€` },
      { label: s.code, value: code },
    ])}

    <p style="margin:0;text-align:center;font-size:14px;color:${COLOR_MUTED};">
      ${en ? 'The recipient has received an email with the gift card and activation instructions.' : 'Gavėjas gavo el. laišką su kuponu ir aktyvavimo instrukcijomis.'}
    </p>
  `;

  return {
    subject: en ? `Gift card ${amount}€, purchase confirmed` : `Dovanų kuponas ${amount}€, pirkimas patvirtintas`,
    html: getEmailWrapper(content, { title: en ? 'Gift card sent' : 'Kuponas išsiųstas' }, lang),
  };
}

function getNewsletterEmail(data: any): { subject: string; html: string } {
  const { firstName, subject, content } = data;
  const lang = getLang(data);
  const en = lang === 'en';

  const htmlContent = content
    .split('\n\n')
    .map((p: string) => `<p style="margin:0 0 16px;font-size:14px;color:${COLOR_TEXT};line-height:1.7;">${p}</p>`)
    .join('');

  // Note: subject/content are admin-authored campaign copy and are sent
  // as-is; only the template chrome (eyebrow/greeting) follows `lang`.
  const emailContent = `
    ${getHeroBlock(en ? 'Newsletter' : 'Naujienlaiškis', en ? `Hello, ${firstName}!` : `Sveiki, ${firstName}!`)}
    <div>${htmlContent}</div>
  `;

  return {
    subject,
    html: getEmailWrapper(emailContent, { title: subject }, lang),
  };
}

function getAdminOrderNotificationEmail(data: any): { subject: string; html: string } {
  const {
    orderNumber, customerName, customerEmail, customerPhone,
    items, subtotalEur, discountEur, shippingEur, totalEur,
    depositEur, balanceEur, shippingMethod, shippingAddress,
    paymentMethod, hasPreorder, etaWeeksMin, etaWeeksMax,
  } = data;

  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

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
    ${getHeroBlock(en ? 'Admin · New order' : 'Admin · Naujas užsakymas', orderNumber, `${customerName} · ${hasPreorder ? s.deposit : s.fullPayment}: ${Number(depositEur).toFixed(2)}€`)}

    ${getInfoTable([
      { label: s.order, value: orderNumber },
      { label: s.customer, value: customerName },
      { label: s.paid, value: `${Number(depositEur).toFixed(2)}€` },
      { label: s.total, value: `${Number(totalEur).toFixed(2)}€` },
      { label: s.payment, value: paymentMethod || 'Online' },
    ])}

    <div style="margin-bottom:32px;">
      ${getSectionTitle(s.contacts)}
      <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.7;">
        <a href="mailto:${customerEmail}" style="color:${COLOR_LINK};">${customerEmail}</a>
        ${customerPhone ? `<br><a href="tel:${customerPhone}" style="color:${COLOR_LINK};">${customerPhone}</a>` : ''}
      </p>
    </div>

    <div style="margin-bottom:32px;">
      ${getSectionTitle(s.products)}
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <thead>
          <tr>
            <th style="padding:0 8px 10px;text-align:left;font-size:11px;color:${COLOR_MUTED};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">${s.item}</th>
            <th style="padding:0 8px 10px;text-align:center;font-size:11px;color:${COLOR_MUTED};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">${s.qty}</th>
            <th style="padding:0 8px 10px;text-align:right;font-size:11px;color:${COLOR_MUTED};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${COLOR_TEXT};">${s.total}</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
    </div>

    <div style="margin-bottom:32px;">
      ${getSectionTitle(s.delivery)}
      <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.6;">
        ${getShippingMethodLabel(shippingMethod, lang)}<br>
        <span style="color:${COLOR_MUTED};">${formatShippingAddress(shippingAddress, lang)}</span>
      </p>
      ${hasPreorder && etaWeeksMin && etaWeeksMax ? `<p style="margin:8px 0 0;padding:10px;background:${COLOR_ACCENT};font-size:13px;">ETA: ${etaWeeksMin}–${etaWeeksMax} ${en ? 'wks.' : 'sav.'}</p>` : ''}
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton(s.ctaOpenAdmin, `${BASE_URL}/admin`)}
    </div>
  `;

  return {
    subject: en ? `New order ${orderNumber}, ${Number(depositEur).toFixed(2)}€` : `Naujas užsakymas ${orderNumber}, ${Number(depositEur).toFixed(2)}€`,
    html: getEmailWrapper(content, { title: en ? `New order ${orderNumber}` : `Naujas užsakymas ${orderNumber}` }, lang),
  };
}

function getInquiryReplyEmail(data: any): { subject: string; html: string } {
  const { customerName, replyMessage, conversationUrl, originalTopic } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const content = `
    ${getHeroBlock(en ? 'Reply to your inquiry' : 'Atsakymas į užklausą', (en ? `Hello, ${customerName}!` : `Sveiki, ${customerName}!`), (en ? `We have replied to your inquiry: ${originalTopic}` : `Atsakėme į jūsų užklausą: ${originalTopic}`))}

    <div style="margin-bottom:32px;padding:20px;background:${COLOR_ACCENT};border-left:3px solid ${COLOR_TEXT};">
      <p style="margin:0;font-size:14px;color:${COLOR_TEXT};line-height:1.7;white-space:pre-wrap;">${replyMessage}</p>
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton(s.ctaContinue, conversationUrl)}
    </div>
  `;

  return {
    subject: en ? `Reply to your inquiry, ${originalTopic}` : `Atsakymas į jūsų užklausą, ${originalTopic}`,
    html: getEmailWrapper(content, { title: en ? 'Reply to inquiry' : 'Atsakymas į užklausą' }, lang),
  };
}

function getAdminInquiryNotificationEmail(data: any): { subject: string; html: string } {
  const { customerName, customerEmail, topic, message, conversationUrl } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const content = `
    ${getHeroBlock(en ? 'Admin · New reply' : 'Admin · Naujas atsakymas', customerName, topic)}

    ${getInfoTable([
      { label: s.customer, value: customerName },
      { label: s.email, value: customerEmail },
      { label: s.topic, value: topic },
    ])}

    <div style="margin-bottom:32px;">
      ${getSectionTitle(s.messageShort)}
      <div style="padding:20px;background:${COLOR_ACCENT};font-size:14px;color:${COLOR_TEXT};line-height:1.6;white-space:pre-wrap;">${message}</div>
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton(s.ctaOpenConvo, conversationUrl)}
    </div>
  `;

  return {
    subject: en ? `New reply from ${customerName}, ${topic}` : `Naujas atsakymas nuo ${customerName}, ${topic}`,
    html: getEmailWrapper(content, { title: en ? 'New reply' : 'Naujas atsakymas' }, lang),
  };
}

function getInquiryReceivedEmail(data: any): { subject: string; html: string } {
  const { firstName, topic, message, orderNumber, conversationToken } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);
  const conversationUrl = conversationToken ? `${BASE_URL}/pokalbis/${conversationToken}` : BASE_URL;

  const content = `
    ${getHeroBlock(en ? 'Inquiry received' : 'Užklausa gauta', (en ? `Thank you, ${firstName}!` : `Ačiū, ${firstName}!`), en ? 'We have received your message and will reply soon.' : 'Gavome jūsų žinutę ir greitai atsakysime.')}

    ${getInfoTable([
      { label: s.topic, value: topic },
      ...(orderNumber ? [{ label: s.order, value: orderNumber }] : []),
      { label: s.replyWithin, value: en ? '24 hrs' : '24 val.' },
    ])}

    <div style="margin-bottom:32px;">
      ${getSectionTitle(s.yourMessage)}
      <div style="padding:20px;background:${COLOR_ACCENT};font-size:14px;color:${COLOR_TEXT};line-height:1.6;white-space:pre-wrap;">${message}</div>
    </div>

    ${conversationToken ? `
      <div style="text-align:center;margin:40px 0;">
        ${getCtaButton(s.ctaViewConvo, conversationUrl)}
      </div>
    ` : ''}
  `;

  return {
    subject: en ? `We have received your inquiry, ${topic}` : `Gavome jūsų užklausą, ${topic}`,
    html: getEmailWrapper(content, { title: en ? 'Inquiry received' : 'Užklausa gauta' }, lang),
  };
}

function getPasswordResetEmail(data: any): { subject: string; html: string } {
  const { email, resetUrl, firstName } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const content = `
    ${getHeroBlock(en ? 'Password reset' : 'Slaptažodžio atkūrimas', en ? 'Reset password' : 'Atkurti slaptažodį', (en ? `Hello${firstName ? ', ' + firstName : ''}. We received a request to reset your IBRIX account password.` : `Sveiki${firstName ? ', ' + firstName : ''}. Gavome prašymą atkurti jūsų IBRIX paskyros slaptažodį.`))}

    ${getInfoTable([
      { label: s.account, value: email },
      { label: s.validFor, value: en ? '1 hr' : '1 val.' },
    ])}

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton(s.ctaReset, resetUrl)}
      <p style="margin:16px 0 0;font-size:12px;color:${COLOR_MUTED};">
        ${en ? 'If the button does not work, copy this link:' : 'Jei mygtukas neveikia, nukopijuokite šią nuorodą:'}<br>
        <a href="${resetUrl}" style="color:${COLOR_LINK};word-break:break-all;">${resetUrl}</a>
      </p>
    </div>

    <div style="padding:16px;background:${COLOR_ACCENT};font-size:13px;color:${COLOR_MUTED};line-height:1.6;text-align:center;">
      ${en ? 'If you did not request a password reset, ignore this email. Your account will remain safe.' : 'Jei neprašėte atkurti slaptažodžio, ignoruokite šį laišką. Jūsų paskyra išliks saugi.'}
    </div>
  `;

  return {
    subject: en ? 'IBRIX, password reset' : 'IBRIX, slaptažodžio atkūrimas',
    html: getEmailWrapper(content, {
      title: en ? 'Password reset' : 'Slaptažodžio atkūrimas',
      preheader: en ? 'Reset your IBRIX password within 1 hr.' : 'Atkurkite IBRIX slaptažodį per 1 val.',
    }, lang),
  };
}

function getVerificationCodeEmail(data: any): { subject: string; html: string } {
  const { firstName, code, email } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const content = `
    ${getHeroBlock(en ? 'Verification' : 'Patvirtinimas', (en ? `Hello${firstName ? ', ' + firstName : ''}!` : `Sveiki${firstName ? ', ' + firstName : ''}!`), en ? 'Enter this code to verify your email.' : 'Įveskite šį kodą norėdami patvirtinti savo el. paštą.')}

    <div style="text-align:center;padding:32px 24px;background:${COLOR_ACCENT};margin-bottom:32px;">
      <p style="margin:0 0 12px;font-size:11px;color:${COLOR_MUTED};text-transform:uppercase;letter-spacing:2px;font-weight:600;">${en ? 'Your code' : 'Jūsų kodas'}</p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:42px;font-weight:800;color:${COLOR_TEXT};letter-spacing:12px;">${code}</p>
    </div>

    ${getInfoTable([
      ...(email ? [{ label: s.account, value: email }] : []),
      { label: s.validFor, value: en ? '15 min' : '15 min.' },
    ])}

    <div style="padding:16px;background:${COLOR_ACCENT};font-size:13px;color:${COLOR_MUTED};line-height:1.6;text-align:center;">
      ${en ? 'If you did not request this code, ignore this email.' : 'Jei neprašėte šio kodo, ignoruokite šį laišką.'}
    </div>
  `;

  return {
    subject: en ? `IBRIX, verification code ${code}` : `IBRIX, patvirtinimo kodas ${code}`,
    html: getEmailWrapper(content, {
      title: en ? 'Verification code' : 'Patvirtinimo kodas',
      preheader: en ? `Your verification code: ${code}` : `Jūsų patvirtinimo kodas: ${code}`,
    }, lang),
  };
}

function getWelcomeEmail(data: any): { subject: string; html: string } {
  const { firstName, lastName, email, username } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const content = `
    ${getHeroBlock(en ? 'Welcome!' : 'Sveiki atvykę!', (en ? `Hello, ${firstName}!` : `Sveiki, ${firstName}!`), en ? 'Your IBRIX account has been created.' : 'Jūsų IBRIX paskyra sėkmingai sukurta.')}

    ${getInfoTable([
      { label: s.name, value: `${firstName || ''} ${lastName || ''}`.trim() || '-' },
      { label: s.email, value: email || '-' },
      ...(username ? [{ label: s.nickname, value: username }] : []),
    ])}

    <div style="margin-bottom:32px;">
      ${getSectionTitle(s.whatYouCanDo)}
      <ul style="margin:0;padding-left:20px;font-size:14px;color:${COLOR_TEXT};line-height:1.8;">
        <li>${en ? 'Browse the full' : 'Naršyti pilną'} <a href="${BASE_URL}/produktai" style="color:${COLOR_LINK};">${en ? 'building-set catalogue' : 'konstruktorių katalogą'}</a></li>
        <li>${en ? 'Collect loyalty points with every purchase' : 'Rinkti lojalumo taškus už kiekvieną pirkinį'}</li>
        <li>${en ? 'Get early access to new sets' : 'Gauti išankstinę prieigą prie naujų rinkinių'}</li>
        <li>${en ? 'Manage your collection' : 'Tvarkyti savo kolekciją'} <a href="${BASE_URL}/account" style="color:${COLOR_LINK};">${en ? 'in your account' : 'savo paskyroje'}</a></li>
      </ul>
    </div>

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton(s.ctaBrowse, `${BASE_URL}/produktai`)}
    </div>
  `;

  return {
    subject: en ? 'Welcome to IBRIX!' : 'Sveiki atvykę į IBRIX!',
    html: getEmailWrapper(content, {
      title: en ? 'Welcome to IBRIX' : 'Sveiki atvykę į IBRIX',
      preheader: en ? 'Your IBRIX account has been created.' : 'Jūsų IBRIX paskyra sėkmingai sukurta.',
    }, lang),
  };
}

function getEmailChangeEmail(data: any): { subject: string; html: string } {
  const { firstName, confirmUrl, newEmail } = data;
  const lang = getLang(data);
  const en = lang === 'en';
  const s = strings(lang);

  const content = `
    ${getHeroBlock(en ? 'Email change' : 'El. pašto keitimas', en ? 'Confirm your new email' : 'Patvirtinkite naują el. paštą', (en ? `Hello${firstName ? ', ' + firstName : ''}. You requested to change your IBRIX account email.` : `Sveiki${firstName ? ', ' + firstName : ''}. Jūs paprašėte pakeisti savo IBRIX paskyros el. paštą.`))}

    ${getInfoTable([
      { label: s.newEmail, value: newEmail },
      { label: s.validFor, value: en ? '24 hrs' : '24 val.' },
    ])}

    <div style="text-align:center;margin:40px 0;">
      ${getCtaButton(s.ctaConfirmEmail, confirmUrl)}
      <p style="margin:16px 0 0;font-size:12px;color:${COLOR_MUTED};">
        ${en ? 'If the button does not work, copy this link:' : 'Jei mygtukas neveikia, nukopijuokite šią nuorodą:'}<br>
        <a href="${confirmUrl}" style="color:${COLOR_LINK};word-break:break-all;">${confirmUrl}</a>
      </p>
    </div>

    <div style="padding:16px;background:${COLOR_ACCENT};font-size:13px;color:${COLOR_MUTED};line-height:1.6;text-align:center;">
      ${en ? 'If you did not request an email change, ignore this email.' : 'Jei neprašėte pakeisti el. pašto, ignoruokite šį laišką.'}
    </div>
  `;

  return {
    subject: en ? 'IBRIX, confirm your new email' : 'IBRIX, patvirtinkite naują el. paštą',
    html: getEmailWrapper(content, {
      title: en ? 'Confirm your email' : 'Patvirtinkite el. paštą',
      preheader: en ? `Confirm your new email: ${newEmail}` : `Patvirtinkite naują el. paštą: ${newEmail}`,
    }, lang),
  };
}

// =====================================================================
// HELPERS
// =====================================================================

function getShippingMethodLabel(method: string, lang: EmailLang = 'lt'): string {
  const en = lang === 'en';
  const labels: Record<string, string> = {
    'omniva_locker': en ? 'Omniva parcel locker' : 'Omniva paštomatas',
    'lp_express_locker': en ? 'LP Express parcel locker' : 'LP Express paštomatas',
    'dpd_locker': en ? 'DPD parcel locker' : 'DPD paštomatas',
    'venipak_locker': en ? 'Venipak parcel locker' : 'Venipak paštomatas',
    'courier': en ? 'Courier to your door' : 'Kurjeris į namus',
  };
  return labels[method] || method || (en ? 'Delivery' : 'Pristatymas');
}

function formatShippingAddress(address: any, lang: EmailLang = 'lt'): string {
  const notSpecified = lang === 'en' ? 'Not specified' : 'Nenurodyta';
  if (!address) return notSpecified;
  if (address.lockerAddress) {
    return `${address.lockerName || ''}${address.lockerName ? ', ' : ''}${address.lockerAddress}`;
  }
  if (address.street) {
    return `${address.street}, ${address.city || ''} ${address.postalCode || ''}`.trim();
  }
  return notSpecified;
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
        emailContent = getPasswordResetEmail({ ...data, email: data.email || email });
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
