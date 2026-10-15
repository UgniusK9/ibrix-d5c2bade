import { test, expect, type Page } from '@playwright/test';

// The dev server talks to the live Supabase project, so anything that would
// write shop analytics (product views, Meta events, page events) is dropped
// here: a test run must not show up in the client's statistics.
async function blockAnalyticsWrites(page: Page) {
  for (const pattern of [
    '**/functions/v1/track-product-view**',
    '**/functions/v1/meta-capi**',
    '**/rest/v1/product_views**',
    '**/rest/v1/events**',
    '**://www.googletagmanager.com/**',
    '**://connect.facebook.net/**',
  ]) {
    await page.route(pattern, (route) => route.abort());
  }
}

// Uncaught exceptions are bugs a shopper feels (a dead button, a blank
// section); collect them for every test and fail on any.
function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function dismissCookies(page: Page) {
  const reject = page.getByRole('button', { name: 'Atmesti nebūtinus' });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

// First real product in the catalogue (skips the 1-cent test product).
async function openFirstProduct(page: Page) {
  await page.goto('/produktai/visi');
  await dismissCookies(page);
  const link = page
    .locator('a[href^="/produktas/"]')
    .filter({ hasNotText: /test/i })
    .first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/produktas\//);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await blockAnalyticsWrites(page);
});

test('home page loads without script errors', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/');
  await dismissCookies(page);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('img', { name: 'IBRIX' }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('product page answers price, delivery date and returns before the button', async ({ page }) => {
  const errors = collectPageErrors(page);
  await openFirstProduct(page);

  await expect(page.getByText(/\d+,\d{2}\s*€/).first()).toBeVisible();
  await expect(page.getByText('Numatomas pristatymas', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: /grąžinimas/i })).toBeVisible();
  await expect(page.getByText(/Apmokėjimas per banką/)).toBeVisible();
  // The specs used to claim "16+, 20-30 h" on every product.
  await expect(page.getByText(/20–30/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a shopper can put a set in the cart and reach checkout with it', async ({ page }) => {
  const errors = collectPageErrors(page);
  await openFirstProduct(page);

  const price = (await page.getByText(/^\d+,\d{2}\s*€$/).first().textContent())?.trim();
  expect(price).toBeTruthy();

  await page.getByRole('button', { name: /Užsisakyti|Į krepšelį/ }).first().click();
  // Adding opens a confirmation dialog with suggestions; carry on shopping.
  const added = page.getByRole('dialog', { name: /Pridėta į krepšelį/ });
  await expect(added).toBeVisible();
  await added.getByRole('button', { name: 'Tęsti apsipirkimą' }).click();
  await expect(page.getByRole('button', { name: 'Krepšelis (1)' })).toBeVisible();

  await page.goto('/checkout');
  const summary = page.locator('div', { has: page.getByRole('heading', { name: 'Užsakymo santrauka' }) }).last();
  await expect(summary).toBeVisible();
  await expect(summary.getByText(price!).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('catalogue shows no test products to shoppers', async ({ page }) => {
  await page.goto('/produktai/visi');
  await dismissCookies(page);
  await expect(page.locator('a[href^="/produktas/"]').first()).toBeVisible();
  await expect(page.locator('a[href^="/produktas/"]').filter({ hasText: /test produktas/i })).toHaveCount(0);
});
