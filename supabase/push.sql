-- Rehearsal reminders (web push). Run after schema.sql.
-- Replace <PROJECT_REF> and <CRON_SECRET> before running the cron.schedule call at the bottom.

create table if not exists public.ce_push(
  id bigserial primary key,
  band text not null references public.ce_bands(code) on delete cascade,
  endpoint text not null,
  sub jsonb not null,
  mid text,
  tz text not null default 'America/Sao_Paulo',
  lang text not null default 'pt',
  created_at timestamptz not null default now(),
  unique(band, endpoint));
create table if not exists public.ce_push_log(
  push_id bigint not null references public.ce_push(id) on delete cascade,
  kind text not null, for_date text not null,
  sent_at timestamptz not null default now(),
  primary key(push_id, kind, for_date));
alter table public.ce_push enable row level security;
alter table public.ce_push_log enable row level security;

create or replace function public.ce_push_save(p_band text, p_sub jsonb, p_mid text, p_tz text, p_lang text) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from ce_bands b where b.code=p_band) then raise exception 'unknown band'; end if;
  if p_sub->>'endpoint' is null or length(p_sub->>'endpoint')>1000 or pg_column_size(p_sub)>4000 then raise exception 'invalid subscription'; end if;
  insert into ce_push(band,endpoint,sub,mid,tz,lang)
  values(p_band,p_sub->>'endpoint',p_sub,p_mid,coalesce(nullif(p_tz,''),'America/Sao_Paulo'),case when p_lang in ('pt','en','es') then p_lang else 'pt' end)
  on conflict(band,endpoint) do update set sub=excluded.sub, mid=excluded.mid, tz=excluded.tz, lang=excluded.lang;
  return true;
end $$;
create or replace function public.ce_push_remove(p_band text, p_endpoint text) returns boolean
language sql security definer set search_path=public as $$
  with d as (delete from ce_push where band=p_band and endpoint=p_endpoint returning 1) select true;
$$;
revoke all on public.ce_push, public.ce_push_log from anon, authenticated;
grant execute on function public.ce_push_save(text,jsonb,text,text,text), public.ce_push_remove(text,text) to anon, authenticated;

create extension if not exists pg_cron;
create extension if not exists pg_net;
-- Hourly: the function decides who needs a reminder (eve at 18h, day at 8h, local time) and never repeats one.
-- select cron.schedule('ce-reminders','0 * * * *', $$select net.http_post(
--   url:='https://<PROJECT_REF>.supabase.co/functions/v1/reminders',
--   headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
--   body:='{}'::jsonb)$$);
