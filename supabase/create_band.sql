-- Lets a first-time user create a band from the entry screen.
-- Rate limited per client IP (5 per hour) to discourage abuse.
create table if not exists public.ce_create_log(ip text not null, at timestamptz not null default now());
alter table public.ce_create_log enable row level security;
revoke all on public.ce_create_log from anon, authenticated;

create or replace function public.ce_band_create() returns text
language plpgsql security definer set search_path=public as $$
declare v_ip text; v_code text; v_n int;
begin
  v_ip := coalesce(nullif(trim(split_part(coalesce(nullif(current_setting('request.headers', true), '')::json->>'x-forwarded-for', ''), ',', 1)), ''), '?');
  delete from ce_create_log where at < now() - interval '1 day';
  select count(*) into v_n from ce_create_log where ip = v_ip and at > now() - interval '1 hour';
  if v_n >= 5 then raise exception 'rate limited'; end if;
  loop
    v_code := substr(md5(random()::text || clock_timestamp()::text), 1, 12);
    exit when not exists (select 1 from ce_bands where code = v_code);
  end loop;
  insert into ce_bands(code) values (v_code);
  insert into ce_create_log(ip) values (v_ip);
  return v_code;
end $$;
revoke all on function public.ce_band_create() from public;
grant execute on function public.ce_band_create() to anon, authenticated;
