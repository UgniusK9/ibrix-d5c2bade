-- The original CHECK (20260104022127) only knew 6 types, but the loyalty ledger
-- code writes earn_pending / earn_available / earn_reversed / redeem_* and the
-- admin screen writes manual_adjustment. Those inserts failed, so the ledger
-- stayed empty. Widen to the union of everything the code writes.
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check
  CHECK (type IN (
    'credit', 'debit', 'refund', 'gift_card_redeem', 'purchase', 'admin_adjustment',
    'manual_adjustment',
    'earn_pending', 'earn_available', 'earn_reversed',
    'redeem_hold', 'redeem_captured', 'redeem_released'
  ));
