-- Musician profiles: a small, band-independent "network" for people with an account.
-- Everything goes through security definer functions that require a signed-in user.
-- A profile is private until its owner turns "visible" on.

create table if not exists public.ce_profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  bio text not null default '',
  city text not null default '',
  plays jsonb not null default '[]'::jsonb,      -- instruments the person plays
  owns jsonb not null default '[]'::jsonb,       -- instruments the person owns
  gear jsonb not null default '[]'::jsonb,       -- equipment (amps, pedals, interface...)
  styles jsonb not null default '[]'::jsonb,     -- favourite styles
  photo text not null default '',                -- small data URL (jpeg)
  contact jsonb not null default '{}'::jsonb,    -- optional: whatsapp (digits), instagram handle, contact e-mail; only shown on visible profiles
  visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now());
create table if not exists public.ce_profile_videos(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null, title text not null default '',
  created_at timestamptz not null default now());
create index if not exists ce_profile_videos_user on public.ce_profile_videos(user_id, created_at desc);
create table if not exists public.ce_reports(
  id bigserial primary key,
  reporter uuid not null references auth.users(id) on delete cascade,
  target uuid not null, video uuid, reason text not null default '',
  at timestamptz not null default now());
alter table public.ce_profiles add column if not exists contact jsonb not null default '{}'::jsonb;
alter table public.ce_profiles add column if not exists accept_msgs boolean not null default false;
alter table public.ce_profiles enable row level security;
alter table public.ce_profile_videos enable row level security;
alter table public.ce_reports enable row level security;
revoke all on public.ce_profiles, public.ce_profile_videos, public.ce_reports from anon, authenticated;

-- cleans a jsonb array of short strings: at most p_max items, each trimmed and cut to p_len characters
create or replace function public.ce_clean_list(p jsonb, p_max int, p_len int) returns jsonb
language sql immutable set search_path=public as $$
  select coalesce(jsonb_agg(v), '[]'::jsonb) from (
    select distinct on (lower(t)) left(btrim(t), p_len) as v
    from jsonb_array_elements_text(case when jsonb_typeof(p)='array' then p else '[]'::jsonb end) as t
    where btrim(t) <> '' limit p_max) x $$;

create or replace function public.ce_profile_me() returns jsonb
language plpgsql security definer set search_path=public as $$
declare r jsonb;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  select to_jsonb(p) - 'created_at' into r from ce_profiles p where p.user_id=auth.uid();
  return jsonb_build_object('profile', coalesce(r,'null'::jsonb),
    'videos', coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'url',v.url,'title',v.title,'at',v.created_at) order by v.created_at desc) from ce_profile_videos v where v.user_id=auth.uid()),'[]'::jsonb));
end $$;

create or replace function public.ce_profile_save(p jsonb) returns boolean
language plpgsql security definer set search_path=public as $$
declare ph text := coalesce(p->>'photo','');
  v_wa text := regexp_replace(coalesce(p->'contact'->>'whatsapp',''),'[^0-9]','','g');
  v_ig text := regexp_replace(btrim(coalesce(p->'contact'->>'instagram','')),'^@|^https?://(www\.)?instagram\.com/|/.*$','','gi');
  v_contact jsonb;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  if ph <> '' and (ph !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$' or length(ph) > 60000) then raise exception 'photo'; end if;
  if v_wa <> '' and (length(v_wa) < 8 or length(v_wa) > 15) then raise exception 'contact'; end if;
  if v_ig <> '' and v_ig !~ '^[A-Za-z0-9._]{1,30}$' then raise exception 'contact'; end if;
  v_contact := jsonb_build_object('whatsapp',v_wa,'instagram',v_ig);  -- no public e-mail: people write through "Send message"
  insert into ce_profiles(user_id,name,bio,city,plays,owns,gear,styles,photo,contact,accept_msgs,visible)
  values(auth.uid(), left(btrim(coalesce(p->>'name','')),60), left(btrim(coalesce(p->>'bio','')),600), left(btrim(coalesce(p->>'city','')),60),
    ce_clean_list(p->'plays',12,40), ce_clean_list(p->'owns',20,40), ce_clean_list(p->'gear',30,60), ce_clean_list(p->'styles',12,40), ph, v_contact,
    coalesce((p->>'accept_msgs')::boolean,false), coalesce((p->>'visible')::boolean,false))
  on conflict(user_id) do update set name=excluded.name, bio=excluded.bio, city=excluded.city, plays=excluded.plays, owns=excluded.owns,
    gear=excluded.gear, styles=excluded.styles, photo=excluded.photo, contact=excluded.contact, accept_msgs=excluded.accept_msgs, visible=excluded.visible, updated_at=now();
  return true;
end $$;

-- other people's profiles: only the ones that turned "visible" on (the list never includes e-mails)
create or replace function public.ce_profiles_search(p_q text, p_inst text, p_style text, p_limit int, p_offset int)
returns table(user_id uuid, name text, city text, plays jsonb, styles jsonb, photo text)
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  return query
    select p.user_id,p.name,p.city,p.plays,p.styles,p.photo from ce_profiles p
    where p.visible and p.name <> ''
      and (coalesce(p_q,'')='' or p.name ilike '%'||replace(replace(left(p_q,60),'%','\%'),'_','\_')||'%' or p.city ilike '%'||replace(replace(left(p_q,60),'%','\%'),'_','\_')||'%')
      and (coalesce(p_inst,'')='' or exists(select 1 from jsonb_array_elements_text(p.plays) t where lower(t)=lower(left(p_inst,40))))
      and (coalesce(p_style,'')='' or exists(select 1 from jsonb_array_elements_text(p.styles) t where lower(t)=lower(left(p_style,40))))
    order by p.updated_at desc
    limit least(greatest(coalesce(p_limit,20),1),40) offset greatest(coalesce(p_offset,0),0);
end $$;

create or replace function public.ce_profile_get(p_user uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r jsonb;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  select to_jsonb(p) - 'created_at' - 'updated_at' into r from ce_profiles p where p.user_id=p_user and (p.visible or p.user_id=auth.uid());
  if r is null then return null; end if;
  return jsonb_build_object('profile', r,
    'videos', coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'url',v.url,'title',v.title,'at',v.created_at) order by v.created_at desc) from ce_profile_videos v where v.user_id=p_user),'[]'::jsonb));
end $$;

create or replace function public.ce_video_add(p_url text, p_title text) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  p_url := btrim(coalesce(p_url,''));
  if length(p_url)>300 or p_url !~* '^https://(www\.|m\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|instagram\.com|tiktok\.com|facebook\.com|fb\.watch|drive\.google\.com)/' then raise exception 'url'; end if;
  if (select count(*) from ce_profile_videos where user_id=auth.uid()) >= 30 then raise exception 'limit'; end if;
  insert into ce_profile_videos(user_id,url,title) values(auth.uid(),p_url,left(btrim(coalesce(p_title,'')),100)) returning id into v_id;
  return v_id;
end $$;
create or replace function public.ce_video_del(p_id uuid) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  delete from ce_profile_videos where id=p_id and user_id=auth.uid();
  return true;
end $$;

create or replace function public.ce_profile_report(p_user uuid, p_video uuid, p_reason text) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  if (select count(*) from ce_reports where reporter=auth.uid() and at > now() - interval '1 day') >= 10 then raise exception 'rate limited'; end if;
  insert into ce_reports(reporter,target,video,reason) values(auth.uid(),p_user,p_video,left(btrim(coalesce(p_reason,'')),300));
  return true;
end $$;

create or replace function public.ce_profile_delete() returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  delete from ce_profiles where user_id=auth.uid();
  delete from ce_profile_videos where user_id=auth.uid();
  return true;
end $$;

revoke all on function public.ce_clean_list(jsonb,int,int), public.ce_profile_me(), public.ce_profile_save(jsonb), public.ce_profiles_search(text,text,text,int,int),
  public.ce_profile_get(uuid), public.ce_video_add(text,text), public.ce_video_del(uuid), public.ce_profile_report(uuid,uuid,text), public.ce_profile_delete() from public;
grant execute on function public.ce_profile_me(), public.ce_profile_save(jsonb), public.ce_profiles_search(text,text,text,int,int),
  public.ce_profile_get(uuid), public.ce_video_add(text,text), public.ce_video_del(uuid), public.ce_profile_report(uuid,uuid,text), public.ce_profile_delete() to authenticated;


-- Messages by e-mail: the sender never sees the recipient's address. Only the send-message edge function (service role) calls the gate.
create table if not exists public.ce_messages(
  id bigserial primary key,
  sender uuid not null references auth.users(id) on delete cascade,
  recipient uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  ok boolean not null default false);
create index if not exists ce_messages_sender_at on public.ce_messages(sender, at desc);
create index if not exists ce_messages_recipient_at on public.ce_messages(recipient, at desc);
alter table public.ce_messages enable row level security;
revoke all on public.ce_messages from anon, authenticated;

create or replace function public.ce_msg_gate(p_from uuid, p_to uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare v_to record; v_from record; v_id bigint;
begin
  if p_from is null or p_to is null or p_from = p_to then raise exception 'self'; end if;
  select p.name, u.email into v_to from ce_profiles p join auth.users u on u.id=p.user_id where p.user_id=p_to and p.visible and p.accept_msgs and u.email is not null;
  if v_to is null then raise exception 'closed'; end if;
  if (select count(*) from ce_messages where sender=p_from and at > now() - interval '1 day') >= 5 then raise exception 'rate_sender'; end if;
  if (select count(*) from ce_messages where sender=p_from and recipient=p_to and at > now() - interval '1 day') >= 2 then raise exception 'rate_pair'; end if;
  if (select count(*) from ce_messages where recipient=p_to and at > now() - interval '1 day') >= 20 then raise exception 'rate_recipient'; end if;
  select coalesce(nullif(p.name,''), nullif(u.raw_user_meta_data->>'full_name',''), nullif(u.raw_user_meta_data->>'name',''), 'Um músico') as name, u.email into v_from from auth.users u left join ce_profiles p on p.user_id=u.id where u.id=p_from;
  insert into ce_messages(sender,recipient) values(p_from,p_to) returning id into v_id;
  return jsonb_build_object('id',v_id,'to_email',v_to.email,'to_name',v_to.name,'from_email',v_from.email,'from_name',v_from.name,'from_id',p_from);
end $$;
revoke all on function public.ce_msg_gate(uuid,uuid) from public, anon, authenticated;
grant execute on function public.ce_msg_gate(uuid,uuid) to service_role;

-- contact e-mails were removed from public profiles: messages go through send-message
update public.ce_profiles set contact = contact - 'email' where contact ? 'email';
