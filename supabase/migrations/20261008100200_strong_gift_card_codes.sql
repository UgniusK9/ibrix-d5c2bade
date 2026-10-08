-- md5(random()) gave 4 + 4 hex characters = 32 bits and random() is not
-- cryptographic. New format IBGC-XXXX-XXXX-XXXX: 12 characters from a 32-symbol
-- alphabet (no I, O, 0, 1) = 60 bits from pgcrypto's gen_random_bytes.
-- Codes already issued keep working (redemption matches the stored text).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 symbols, so (byte & 31) is uniform
  bytes BYTEA;
  new_code TEXT;
  i INTEGER;
BEGIN
  LOOP
    bytes := gen_random_bytes(12);
    new_code := 'IBGC';
    FOR i IN 0..11 LOOP
      IF i % 4 = 0 THEN new_code := new_code || '-'; END IF;
      new_code := new_code || substr(alphabet, (get_byte(bytes, i) & 31) + 1, 1);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM public.gift_cards WHERE code = new_code) THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_gift_card_code() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_gift_card_code() TO service_role;
