-- Lifestyle gallery shown on the home page ("Kaip atrodo surinkti rinkiniai").
-- Photos are supplied by the shop owner through the admin panel; catalogue
-- images cannot be reused here because the secondary product shots carry a
-- manufacturer watermark.
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text,
  subtitle text,
  link_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.gallery_items is
  'Home-page inspiration gallery tiles. Ordered by sort_order; first item renders as the large feature tile.';

create index if not exists gallery_items_active_sort_idx
  on public.gallery_items (active, sort_order);

alter table public.gallery_items enable row level security;

drop policy if exists "Public can view active gallery items" on public.gallery_items;
create policy "Public can view active gallery items"
  on public.gallery_items for select
  using (active = true);

drop policy if exists "Admins can manage gallery items" on public.gallery_items;
create policy "Admins can manage gallery items"
  on public.gallery_items for all
  using (exists (
    select 1 from public.users
    where users.id = auth.uid() and users.role = 'admin'::app_role
  ));
