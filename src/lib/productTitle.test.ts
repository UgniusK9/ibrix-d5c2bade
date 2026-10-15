// Run with: node --test src/lib/productTitle.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDisplayTitle, cleanTitle } from './productTitle.ts';

test('strips brand, model number, generic noun and piece count', () => {
  const t = getDisplayTitle('MOULD KING 24124 Spring Whisper Bouquet Floral Konstruktorius | 1,040 dalių', '24124');
  assert.deepEqual(t, { name: 'Spring Whisper Bouquet Floral', brand: 'Mould King', pieces: 1040 });
});

test('a name that is already clean comes back unchanged (carts saved before the change)', () => {
  const once = cleanTitle('MOULD KING 10168 Motorised Hypercar W16 Engine & Gearbox Konstruktorius | 2899 dalys', '10168');
  assert.equal(cleanTitle(once, '10168'), once);
  assert.equal(cleanTitle('Chrizantema'), 'Chrizantema');
});

test('keeps words that only look like noise', () => {
  assert.equal(cleanTitle('MOULD KING 27012S Ferrari Testarossa | 350 dalių', '27012S'), 'Ferrari Testarossa');
});

test('never returns an empty name', () => {
  assert.equal(cleanTitle('MOULD KING'), 'MOULD KING');
});

test('English titles from the 5 Oct copy migration clean the same way', () => {
  assert.equal(cleanTitle('MOULD KING 13153 App-Controlled Tracked Racer | 836 pcs', '13153'), 'App-Controlled Tracked Racer');
});
