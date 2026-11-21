-- Sonora, part 2: follow musicians, like videos, find people in your city, feed of videos from the people you follow.
-- Run after musicians.sql. Same rules: security definer functions, signed-in users only, visible profiles only.

create table if not exists public.ce_follows(
  follower uuid not null references auth.users(id) on delete cascade,
  followee uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  primary key(follower, followee),
  check (follower <> followee));
create index if not exists ce_follows_followee on public.ce_follows(followee);
create table if not exists public.ce_video_likes(
  video_id uuid not null references public.ce_profile_videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  primary key(video_id, user_id));
alter table public.ce_follows enable row level security;
alter table public.ce_video_likes enable row level security;
revoke all on public.ce_follows, public.ce_video_likes from anon, authenticated;

-- accents/case-insensitive text for city matching
create or replace function public.ce_norm(t text) returns text language sql immutable set search_path=public as $$
  select lower(translate(btrim(coalesce(t,'')), 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')) $$;

create or replace function public.ce_follow(p_user uuid) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  if p_user = auth.uid() then raise exception 'self'; end if;
  if not exists(select 1 from ce_profiles where user_id=p_user and visible) then raise exception 'closed'; end if;
  if (select count(*) from ce_follows where follower=auth.uid()) >= 500 then raise exception 'limit'; end if;
  insert into ce_follows(follower,followee) values(auth.uid(),p_user) on conflict do nothing;
  return true;
end $$;
create or replace function public.ce_unfollow(p_user uuid) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  delete from ce_follows where follower=auth.uid() and followee=p_user;
  return true;
end $$;

create or replace function public.ce_video_like(p_video uuid, p_on boolean) returns integer
language plpgsql security definer set search_path=public as $$
declare v_owner uuid;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  select v.user_id into v_owner from ce_profile_videos v join ce_profiles p on p.user_id=v.user_id where v.id=p_video and (p.visible or v.user_id=auth.uid());
  if v_owner is null then raise exception 'closed'; end if;
  if p_on then insert into ce_video_likes(video_id,user_id) values(p_video,auth.uid()) on conflict do nothing;
  else delete from ce_video_likes where video_id=p_video and user_id=auth.uid(); end if;
  return (select count(*)::int from ce_video_likes where video_id=p_video);
end $$;

-- videos with like counts, as seen by the caller
create or replace function public.ce_videos_json(p_user uuid) returns jsonb
language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'url',v.url,'title',v.title,'at',v.created_at,
      'likes',(select count(*) from ce_video_likes l where l.video_id=v.id),
      'liked',exists(select 1 from ce_video_likes l where l.video_id=v.id and l.user_id=auth.uid())) order by v.created_at desc),'[]'::jsonb)
  from ce_profile_videos v where v.user_id=p_user $$;

create or replace function public.ce_profile_me() returns jsonb
language plpgsql security definer set search_path=public as $$
declare r jsonb;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  select to_jsonb(p) - 'created_at' into r from ce_profiles p where p.user_id=auth.uid();
  return jsonb_build_object('profile', coalesce(r,'null'::jsonb), 'videos', ce_videos_json(auth.uid()),
    'followers', (select count(*) from ce_follows where followee=auth.uid()),
    'following', (select count(*) from ce_follows where follower=auth.uid()));
end $$;

create or replace function public.ce_profile_get(p_user uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare r jsonb;
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  select to_jsonb(p) - 'created_at' - 'updated_at' into r from ce_profiles p where p.user_id=p_user and (p.visible or p.user_id=auth.uid());
  if r is null then return null; end if;
  return jsonb_build_object('profile', r, 'videos', ce_videos_json(p_user),
    'followers', (select count(*) from ce_follows where followee=p_user),
    'following', (select count(*) from ce_follows where follower=p_user),
    'is_following', exists(select 1 from ce_follows where follower=auth.uid() and followee=p_user));
end $$;

drop function if exists public.ce_profiles_search(text,text,text,int,int);
create or replace function public.ce_profiles_search(p_q text, p_inst text, p_style text, p_limit int, p_offset int, p_mode text default 'all', p_city text default '')
returns table(user_id uuid, name text, city text, plays jsonb, styles jsonb, photo text, followers bigint, is_following boolean)
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  return query
    select p.user_id,p.name,p.city,p.plays,p.styles,p.photo,
           (select count(*) from ce_follows f where f.followee=p.user_id),
           exists(select 1 from ce_follows f where f.follower=auth.uid() and f.followee=p.user_id)
    from ce_profiles p
    where p.visible and p.name <> ''
      and (coalesce(p_q,'')='' or p.name ilike '%'||replace(replace(left(p_q,60),'%','\%'),'_','\_')||'%' or p.city ilike '%'||replace(replace(left(p_q,60),'%','\%'),'_','\_')||'%')
      and (coalesce(p_inst,'')='' or exists(select 1 from jsonb_array_elements_text(p.plays) t where lower(t)=lower(left(p_inst,40))))
      and (coalesce(p_style,'')='' or exists(select 1 from jsonb_array_elements_text(p.styles) t where lower(t)=lower(left(p_style,40))))
      and (coalesce(p_mode,'all')<>'following' or exists(select 1 from ce_follows f where f.follower=auth.uid() and f.followee=p.user_id))
      and (coalesce(p_mode,'all')<>'city' or (ce_norm(p_city)<>'' and ce_norm(p.city)=ce_norm(p_city)))
    order by p.updated_at desc
    limit least(greatest(coalesce(p_limit,20),1),40) offset greatest(coalesce(p_offset,0),0);
end $$;

-- recent videos from the people you follow
create or replace function public.ce_feed(p_limit int default 8) returns jsonb
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'auth'; end if;
  return coalesce((select jsonb_agg(x) from (
    select jsonb_build_object('user_id',p.user_id,'name',p.name,'photo',p.photo,'id',v.id,'url',v.url,'title',v.title,'at',v.created_at,
           'likes',(select count(*) from ce_video_likes l where l.video_id=v.id),
           'liked',exists(select 1 from ce_video_likes l where l.video_id=v.id and l.user_id=auth.uid())) as x
    from ce_follows f join ce_profiles p on p.user_id=f.followee and p.visible join ce_profile_videos v on v.user_id=f.followee
    where f.follower=auth.uid() order by v.created_at desc limit least(greatest(coalesce(p_limit,8),1),20)) q),'[]'::jsonb);
end $$;

revoke all on function public.ce_norm(text), public.ce_follow(uuid), public.ce_unfollow(uuid), public.ce_video_like(uuid,boolean), public.ce_videos_json(uuid),
  public.ce_profile_me(), public.ce_profile_get(uuid), public.ce_profiles_search(text,text,text,int,int,text,text), public.ce_feed(int) from public;
grant execute on function public.ce_follow(uuid), public.ce_unfollow(uuid), public.ce_video_like(uuid,boolean), public.ce_profile_me(), public.ce_profile_get(uuid),
  public.ce_profiles_search(text,text,text,int,int,text,text), public.ce_feed(int) to authenticated;
