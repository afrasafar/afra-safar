-- Afra Safar: trigger the existing Make webhook after a reservation is confirmed
-- IMPORTANT: First update the existing Make scenario to route Supabase INSERT events
-- to the current manager-notification module and UPDATE events (status=confirmed,
-- telegram_chat_id not empty) to a message for that guest. Then run this script.
-- It reuses the current webhook URL already attached to afrasafar_new_reservation.

begin;

drop trigger if exists afrasafar_telegram_confirmation_update on public.reservations;
create trigger afrasafar_telegram_confirmation_update
after update of status, telegram_chat_id on public.reservations
for each row
when (
  new.status = 'confirmed'
  and new.telegram_chat_id is not null
  and (old.status is distinct from new.status or old.telegram_chat_id is distinct from new.telegram_chat_id)
)
execute function supabase_functions.http_request(
  'https://hook.us2.make.com/54fbjhdbj5sqr3rs5tmb8icu28l1ofuf',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '10000'
);

commit;
