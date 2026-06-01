create table if not exists public.orders (
  order_no text primary key,
  product_id text,
  product_name text not null,
  category text,
  quantity integer not null check (quantity > 0),
  amount numeric(18, 6) not null,
  base_amount numeric(18, 6),
  amount_text text not null,
  email text not null,
  network text not null,
  wallet_address text not null,
  status text not null,
  delivery text,
  tx_hash text,
  payment_verified_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.orders add column if not exists product_id text;
alter table public.orders add column if not exists category text;
alter table public.orders add column if not exists tx_hash text;
alter table public.orders add column if not exists payment_verified_at timestamptz;
alter table public.orders add column if not exists base_amount numeric(18, 6);
alter table public.orders alter column amount type numeric(18, 6);

create index if not exists orders_email_idx on public.orders (lower(email));
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create unique index if not exists orders_tx_hash_unique_idx
  on public.orders (tx_hash)
  where tx_hash is not null;

alter table public.orders enable row level security;

create table if not exists public.delivery_inventory (
  id bigserial primary key,
  product_id text,
  delivery text not null unique,
  status text not null default 'available' check (status in ('available', 'sold')),
  order_no text references public.orders(order_no) on delete set null,
  sold_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists delivery_inventory_available_idx
  on public.delivery_inventory (status, product_id, id);

create index if not exists delivery_inventory_order_no_idx
  on public.delivery_inventory (order_no);

alter table public.delivery_inventory enable row level security;

drop policy if exists "public can create orders" on public.orders;
drop policy if exists "public can update orders" on public.orders;
drop policy if exists "public can read orders" on public.orders;
drop policy if exists "anon can create pending orders" on public.orders;
drop policy if exists "anon can read safe order fields" on public.orders;

revoke all on public.orders from anon;
revoke all on public.orders from authenticated;
revoke all on public.delivery_inventory from anon;
revoke all on public.delivery_inventory from authenticated;

create or replace function public.complete_paid_order(
  p_order_no text,
  p_product_id text,
  p_quantity integer,
  p_tx_hash text,
  p_paid_at timestamptz
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_inventory_ids bigint[];
  v_delivery text;
  v_needed integer := greatest(1, coalesce(p_quantity, 1));
begin
  select *
    into v_order
    from public.orders
   where order_no = upper(p_order_no)
   for update;

  if not found then
    raise exception '订单不存在';
  end if;

  if v_order.status = '已完成' then
    return v_order;
  end if;

  if v_order.delivery is not null and length(trim(v_order.delivery)) > 0 then
    v_delivery := v_order.delivery;
  else
    select array_agg(id order by exact_product desc, id)
      into v_inventory_ids
      from (
        select
          id,
          product_id = p_product_id as exact_product
        from public.delivery_inventory
        where status = 'available'
          and (product_id = p_product_id or product_id is null)
        order by
          case when product_id = p_product_id then 0 else 1 end,
          id
        limit v_needed
        for update skip locked
      ) picked;

    if coalesce(array_length(v_inventory_ids, 1), 0) < v_needed then
      raise exception '库存不足，当前订单需要 % 条发货资料', v_needed;
    end if;

    update public.delivery_inventory
       set status = 'sold',
           order_no = v_order.order_no,
           sold_at = now()
     where id = any(v_inventory_ids);

    select string_agg(delivery, E'\n' order by id)
      into v_delivery
      from public.delivery_inventory
     where id = any(v_inventory_ids);
  end if;

  update public.orders
     set status = '已完成',
         delivery = v_delivery,
         tx_hash = p_tx_hash,
         payment_verified_at = now(),
         paid_at = coalesce(p_paid_at, now())
   where order_no = v_order.order_no
   returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.complete_paid_order(text, text, integer, text, timestamptz) from public;
grant execute on function public.complete_paid_order(text, text, integer, text, timestamptz) to service_role;

insert into public.delivery_inventory (product_id, delivery)
select
  null,
  '13' || lpad((600000000 + gs)::text, 9, '0') ||
  ' - ' || substr(md5('delivery-' || gs::text), 1, 8) ||
  ' - https://169apisms.zfk889.xyz/wxdlsim' ||
  ' - https://169apisms.zfk889.xyz/wxdlsim/tutorial'
from generate_series(1, 500) as gs
on conflict (delivery) do nothing;
