-- =====================================================================
--  ADF — ARAFAT DIGITAL FUTURIST
--  Schéma de base de données complet (production)
--  Conçue par le PDG d'ADF, M. Arafat Garga
--
--  À exécuter dans : Supabase Dashboard > SQL Editor
--  Idempotent : peut être ré-exécuté sans erreur.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
--  TABLES
-- =====================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  full_name     text default '',
  phone         text default '',
  avatar_url    text,
  role          text not null default 'user' check (role in ('user','admin')),
  ai_message_count int not null default 0,
  ai_message_limit int not null default 50,
  banned        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.app_settings (
  id               int primary key default 1 check (id = 1),
  ai_system_prompt text not null default '',
  ai_temperature   numeric not null default 0.7,
  ai_enabled       boolean not null default true,
  default_ai_limit int not null default 50,
  store_announcement text default '',
  maintenance      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.ai_configs (
  id         uuid primary key default gen_random_uuid(),
  provider   text not null check (provider in ('gemini','openai','grok','claude','custom')),
  label      text default '',
  api_key    text not null default '',
  base_url   text default '',
  model      text default '',
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null default 'Nouvelle conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_sessions(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text,
  description  text default '',
  category     text default 'Digital',
  icon         text default 'spark',
  base_price   numeric default 0,
  delivery_days int default 3,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.service_orders (
  id          uuid primary key default gen_random_uuid(),
  order_code  text unique,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  service_id  uuid references public.services(id) on delete set null,
  title       text default '',
  brief       text default '',
  details     jsonb default '{}'::jsonb,
  budget      numeric default 0,
  status      text not null default 'pending'
              check (status in ('pending','reviewing','approved','invoiced','sample_sent','completed','rejected','cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.order_messages (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.service_orders(id) on delete cascade,
  sender_id   uuid references public.profiles(id) on delete set null,
  sender_role text not null check (sender_role in ('user','admin','system')),
  kind        text not null default 'text' check (kind in ('text','image','file','invoice','sample','final')),
  content     text default '',
  file_url    text,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text default '',
  price       numeric not null default 0,
  compare_price numeric,
  category    text default 'Digital',
  type        text not null default 'digital' check (type in ('digital','physical','subscription','license','template','other')),
  image_url   text,
  file_url    text,
  stock       int,
  is_active   boolean not null default true,
  data        jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.product_orders (
  id          uuid primary key default gen_random_uuid(),
  order_code  text unique,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  product_name text default '',
  quantity    int not null default 1,
  amount      numeric not null default 0,
  status      text not null default 'pending'
              check (status in ('pending','paid','approved','delivered','rejected','cancelled')),
  file_url    text,
  note        text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('mobile_money','orange_money','wave','moov','bank','paypal','card','crypto','other')),
  holder      text default '',
  number      text default '',
  extra       jsonb default '{}'::jsonb,
  instructions text default '',
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.payment_proofs (
  id          uuid primary key default gen_random_uuid(),
  order_code  text not null,
  order_type  text not null check (order_type in ('service','product')),
  user_id     uuid references public.profiles(id) on delete set null,
  amount      numeric,
  file_url    text not null,
  note        text default '',
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- =====================================================================
--  HELPERS
-- =====================================================================

create or replace function public.gen_order_code(prefix text default 'ADF')
returns text language plpgsql as $$
begin
  return upper(coalesce(prefix,'ADF')) || '-' ||
         upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
end; $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

-- Crée le profil à l'inscription. Le TOUT PREMIER utilisateur devient admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  admin_count int;
  dlimit int;
begin
  select count(*) into admin_count from public.profiles where role = 'admin';
  select default_ai_limit into dlimit from public.app_settings where id = 1;
  insert into public.profiles (id, email, full_name, phone, role, ai_message_limit)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    case when admin_count = 0 then 'admin' else 'user' end,
    coalesce(dlimit, 50)
  );
  return new;
end; $$;

-- Auto-incrémente le compteur de messages IA de l'utilisateur.
create or replace function public.bump_ai_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
begin
  select user_id into owner from public.ai_sessions where id = new.session_id;
  if new.role = 'user' and owner is not null then
    update public.profiles set ai_message_count = ai_message_count + 1 where id = owner;
    update public.ai_sessions set updated_at = now(), title =
      case when (select title from public.ai_sessions where id = new.session_id) = 'Nouvelle conversation'
           then left(new.content, 40) else (select title from public.ai_sessions where id = new.session_id) end
      where id = new.session_id;
  end if;
  return new;
end; $$;

-- Récupère la configuration IA active (appelée par le client).
-- SECURITY DEFINER : expose la clé active aux utilisateurs connectés uniquement.
create or replace function public.get_active_ai_config()
returns table (
  provider text, api_key text, base_url text, model text,
  system_prompt text, temperature numeric, ai_enabled boolean
)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return;
  end if;
  return query
    select c.provider, c.api_key, c.base_url, c.model,
           s.ai_system_prompt, s.ai_temperature, s.ai_enabled
    from public.app_settings s
    left join public.ai_configs c on c.is_active = true
    where s.id = 1
    limit 1;
end; $$;

-- Mise à jour du profil par l'utilisateur (champs non sensibles uniquement).
create or replace function public.update_my_profile(p_full_name text, p_phone text, p_avatar_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set full_name = p_full_name, phone = p_phone, avatar_url = p_avatar_url
  where id = auth.uid();
end; $$;

-- =====================================================================
--  TRIGGERS
-- =====================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

do $$ begin
  create trigger profiles_touch before update on public.profiles
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger service_orders_touch before update on public.service_orders
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger product_orders_touch before update on public.product_orders
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger ai_sessions_touch before update on public.ai_sessions
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger app_settings_touch before update on public.app_settings
    for each row execute function public.touch_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger service_order_code before insert on public.service_orders
    for each row execute function (
      create or replace function public.set_svc_code() returns trigger language plpgsql as $$
      begin new.order_code := coalesce(new.order_code, public.gen_order_code('SVC')); return new; end; $$
    )();
exception when duplicate_object then
  create or replace function public.set_svc_code() returns trigger language plpgsql as $$
  begin new.order_code := coalesce(new.order_code, public.gen_order_code('SVC')); return new; end; $$;
end $$;

-- (re-création propre des triggers de code commande)
drop trigger if exists service_order_code on public.service_orders;
create trigger service_order_code before insert on public.service_orders
  for each row execute function public.set_svc_code();

create or replace function public.set_prd_code() returns trigger language plpgsql as $$
begin new.order_code := coalesce(new.order_code, public.gen_order_code('PRD')); return new; end; $$;
drop trigger if exists product_order_code on public.product_orders;
create trigger product_order_code before insert on public.product_orders
  for each row execute function public.set_prd_code();

drop trigger if exists ai_msg_count on public.ai_messages;
create trigger ai_msg_count after insert on public.ai_messages
  for each row execute function public.bump_ai_count();

-- =====================================================================
--  ROW LEVEL SECURITY
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.app_settings      enable row level security;
alter table public.ai_configs        enable row level security;
alter table public.ai_sessions       enable row level security;
alter table public.ai_messages       enable row level security;
alter table public.services          enable row level security;
alter table public.service_orders    enable row level security;
alter table public.order_messages    enable row level security;
alter table public.products          enable row level security;
alter table public.product_orders    enable row level security;
alter table public.payment_methods   enable row level security;
alter table public.payment_proofs    enable row level security;

-- helper expression : est-ce l'utilisateur courant est admin ?
-- (les politiques l'utilisent via une sous-requête)

-- PROFILES
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- APP SETTINGS : lecture publique (annonces), écriture admin
drop policy if exists settings_select on public.app_settings;
create policy settings_select on public.app_settings for select using (true);
drop policy if exists settings_admin_write on public.app_settings;
create policy settings_admin_write on public.app_settings for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- AI CONFIGS : admin only
drop policy if exists aiconfig_admin on public.ai_configs;
create policy aiconfig_admin on public.ai_configs for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- AI SESSIONS
drop policy if exists ai_sessions_owner on public.ai_sessions;
create policy ai_sessions_owner on public.ai_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- AI MESSAGES (via session propriétaire)
drop policy if exists ai_messages_owner on public.ai_messages;
create policy ai_messages_owner on public.ai_messages for select
  using (exists (select 1 from public.ai_sessions s where s.id = session_id and s.user_id = auth.uid()));
drop policy if exists ai_messages_insert on public.ai_messages;
create policy ai_messages_insert on public.ai_messages for insert
  with check (exists (select 1 from public.ai_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- SERVICES : lecture publique, écriture admin
drop policy if exists services_select on public.services;
create policy services_select on public.services for select using (true);
drop policy if exists services_admin on public.services;
create policy services_admin on public.services for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- SERVICE ORDERS
drop policy if exists svc_orders_select on public.service_orders;
create policy svc_orders_select on public.service_orders for select
  using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists svc_orders_insert on public.service_orders;
create policy svc_orders_insert on public.service_orders for insert with check (user_id = auth.uid());
drop policy if exists svc_orders_admin_update on public.service_orders;
create policy svc_orders_admin_update on public.service_orders for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ORDER MESSAGES : utilisateur propriétaire de la commande OU admin
drop policy if exists order_msgs_select on public.order_messages;
create policy order_msgs_select on public.order_messages for select
  using (
    exists (select 1 from public.service_orders o where o.id = order_id and o.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
drop policy if exists order_msgs_insert on public.order_messages;
create policy order_msgs_insert on public.order_messages for insert
  with check (
    exists (select 1 from public.service_orders o where o.id = order_id and o.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- PRODUCTS : lecture publique (actifs), écriture admin
drop policy if exists products_select on public.products;
create policy products_select on public.products for select using (true);
drop policy if exists products_admin on public.products;
create policy products_admin on public.products for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- PRODUCT ORDERS
drop policy if exists prd_orders_select on public.product_orders;
create policy prd_orders_select on public.product_orders for select
  using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists prd_orders_insert on public.product_orders;
create policy prd_orders_insert on public.product_orders for insert with check (user_id = auth.uid());
drop policy if exists prd_orders_update on public.product_orders;
create policy prd_orders_update on public.product_orders for update
  using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- PAYMENT METHODS : lecture des actifs par tous, écriture admin
drop policy if exists pay_select on public.payment_methods;
create policy pay_select on public.payment_methods for select
  using (is_active = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists pay_admin on public.payment_methods;
create policy pay_admin on public.payment_methods for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- PAYMENT PROOFS
drop policy if exists proofs_select on public.payment_proofs;
create policy proofs_select on public.payment_proofs for select
  using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists proofs_insert on public.payment_proofs;
create policy proofs_insert on public.payment_proofs for insert with check (user_id = auth.uid());
drop policy if exists proofs_admin_update on public.payment_proofs;
create policy proofs_admin_update on public.payment_proofs for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- =====================================================================
--  STORAGE (bucket public "adf")
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('adf', 'adf', true)
on conflict (id) do nothing;

drop policy if exists "adf_public_read" on storage.objects;
create policy "adf_public_read" on storage.objects for select
  using (bucket_id = 'adf');

drop policy if exists "adf_auth_upload" on storage.objects;
create policy "adf_auth_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'adf' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "adf_owner_update" on storage.objects;
create policy "adf_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'adf' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "adf_owner_delete" on storage.objects;
create policy "adf_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'adf' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================
--  DONNÉES INITIALES (catalogue réel + réglages)
-- =====================================================================
insert into public.app_settings (id, ai_system_prompt, default_ai_limit, store_announcement)
values (1,
'Tu es ADF IA, l''assistant intelligent officiel d''ADF — Arafat Digital Futurist, l''agence digitale dirigée par M. Arafat Garga (PDG). Tu es courtois, professionnel, concis et tu réponds en français. Tu aides l''utilisateur à : comprendre les services proposés (logo, identité visuelle, cartes de visite, flyers, contenus réseaux sociaux, UI/UX, sites web, montage vidéo), passer commande, suivre ses commandes, acheter dans la boutique digitale, et utiliser l''application. Oriente toujours vers le bouton « Commander » ou la boutique. Sois honnête : si tu ne sais pas, propose de contacter l''équipe via une commande.',
50,
'Bienvenue sur la boutique digitale ADF ✦ Paiement Mobile Money, Orange Money & plus.')
on conflict (id) do nothing;

insert into public.services (name, slug, description, category, icon, base_price, delivery_days, sort_order) values
('Création de logo',      'logo',      'Logo professionnel unique et mémorable, livré en plusieurs formats (PNG, SVG, PDF).', 'Branding','logo',     15000, 3, 1),
('Identité visuelle',     'identite',  'Charte graphique complète : logo, palette de couleurs, typographies et guide d''usage.', 'Branding','palette',  45000, 7, 2),
('Cartes de visite',      'cartes',    'Cartes de visite élégantes, prêtes à l''impression (recto/verso).', 'Print','card',        8000, 2, 3),
('Flyers & Affiches',     'flyers',    'Supports de communication percutants pour vos événements et promotions.', 'Print','flyer',      10000, 2, 4),
('Contenu réseaux sociaux','social',   'Visuels et templates pour Instagram, Facebook, TikTok et LinkedIn.', 'Digital','social',   20000, 3, 5),
('UI / UX Design',        'ui',        'Maquettes d''applications et de sites web modernes et intuitives.', 'Digital','layout',      60000, 7, 6),
('Site web & Landing page','web',      'Sites vitrines et pages de conversion optimisées et responsives.', 'Web','globe',          90000, 10, 7),
('Montage vidéo & Motion','video',     'Montage vidéo, motion design et habillage professionnel.', 'Vidéo','video',          50000, 5, 8)
on conflict do nothing;

-- Fin du script.
