-- Atomic wallet balance change. Replaces read-then-write in edge functions,
-- where two parallel requests both read the same balance and both spent it.
-- Returns the new balance, or NULL when the wallet is missing or the change
-- would take the balance below zero (nothing is written in that case).
create or replace function public.adjust_wallet_balance(p_wallet_id uuid, p_delta numeric)
returns numeric
language sql
security definer
set search_path = public
as $$
  update public.wallets
     set balance_eur = balance_eur + p_delta,
         updated_at = now()
   where id = p_wallet_id
     and balance_eur + p_delta >= 0
  returning balance_eur;
$$;

-- Edge functions call this with the service role only. Anyone else could
-- otherwise raise their own balance straight from the browser.
revoke all on function public.adjust_wallet_balance(uuid, numeric) from public, anon, authenticated;
grant execute on function public.adjust_wallet_balance(uuid, numeric) to service_role;
