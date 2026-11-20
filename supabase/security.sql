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
