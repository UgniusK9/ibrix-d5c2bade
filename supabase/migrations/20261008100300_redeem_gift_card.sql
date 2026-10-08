-- Gift card redemption used to run in the browser, where RLS (correctly) blocks
-- writes to wallets / wallet_transactions / gift_cards, so recipients could not
-- redeem. The redeem-gift-card edge function now calls this with the service role.
--
-- One transaction: claim the card, make sure a wallet exists, credit it, write the
-- ledger row. If any step fails everything rolls back, so a card is never burned
-- without the credit. Returns the amount credited, or NULL when the code is
-- unknown, already redeemed, expired, or empty (deliberately one answer for all).
create or replace function public.redeem_gift_card(p_code text, p_user_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card_id uuid;
  v_amount numeric;
  v_wallet_id uuid;
begin
  update public.gift_cards g
     set status = 'redeemed',
         current_balance_eur = 0,
         redeemed_by_user_id = p_user_id,
         redeemed_at = now(),
         updated_at = now()
    from (
      select c.id, c.current_balance_eur
        from public.gift_cards c
       where c.code = p_code
         and c.status = 'active'
         and c.current_balance_eur > 0
         and (c.expires_at is null or c.expires_at > now())
         for update
    ) t
   where g.id = t.id
  returning g.id, t.current_balance_eur into v_card_id, v_amount;

  if v_card_id is null then
    return null;
  end if;

  insert into public.wallets (user_id, balance_eur)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  select w.id into v_wallet_id from public.wallets w where w.user_id = p_user_id;

  if public.adjust_wallet_balance(v_wallet_id, v_amount) is null then
    raise exception 'wallet credit failed';
  end if;

  insert into public.wallet_transactions
    (wallet_id, type, amount_eur, status, description, reference_type, reference_id)
  values
    (v_wallet_id, 'gift_card_redeem', v_amount, 'available',
     'Gift card: ' || p_code, 'gift_card', v_card_id);

  return v_amount;
end;
$$;

revoke all on function public.redeem_gift_card(text, uuid) from public, anon, authenticated;
grant execute on function public.redeem_gift_card(text, uuid) to service_role;

-- Failed attempts, used by the edge function to throttle code guessing per user.
create table if not exists public.gift_card_redeem_failures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_gift_card_redeem_failures_user_time
  on public.gift_card_redeem_failures (user_id, created_at desc);
-- RLS on with no policies: only the service role (edge function) can touch it.
alter table public.gift_card_redeem_failures enable row level security;
