CREATE OR REPLACE FUNCTION public.registrar_venta(p_tipo text, p_forma_pago text, p_customer_id uuid, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid(); prof public.profiles; it jsonb; v public.product_variants; p public.products;
  v_total_pares int := 0; v_total numeric := 0; unit numeric; s_id uuid; folio text; n int; qty int;
begin
  if uid is null then raise exception 'No autenticado'; end if;
  if p_tipo not in ('pieza','media_docena','docena') then raise exception 'Tipo de venta inválido'; end if;
  select * into prof from profiles where id = uid;
  select coalesce(sum((x->>'cantidad')::int),0) into v_total_pares from jsonb_array_elements(p_items) x;
  if v_total_pares <= 0 then raise exception 'La venta no tiene pares'; end if;
  if p_tipo = 'docena' and v_total_pares <> coalesce(prof.pares_docena,12) then
    raise exception 'Una docena debe contener exactamente % pares', coalesce(prof.pares_docena,12); end if;
  if p_tipo = 'media_docena' and v_total_pares <> coalesce(prof.pares_media_docena,6) then
    raise exception 'Una media docena debe contener exactamente % pares', coalesce(prof.pares_media_docena,6); end if;

  select count(*) + 1 into n from sales where user_id = uid;
  folio := 'V-' || lpad(n::text, 6, '0');
  insert into sales(user_id, customer_id, folio, tipo_venta, forma_pago, total_pares, subtotal, total)
    values (uid, p_customer_id, folio, p_tipo, p_forma_pago, v_total_pares, 0, 0) returning id into s_id;

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
    v_total := v_total + unit * qty;
  end loop;
  update sales set subtotal = v_total, total = v_total where id = s_id;
  return jsonb_build_object('id', s_id, 'folio', folio, 'total', v_total);
end $function$;