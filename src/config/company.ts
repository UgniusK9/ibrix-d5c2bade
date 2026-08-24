/**
 * Legal entity and contact details for IBRIX.
 *
 * Single source of truth — the legal pages, footer and contact page all read
 * from here. EU e-commerce rules require a seller to identify itself on the
 * site (name, registration code, address, contact), so these values are not
 * decorative: they are what a customer relies on when raising a dispute.
 *
 * VERIFY BEFORE PUBLISHING: taken from variantai.lt, which is operated by the
 * same owner. If ibrix.lt trades under a different legal entity, change
 * `legalName`, `regCode` and `address` — everything else follows.
 */
export const COMPANY = {
  /** Trading / brand name shown to customers. */
  brand: 'IBRIX',

  /** Registered legal entity that actually sells. */
  legalName: 'MB Variantai',
  regCode: '306133252',
  /** Set to null until VAT-registered; the legal pages hide the line when null. */
  vatCode: null as string | null,
  address: 'Dailidžių k. 7, Trakų r.',
  country: 'Lietuva',

  /** Customer-facing contact. Keep in sync with the mailbox that is monitored. */
  email: 'support@ibrix.lt',
  site: 'ibrix.lt',
  siteUrl: 'https://ibrix.lt',

  /** Consumer protection references required for EU online sellers. */
  vvtat: 'Valstybinė vartotojų teisių apsaugos tarnyba',
  vvtatUrl: 'https://www.vvtat.lt',
  odrUrl: 'https://ec.europa.eu/odr',

  /** Payment processor named in the privacy policy. */
  paymentProcessor: 'Paysera LT, UAB',

  /** Last review date shown on legal pages. */
  updated: '2026-08-07',
} as const;

/** "MB Variantai (kodas 306133252, Dailidžių k. 7, Trakų r.)" */
export function companyLine(): string {
  return `${COMPANY.legalName} (juridinio asmens kodas ${COMPANY.regCode}, buveinės adresas ${COMPANY.address})`;
}
