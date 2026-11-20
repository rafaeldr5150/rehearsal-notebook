-- Security hardening. Run after schema.sql / accounts.sql / push.sql / drive.sql.
-- 1) band codes follow renames (needed to rotate an invite code)
alter table public.ce_docs    drop constraint if exists ce_docs_band_fkey,    add constraint ce_docs_band_fkey    foreign key (band) references public.ce_bands(code) on delete cascade on update cascade;
alter table public.ce_push    drop constraint if exists ce_push_band_fkey,    add constraint ce_push_band_fkey    foreign key (band) references public.ce_bands(code) on delete cascade on update cascade;
alter table public.ce_drive   drop constraint if exists ce_drive_band_fkey,   add constraint ce_drive_band_fkey   foreign key (band) references public.ce_bands(code) on delete cascade on update cascade;
alter table public.ce_members drop constraint if exists ce_members_band_fkey, add constraint ce_members_band_fkey foreign key (band) references public.ce_bands(code) on delete cascade on update cascade;

-- 2) new codes: 20 hex characters (80 bits) from a cryptographically secure source
create or replace function public.ce_new_code() returns text
language sql volatile set search_path=public,extensions as $$ select encode(extensions.gen_random_bytes(10),'hex') $$;
revoke all on function public.ce_new_code() from public;

create or replace function public.ce_band_create() returns text
language plpgsql security definer set search_path=public,extensions as $$
declare v_ip text; v_code text; v_n int;
begin
  v_ip := coalesce(nullif(trim(split_part(coalesce(nullif(current_setting('request.headers', true), '')::json->>'x-forwarded-for', ''), ',', 1)), ''), '?');
  delete from ce_create_log where at < now() - interval '1 day';
  select count(*) into v_n from ce_create_log where ip = v_ip and at > now() - interval '1 hour';
  if v_n >= 5 then raise exception 'rate limited'; end if;
  loop
    v_code := ce_new_code();
    exit when not exists (select 1 from ce_bands where code = v_code);
  end loop;
  insert into ce_bands(code) values (v_code);
  insert into ce_create_log(ip) values (v_ip);
  if auth.uid() is not null then insert into ce_members(user_id,band,role) values(auth.uid(), v_code, 'owner'); end if;
  return v_code;
end $$;
revoke all on function public.ce_band_create() from public;
grant execute on function public.ce_band_create() to anon, authenticated;

-- 3) an owner can replace the invite code: the old link and code stop working immediately
create or replace function public.ce_band_rotate(p_code text) returns text
language plpgsql security definer set search_path=public,extensions as $$
declare v_new text;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  if not exists(select 1 from ce_members m where m.band=p_code and m.user_id=auth.uid() and m.role='owner') then raise exception 'forbidden'; end if;
  loop
    v_new := ce_new_code();
    exit when not exists (select 1 from ce_bands where code = v_new);
  end loop;
  update ce_bands set code=v_new where code=p_code;
  return v_new;
end $$;
revoke all on function public.ce_band_rotate(text) from public;
grant execute on function public.ce_band_rotate(text) to authenticated;

-- 4) brute-force guard: wrong band codes are logged per client IP; after 40 misses in an hour the IP is blocked for lookups
create table if not exists public.ce_guess_log(ip text not null, at timestamptz not null default now());
create index if not exists ce_guess_log_ip_at on public.ce_guess_log(ip, at);
alter table public.ce_guess_log enable row level security;
revoke all on public.ce_guess_log from anon, authenticated;

create or replace function public.ce_ip() returns text language sql stable set search_path=public as $$
  select coalesce(nullif(trim(split_part(coalesce(nullif(current_setting('request.headers', true), '')::json->>'x-forwarded-for', ''), ',', 1)), ''), '?') $$;

create or replace function public.ce_guess_block() returns void language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from ce_guess_log where ip=ce_ip() and at > now() - interval '1 hour') >= 40 then raise exception 'rate limited'; end if;
end $$;
create or replace function public.ce_guess_fail() returns void language plpgsql security definer set search_path=public as $$
begin
  delete from ce_guess_log where at < now() - interval '1 day';
  insert into ce_guess_log(ip) values (ce_ip());
end $$;
revoke all on function public.ce_ip(), public.ce_guess_block(), public.ce_guess_fail() from public;

create or replace function public.ce_band_exists(p_code text) returns boolean language plpgsql security definer set search_path=public as $$
declare ok boolean;
begin
  perform ce_guess_block();
  select exists(select 1 from ce_bands where code=p_code) into ok;
  if not ok then perform ce_guess_fail(); end if;
  return ok;
end $$;

create or replace function public.ce_list(p_band text) returns table(coll text, id text, data jsonb, updated_at timestamp with time zone)
language plpgsql security definer set search_path=public as $$
begin
  perform ce_guess_block();
  if not exists(select 1 from ce_bands b where b.code=p_band) then perform ce_guess_fail(); return; end if;
  return query select d.coll,d.id,d.data,d.updated_at from ce_docs d where d.band=p_band;
end $$;

create or replace function public.ce_write(p_band text, p_op text, p_coll text, p_id text, p_data jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  perform ce_guess_block();
  if not exists(select 1 from ce_bands b where b.code=p_band) then perform ce_guess_fail(); raise exception 'banda desconhecida'; end if;
  if length(p_coll)>40 or length(p_id)>80 or pg_column_size(p_data)>600000 then raise exception 'dados inválidos'; end if;
  if p_op='set' then
    insert into ce_docs(band,coll,id,data) values(p_band,p_coll,p_id,coalesce(p_data,'{}'::jsonb))
    on conflict(band,coll,id) do update set data=excluded.data, updated_at=now();
  elsif p_op='update' then
    insert into ce_docs(band,coll,id,data) values(p_band,p_coll,p_id,coalesce(p_data,'{}'::jsonb))
    on conflict(band,coll,id) do update set data=ce_docs.data||excluded.data, updated_at=now();
  elsif p_op='delete' then
    delete from ce_docs where band=p_band and coll=p_coll and id=p_id;
  else raise exception 'operação inválida'; end if;
  return true;
end $$;


-- 5) an owner can delete the whole band (songs, members, reminders and the Drive link are removed with it)
create or replace function public.ce_band_delete(p_code text) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  if not exists(select 1 from ce_members m where m.band=p_code and m.user_id=auth.uid() and m.role='owner') then raise exception 'forbidden'; end if;
  delete from ce_bands where code=p_code;
  return true;
end $$;
revoke all on function public.ce_band_delete(text) from public;
grant execute on function public.ce_band_delete(text) to authenticated;
