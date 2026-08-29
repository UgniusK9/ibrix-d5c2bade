-- Deduct stock when an order is actually paid.
--
-- Checkout validated inventory_qty but nothing ever reduced it, so the same
-- last unit could be sold repeatedly. Deducting at checkout instead would let
-- abandoned unpaid orders hold stock hostage, so this runs on payment
-- confirmation.
--
-- Two hazards this guards against:
--
--  * Double firing. Payment callbacks retry, and Paysera resends on any
--    non-200. The claim below is a conditional UPDATE, so only the first
--    caller sees a row and the rest exit having changed nothing.
--
--  * Concurrent orders. The deduction is a single UPDATE rather than a
--    read-modify-write, so Postgres row locks serialise two buyers racing for
--    the same last unit.
--
-- Preorder items are excluded: they are not held in stock, and their
-- availability is governed by the manufacturer ETA rather than inventory_qty.

alter table public.orders
  add column if not exists inventory_deducted_at timestamptz;

comment on column public.orders.inventory_deducted_at is
  'Set once stock has been deducted for this order; makes the deduction idempotent across payment callback retries.';

create or replace function public.decrement_inventory_for_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed boolean;
begin
  -- Claim the order. No row comes back if another call already deducted.
  update public.orders
     set inventory_deducted_at = now()
   where id = p_order_id
     and inventory_deducted_at is null
  returning true into v_claimed;

  if v_claimed is null then
    return false;
  end if;

  update public.products p
     set inventory_qty = greatest(0, p.inventory_qty - items.qty)
    from (
      select product_id, sum(quantity)::int as qty
        from public.order_items
       where order_id = p_order_id
         and product_id is not null
       group by product_id
    ) as items
   where p.id = items.product_id
     and p.inventory_qty is not null
     and p.stock_status <> 'preorder';

  return true;
end;
$$;

comment on function public.decrement_inventory_for_order(uuid) is
  'Deducts stock for a paid order exactly once. Returns false if already deducted.';

revoke all on function public.decrement_inventory_for_order(uuid) from public, anon, authenticated;
