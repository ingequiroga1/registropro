
create table public.profiles (
  id uuid primary key,
  nombre text, negocio text default 'Mi zapatería', telefono text,
  moneda text not null default 'MXN',
  stock_minimo_default int not null default 2,
  pares_media_docena int not null default 6,
  pares_docena int not null default 12,
  meta_modelos int not null default 150,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  codigo text not null, modelo text not null, nombre text not null default '',
  marca text, categoria text not null default 'General', descripcion text,
  precio_par numeric not null default 0, precio_media_docena numeric not null default 0,
  precio_docena numeric not null default 0, costo numeric, imagen_url text,
  activo boolean not null default true, created_at timestamptz not null default now(),
  unique (user_id, codigo)
);
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  talla text not null, color text not null,
  stock_actual int not null default 0 check (stock_actual >= 0),
  stock_minimo int not null default 2,
  created_at timestamptz not null default now(),
  unique (product_id, talla, color)
);
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  nombre text not null, telefono text not null default '', whatsapp text, direccion text, notas text,
  created_at timestamptz not null default now()
);
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  customer_id uuid references public.customers(id) on delete set null,
  folio text not null,
  tipo_venta text not null check (tipo_venta in ('pieza','media_docena','docena')),
  forma_pago text not null, total_pares int not null, subtotal numeric not null, total numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, folio)
);
create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  modelo text not null, talla text not null, color text not null,
  cantidad int not null, precio_unitario numeric not null, subtotal numeric not null,
  created_at timestamptz not null default now()
);
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  variant_id uuid references public.product_variants(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','venta','ajuste','conteo','devolucion')),
  cantidad int not null, stock_anterior int not null, stock_nuevo int not null,
  referencia text, created_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['products','product_variants','customers','sales','sale_items','inventory_movements'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

create index on public.product_variants(product_id);
create index on public.sale_items(sale_id);
create index on public.sales(user_id, created_at desc);
create index on public.inventory_movements(user_id, created_at desc);

-- Move inventory (entrada / conteo / ajuste / devolucion), creating variant if needed
create or replace function public.mover_inventario(
  p_product_id uuid, p_color text, p_talla text, p_cantidad int, p_tipo text, p_modo text default 'sumar', p_referencia text default null)
returns int language plpgsql security invoker set search_path = public as $$
declare v public.product_variants; v_new int; v_min int;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if p_cantidad < 0 and p_modo = 'fijar' then raise exception 'Cantidad inválida'; end if;
  if not exists (select 1 from products where id = p_product_id and user_id = auth.uid()) then raise exception 'Producto no encontrado'; end if;
  select coalesce((select stock_minimo_default from profiles where id = auth.uid()), 2) into v_min;
  insert into product_variants(product_id, user_id, talla, color, stock_actual, stock_minimo)
    values (p_product_id, auth.uid(), trim(p_talla), trim(p_color), 0, v_min)
    on conflict (product_id, talla, color) do nothing;
  select * into v from product_variants where product_id = p_product_id and talla = trim(p_talla) and color = trim(p_color) for update;
  v_new := case when p_modo = 'fijar' then p_cantidad else v.stock_actual + p_cantidad end;
  if v_new < 0 then raise exception 'El inventario no puede quedar negativo'; end if;
  update product_variants set stock_actual = v_new where id = v.id;
  insert into inventory_movements(user_id, variant_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia)
    values (auth.uid(), v.id, p_tipo, v_new - v.stock_actual, v.stock_actual, v_new, p_referencia);
  return v_new;
end $$;

-- Transactional sale
create or replace function public.registrar_venta(
  p_tipo text, p_forma_pago text, p_customer_id uuid, p_items jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  uid uuid := auth.uid(); prof public.profiles; it jsonb; v public.product_variants; p public.products;
  total_pares int := 0; total numeric := 0; unit numeric; s_id uuid; folio text; n int; qty int;
begin
  if uid is null then raise exception 'No autenticado'; end if;
  if p_tipo not in ('pieza','media_docena','docena') then raise exception 'Tipo de venta inválido'; end if;
  select * into prof from profiles where id = uid;
  select coalesce(sum((x->>'cantidad')::int),0) into total_pares from jsonb_array_elements(p_items) x;
  if total_pares <= 0 then raise exception 'La venta no tiene pares'; end if;
  if p_tipo = 'docena' and total_pares <> coalesce(prof.pares_docena,12) then
    raise exception 'Una docena debe contener exactamente % pares', coalesce(prof.pares_docena,12); end if;
  if p_tipo = 'media_docena' and total_pares <> coalesce(prof.pares_media_docena,6) then
    raise exception 'Una media docena debe contener exactamente % pares', coalesce(prof.pares_media_docena,6); end if;

  select count(*) + 1 into n from sales where user_id = uid;
  folio := 'V-' || lpad(n::text, 6, '0');
  insert into sales(user_id, customer_id, folio, tipo_venta, forma_pago, total_pares, subtotal, total)
    values (uid, p_customer_id, folio, p_tipo, p_forma_pago, total_pares, 0, 0) returning id into s_id;

  for it in select * from jsonb_array_elements(p_items) loop
    qty := (it->>'cantidad')::int;
    if qty <= 0 then raise exception 'Cantidad inválida'; end if;
    select * into v from product_variants where id = (it->>'variant_id')::uuid and user_id = uid for update;
    if not found then raise exception 'Variante no encontrada'; end if;
    select * into p from products where id = v.product_id;
    if v.stock_actual < qty then
      raise exception 'Solo hay % pares disponibles de % talla % %', v.stock_actual, p.modelo, v.talla, v.color; end if;
    unit := case p_tipo
      when 'pieza' then p.precio_par
      when 'media_docena' then round(p.precio_media_docena / coalesce(prof.pares_media_docena,6), 2)
      else round(p.precio_docena / coalesce(prof.pares_docena,12), 2) end;
    insert into sale_items(sale_id, user_id, product_id, variant_id, modelo, talla, color, cantidad, precio_unitario, subtotal)
      values (s_id, uid, p.id, v.id, p.modelo, v.talla, v.color, qty, unit, unit * qty);
    update product_variants set stock_actual = stock_actual - qty where id = v.id;
    insert into inventory_movements(user_id, variant_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia)
      values (uid, v.id, 'venta', -qty, v.stock_actual, v.stock_actual - qty, folio);
    total := total + unit * qty;
  end loop;
  update sales set subtotal = total, total = total where id = s_id;
  return jsonb_build_object('id', s_id, 'folio', folio, 'total', total);
end $$;

-- Demo data for the signed-in user
create or replace function public.cargar_demo()
returns void language plpgsql security invoker set search_path = public as $$
declare uid uuid := auth.uid(); pid uuid; c text; t text;
  r record;
begin
  if uid is null then raise exception 'No autenticado'; end if;
  insert into profiles(id) values (uid) on conflict do nothing;
  for r in select * from (values
    ('TEN520','Tenis 520','Tenis',250,1350,2500, array['Negro','Rojo'], array['23','24','25','26']),
    ('BOT310','Bota 310','Botas',450,2500,4800, array['Miel','Negro'], array['24','25','26','27']),
    ('TEN410','Tenis 410','Tenis',230,1250,2300, array['Blanco','Negro'], array['23','24','25','26'])
  ) as x(codigo, modelo, categoria, pp, pm, pd, colores, tallas) loop
    if exists (select 1 from products where user_id = uid and codigo = r.codigo) then continue; end if;
    insert into products(user_id, codigo, modelo, nombre, categoria, precio_par, precio_media_docena, precio_docena)
      values (uid, r.codigo, r.modelo, r.modelo, r.categoria, r.pp, r.pm, r.pd) returning id into pid;
    foreach c in array r.colores loop foreach t in array r.tallas loop
      perform mover_inventario(pid, c, t, 2 + floor(random()*14)::int, 'conteo', 'fijar', 'Datos demo');
    end loop; end loop;
  end loop;
end $$;

grant execute on function public.mover_inventario(uuid,text,text,int,text,text,text) to authenticated;
grant execute on function public.registrar_venta(text,text,uuid,jsonb) to authenticated;
grant execute on function public.cargar_demo() to authenticated;
