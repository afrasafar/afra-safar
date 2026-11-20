-- Afra Safar: one-time Telegram account linking for reservation notifications
-- Run this file in Supabase SQL Editor BEFORE installing Make's update trigger.
-- Safe to run more than once. It does not alter existing booking/payment functions.

begin;

alter table public.reservations
  add column if not exists telegram_link_token text,
  add column if not exists telegram_chat_id text,
  add column if not exists telegram_linked_at timestamptz;

-- Give existing reservations tokens too, while future bookings receive one by default.
update public.reservations
set telegram_link_token = replace(gen_random_uuid()::text, '-', '')
where telegram_link_token is null and telegram_chat_id is null;

alter table public.reservations
  alter column telegram_link_token set default replace(gen_random_uuid()::text, '-', '');

create unique index if not exists reservations_telegram_link_token_uidx
  on public.reservations (telegram_link_token)
  where telegram_link_token is not null;

create or replace function public.get_public_telegram_link(
  p_reservation_code text,
  p_guest_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_token text;
  v_chat_id text;
  v_status text;
begin
  select r.telegram_link_token, r.telegram_chat_id, r.status
    into v_token, v_chat_id, v_status
  from public.reservations r
  where r.reservation_code = trim(coalesce(p_reservation_code, ''))
    and private.normalize_iranian_phone(r.guest_phone) = private.normalize_iranian_phone(p_guest_phone)
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'message', 'رزرو با این کد و شماره موبایل پیدا نشد.');
  end if;

  if v_chat_id is not null then
    return jsonb_build_object('success', true, 'linked', true, 'message', 'تلگرام قبلاً متصل شده است.');
  end if;

  if lower(coalesce(v_status, '')) in ('rejected', 'cancelled', 'expired') or v_token is null then
    return jsonb_build_object('success', false, 'message', 'این رزرو امکان اتصال تلگرام ندارد.');
  end if;

  return jsonb_build_object('success', true, 'linked', false, 'link_token', v_token);
end;
$function$;

revoke all on function public.get_public_telegram_link(text, text) from public;
grant execute on function public.get_public_telegram_link(text, text) to anon, authenticated;

create or replace function public.link_reservation_telegram(
  p_token text,
  p_chat_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_reservation public.reservations%rowtype;
begin
  if coalesce(trim(p_token), '') !~ '^[0-9a-fA-F]{32}$' then
    return jsonb_build_object('success', false, 'message', 'لینک اتصال معتبر نیست. از صفحه پیگیری رزرو لینک تازه بگیرید.');
  end if;
  if coalesce(trim(p_chat_id), '') !~ '^[0-9]{1,20}$' then
    return jsonb_build_object('success', false, 'message', 'شناسه گفت‌وگوی تلگرام معتبر نیست.');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lower(trim(p_token)), 0));

  update public.reservations r
     set telegram_chat_id = trim(p_chat_id),
         telegram_linked_at = statement_timestamp(),
         telegram_link_token = null
   where r.telegram_link_token = lower(trim(p_token))
     and r.telegram_chat_id is null
     and lower(coalesce(r.status, '')) not in ('rejected', 'cancelled', 'expired')
  returning r.* into v_reservation;

  if not found then
    return jsonb_build_object('success', false, 'message', 'این لینک قبلاً استفاده شده یا منقضی است. از صفحه پیگیری رزرو بررسی کنید.');
  end if;

  return jsonb_build_object(
    'success', true,
    'linked', true,
    'reservation_code', v_reservation.reservation_code,
    'status', v_reservation.status,
    'message', 'تلگرام به رزرو افرا سفر متصل شد.'
  );
end;
$function$;

revoke all on function public.link_reservation_telegram(text, text) from public;
grant execute on function public.link_reservation_telegram(text, text) to anon, authenticated;

commit;
