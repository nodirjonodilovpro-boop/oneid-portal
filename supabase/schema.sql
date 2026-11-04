-- =====================================================================
-- OneID demo portali — Supabase ma'lumotlar bazasi sxemasi
-- Supabase → SQL Editor → New query → shu faylni to'liq qo'ying → Run
-- Qayta ishga tushirish xavfsiz (if not exists / drop policy if exists).
-- =====================================================================

-- ---------- Hujjatlar ----------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  cat         text not null default 'shaxsiy'
              check (cat in ('shaxsiy', 'haydovchilik', 'talim', 'tibbiy', 'boshqa')),
  no          text not null check (char_length(no) between 1 and 30),
  issued      text check (issued is null or issued = '' or issued ~ '^\d{2}\.\d{2}\.\d{4}$'),
  exp         text check (exp is null or exp = '' or exp ~ '^\d{2}\.\d{2}\.\d{4}$'),
  org         text check (org is null or char_length(org) <= 80),
  created_at  timestamptz not null default now()
);
create index if not exists documents_user_idx on public.documents (user_id, created_at desc);

-- ---------- Mulk va transport aktivlari ----------
create table if not exists public.assets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type        text not null default 'car' check (type in ('car', 'house', 'land')),
  name        text not null check (char_length(name) between 1 and 80),
  no          text not null check (char_length(no) between 1 and 30),
  date        text check (date is null or date = '' or date ~ '^\d{2}\.\d{2}\.\d{4}$'),
  details     text check (details is null or char_length(details) <= 80),
  created_at  timestamptz not null default now()
);
create index if not exists assets_user_idx on public.assets (user_id, created_at desc);

-- ---------- Row Level Security: har kim faqat o'z yozuvlarini ko'radi ----------
alter table public.documents enable row level security;
alter table public.assets    enable row level security;

drop policy if exists "documents: o'zinikini o'qish"     on public.documents;
drop policy if exists "documents: o'ziga qo'shish"       on public.documents;
drop policy if exists "documents: o'zinikini yangilash"  on public.documents;
drop policy if exists "documents: o'zinikini o'chirish"  on public.documents;
create policy "documents: o'zinikini o'qish"    on public.documents for select to authenticated using ((select auth.uid()) = user_id);
create policy "documents: o'ziga qo'shish"      on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "documents: o'zinikini yangilash" on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "documents: o'zinikini o'chirish" on public.documents for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "assets: o'zinikini o'qish"     on public.assets;
drop policy if exists "assets: o'ziga qo'shish"       on public.assets;
drop policy if exists "assets: o'zinikini yangilash"  on public.assets;
drop policy if exists "assets: o'zinikini o'chirish"  on public.assets;
create policy "assets: o'zinikini o'qish"    on public.assets for select to authenticated using ((select auth.uid()) = user_id);
create policy "assets: o'ziga qo'shish"      on public.assets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "assets: o'zinikini yangilash" on public.assets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "assets: o'zinikini o'chirish" on public.assets for delete to authenticated using ((select auth.uid()) = user_id);

-- Mehmon (anon) foydalanuvchilarga jadvallarga umuman ruxsat yo'q
revoke all on public.documents from anon;
revoke all on public.assets    from anon;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.assets    to authenticated;
