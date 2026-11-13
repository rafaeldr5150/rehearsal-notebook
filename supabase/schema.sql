-- Rehearsal Notebook: Supabase schema.
-- Run once in the Supabase SQL editor. Tables are locked by row level security;
-- the app only talks to the database through the security definer functions below,
-- and a band is reached by knowing its (random) code. No user accounts are involved.

-- Tables
create table if not exists public.ce_bands(code text primary key, created_at timestamptz not null default now());
create table if not exists public.ce_docs(
  band text not null references public.ce_bands(code) on delete cascade,
  coll text not null, id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(band,coll,id));
alter table public.ce_bands enable row level security;
alter table public.ce_docs enable row level security;


-- Functions (current definitions)
CREATE OR REPLACE FUNCTION public.ce_band_exists(p_code text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists(select 1 from ce_bands where code=p_code) $function$;

CREATE OR REPLACE FUNCTION public.ce_list(p_band text)
 RETURNS TABLE(coll text, id text, data jsonb, updated_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select d.coll,d.id,d.data,d.updated_at from ce_docs d where d.band=p_band and exists(select 1 from ce_bands b where b.code=p_band);
$function$;

CREATE OR REPLACE FUNCTION public.ce_now()
 RETURNS double precision
 LANGUAGE sql
AS $function$ select extract(epoch from clock_timestamp())*1000 $function$;

CREATE OR REPLACE FUNCTION public.ce_write(p_band text, p_op text, p_coll text, p_id text, p_data jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists(select 1 from ce_bands b where b.code=p_band) then raise exception 'banda desconhecida'; end if;
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
end $function$;

revoke all on public.ce_bands, public.ce_docs from anon, authenticated;
grant execute on function public.ce_list(text), public.ce_write(text,text,text,text,jsonb), public.ce_now(), public.ce_band_exists(text) to anon, authenticated;
-- Create a band by inserting a random 12-character code:
-- insert into public.ce_bands(code) values (substr(md5(random()::text || clock_timestamp()::text),1,12));
