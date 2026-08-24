-- Campaign attribution on orders.
--
-- orders already had utm_source / utm_medium / utm_campaign / gclid / fbclid,
-- but nothing ever wrote to them and the three fields below were missing.
--
-- utm_content is the important addition: it is what distinguishes one TikTok
-- video or one Facebook post from another within the same campaign, which is
-- the level the content decisions are actually made at.
--
-- All nullable and additive — existing rows and the checkout path are
-- unaffected when a visitor arrives untagged.

alter table public.orders
  add column if not exists utm_content  text,
  add column if not exists utm_term     text,
  add column if not exists landing_page text;

comment on column public.orders.utm_source   is 'Campaign source captured on landing, e.g. tiktok, facebook, newsletter.';
comment on column public.orders.utm_medium   is 'Campaign medium, e.g. social, cpc, email.';
comment on column public.orders.utm_campaign is 'Campaign name, e.g. w16-launch.';
comment on column public.orders.utm_content  is 'Distinguishes creatives within a campaign — a specific video or post.';
comment on column public.orders.utm_term     is 'Paid search keyword, unused for social.';
comment on column public.orders.landing_page is 'Path the attributed visit first landed on.';

-- Reporting groups by source over a date range, so index the pair.
create index if not exists orders_attribution_idx
  on public.orders (created_at desc, utm_source)
  where utm_source is not null;
