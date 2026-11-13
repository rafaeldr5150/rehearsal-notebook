-- Accounts: a user (Supabase Auth: Google or email/password) keeps a list of bands.
-- Band data is still reached by the band code; the account adds "My bands", roles and "who am I" across devices.
create table if not exists public.ce_members(
  user_id uuid not null references auth.users(id) on delete cascade,
  band text not null references public.ce_bands(code) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  mid text,
  joined_at timestamptz not null default now(),
  primary key(user_id, band));
alter table public.ce_members enable row level security;
revoke all on public.ce_members from anon, authenticated;

create or replace function public.ce_my_bands() returns table(code text, role text, name text, mid text)
language sql security definer set search_path=public as $$
  select m.band, m.role, coalesce(d.data->>'name',''), m.mid
  from ce_members m
  left join ce_docs d on d.band=m.band and d.coll='config' and d.id='band'
  where m.user_id=auth.uid()
  order by m.joined_at;
$$;

-- Adds the band to my list. The first account to join a band that has no owner becomes its owner.
create or replace function public.ce_band_join(p_code text) returns text
language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  if not exists(select 1 from ce_bands b where b.code=p_code) then raise exception 'unknown band'; end if;
  select role into v_role from ce_members where user_id=auth.uid() and band=p_code;
  if v_role is not null then return v_role; end if;
  v_role := case when exists(select 1 from ce_members where band=p_code and role='owner') then 'member' else 'owner' end;
  insert into ce_members(user_id,band,role) values(auth.uid(),p_code,v_role);
  return v_role;
end $$;

create or replace function public.ce_band_leave(p_code text) returns boolean
language sql security definer set search_path=public as $$
  with d as (delete from ce_members where user_id=auth.uid() and band=p_code returning 1) select true;
$$;

create or replace function public.ce_set_me(p_code text, p_mid text) returns boolean
language sql security definer set search_path=public as $$
  with u as (update ce_members set mid=nullif(p_mid,'') where user_id=auth.uid() and band=p_code returning 1) select true;
$$;

-- Creating a band while signed in makes you its owner.
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
  if auth.uid() is not null then insert into ce_members(user_id,band,role) values(auth.uid(), v_code, 'owner'); end if;
  return v_code;
end $$;

revoke all on function public.ce_my_bands(), public.ce_band_join(text), public.ce_band_leave(text), public.ce_set_me(text,text) from public;
grant execute on function public.ce_my_bands(), public.ce_band_join(text), public.ce_band_leave(text), public.ce_set_me(text,text) to authenticated;
grant execute on function public.ce_band_create() to anon, authenticated;

-- Owners can see which accounts are in the band and change roles (at least one owner always remains).
create or replace function public.ce_band_accounts(p_code text) returns table(user_id uuid, role text, email text, name text, mid text)
language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from ce_members m where m.band=p_code and m.user_id=auth.uid() and m.role='owner') then raise exception 'forbidden'; end if;
  return query
    select m.user_id, m.role, u.email::text,
           coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')::text, m.mid
    from ce_members m join auth.users u on u.id=m.user_id
    where m.band=p_code order by m.joined_at;
end $$;

create or replace function public.ce_band_set_role(p_code text, p_user uuid, p_role text) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if p_role not in ('owner','member') then raise exception 'invalid role'; end if;
  if not exists(select 1 from ce_members m where m.band=p_code and m.user_id=auth.uid() and m.role='owner') then raise exception 'forbidden'; end if;
  if not exists(select 1 from ce_members m where m.band=p_code and m.user_id=p_user) then raise exception 'unknown member'; end if;
  if p_role='member' and not exists(select 1 from ce_members m where m.band=p_code and m.role='owner' and m.user_id<>p_user) then raise exception 'last owner'; end if;
  update ce_members set role=p_role where band=p_code and user_id=p_user;
  return true;
end $$;
revoke all on function public.ce_band_accounts(text), public.ce_band_set_role(text,uuid,text) from public;
grant execute on function public.ce_band_accounts(text), public.ce_band_set_role(text,uuid,text) to authenticated;
