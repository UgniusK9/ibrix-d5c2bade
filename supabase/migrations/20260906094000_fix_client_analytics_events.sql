-- The admin analytics funnel and top-products list read from public.events,
-- but the table could never receive a browser-side write, for two reasons:
--
--   1. RLS had only an admin SELECT policy — no INSERT policy at all.
--   2. GRANTs: anon held SELECT but not INSERT, so anonymous visitors were
--      rejected with "permission denied for table events" before RLS was even
--      evaluated. Anonymous visitors are most of the traffic.
--
-- Visitors may append analytics events and nothing more: no select, update or
-- delete, and only the event names the storefront actually emits. Reading stays
-- admin-only. Edge functions use the service role and bypass both layers.

drop policy if exists "Anyone can log analytics events" on public.events;
create policy "Anyone can log analytics events"
  on public.events for insert
  to anon, authenticated
  with check (
    name in (
      'view_item',
      'add_to_cart',
      'begin_checkout',
      'add_payment_info',
      'purchase'
    )
  );

grant insert on public.events to anon;
