-- ==========================================================
-- ARKANA POS — Supabase schema
-- Jalankan seluruh file ini di: Supabase Dashboard → SQL Editor → New query → Run
-- ==========================================================

create extension if not exists "pgcrypto";

-- ---------- Types ----------
do $$ begin
  create type user_role as enum ('owner','barista','cashier');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending','preparing','ready','served','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method_t as enum ('cash','qris');
exception when duplicate_object then null; end $$;

-- ---------- Tables ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Staff Baru',
  role user_role not null default 'cashier',
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  price numeric(12,2) not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products(id) on delete cascade,
  stock_qty numeric(12,2) not null default 0,
  unit text not null default 'pcs',
  low_stock_threshold numeric(12,2) not null default 5,
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  table_number text,
  status order_status not null default 'pending',
  payment_method payment_method_t not null default 'cash',
  payment_status text not null default 'unpaid',
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  price numeric(12,2) not null,
  quantity int not null default 1,
  notes text,
  subtotal numeric(12,2) not null
);

create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_products_category on products(category_id);

-- ---------- Auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Staff Baru'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'cashier')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Helper: current user's role ----------
create or replace function public.get_my_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table inventory enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- profiles: semua staff login bisa lihat daftar staff; owner bisa ubah role, user bisa ubah nama sendiri
drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles for select to authenticated using (true);

drop policy if exists "profiles_update_own_or_owner" on profiles;
create policy "profiles_update_own_or_owner" on profiles for update to authenticated
  using (id = auth.uid() or get_my_role() = 'owner');

-- categories & products: semua staff bisa lihat; hanya owner kelola
drop policy if exists "categories_select" on categories;
create policy "categories_select" on categories for select to authenticated using (true);
drop policy if exists "categories_write" on categories;
create policy "categories_write" on categories for all to authenticated
  using (get_my_role() = 'owner') with check (get_my_role() = 'owner');

drop policy if exists "products_select" on products;
create policy "products_select" on products for select to authenticated using (true);
drop policy if exists "products_write" on products;
create policy "products_write" on products for all to authenticated
  using (get_my_role() = 'owner') with check (get_my_role() = 'owner');

-- inventory: semua staff lihat; owner & cashier bisa sesuaikan stok
drop policy if exists "inventory_select" on inventory;
create policy "inventory_select" on inventory for select to authenticated using (true);
drop policy if exists "inventory_write" on inventory;
create policy "inventory_write" on inventory for all to authenticated
  using (get_my_role() in ('owner','cashier')) with check (get_my_role() in ('owner','cashier'));

-- orders & order_items: semua staff lihat; cashier & owner bikin order; barista/owner ubah status
drop policy if exists "orders_select" on orders;
create policy "orders_select" on orders for select to authenticated using (true);
drop policy if exists "orders_insert" on orders;
create policy "orders_insert" on orders for insert to authenticated
  with check (get_my_role() in ('owner','cashier'));
drop policy if exists "orders_update" on orders;
create policy "orders_update" on orders for update to authenticated
  using (get_my_role() in ('owner','cashier','barista'));

drop policy if exists "order_items_select" on order_items;
create policy "order_items_select" on order_items for select to authenticated using (true);
drop policy if exists "order_items_insert" on order_items;
create policy "order_items_insert" on order_items for insert to authenticated
  with check (get_my_role() in ('owner','cashier'));

-- ---------- Atomic checkout RPC ----------
-- Membuat order + item + mengurangi stok dalam satu transaksi.
create or replace function public.create_order(
  p_table_number text,
  p_payment_method payment_method_t,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal numeric := 0;
  v_item jsonb;
  v_order_number text;
begin
  select coalesce(sum((i->>'subtotal')::numeric), 0) into v_subtotal
  from jsonb_array_elements(p_items) i;

  v_order_number := 'ARK-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random() * 900 + 100)::text, 3, '0');

  insert into orders (order_number, table_number, status, payment_method, payment_status, subtotal, total, created_by)
  values (v_order_number, nullif(p_table_number,''), 'pending', p_payment_method, 'paid', v_subtotal, v_subtotal, auth.uid())
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (order_id, product_id, product_name, price, quantity, notes, subtotal)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'price')::numeric,
      (v_item->>'quantity')::int,
      nullif(v_item->>'notes',''),
      (v_item->>'subtotal')::numeric
    );

    update inventory
      set stock_qty = greatest(stock_qty - (v_item->>'quantity')::numeric, 0),
          updated_at = now()
      where product_id = (v_item->>'product_id')::uuid;
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.create_order(text, payment_method_t, jsonb) to authenticated;

-- ---------- Seed: kategori & menu contoh Arkana ----------
insert into categories (name, sort_order) values
  ('Kopi', 1), ('Non-Kopi', 2), ('Makanan', 3), ('Snack', 4)
on conflict do nothing;

do $$
declare
  cat_kopi uuid; cat_nonkopi uuid; cat_makanan uuid; cat_snack uuid;
  p_id uuid;
begin
  select id into cat_kopi from categories where name = 'Kopi' limit 1;
  select id into cat_nonkopi from categories where name = 'Non-Kopi' limit 1;
  select id into cat_makanan from categories where name = 'Makanan' limit 1;
  select id into cat_snack from categories where name = 'Snack' limit 1;

  if not exists (select 1 from products) then
    insert into products (category_id, name, price) values
      (cat_kopi, 'Americano', 22000),
      (cat_kopi, 'Kopi Susu Gula Aren', 25000),
      (cat_kopi, 'Cappuccino', 27000),
      (cat_kopi, 'Latte', 27000),
      (cat_kopi, 'Espresso', 18000),
      (cat_nonkopi, 'Matcha Latte', 28000),
      (cat_nonkopi, 'Chocolate', 26000),
      (cat_nonkopi, 'Lemon Tea', 20000),
      (cat_makanan, 'Croissant Butter', 24000),
      (cat_makanan, 'Nasi Goreng Arkana', 32000),
      (cat_makanan, 'Sandwich Chicken', 30000),
      (cat_snack, 'French Fries', 18000),
      (cat_snack, 'Banana Bread', 16000);
  end if;

  for p_id in select id from products loop
    insert into inventory (product_id, stock_qty, unit, low_stock_threshold)
    values (p_id, 25, 'pcs', 5)
    on conflict (product_id) do nothing;
  end loop;
end $$;
