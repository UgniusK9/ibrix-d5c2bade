-- Drop the existing check constraint and recreate with 'pending' allowed
ALTER TABLE public.gift_cards DROP CONSTRAINT IF EXISTS gift_cards_status_check;

ALTER TABLE public.gift_cards ADD CONSTRAINT gift_cards_status_check 
  CHECK (status IN ('pending', 'active', 'redeemed', 'expired', 'cancelled'));