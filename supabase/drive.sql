-- Google Drive connection for recordings. Only the drive-oauth edge function (service role) touches this table.
create table if not exists public.ce_drive(
  band text primary key references public.ce_bands(code) on delete cascade,
  refresh_token text not null, folder_id text not null, email text not null default '',
  folders jsonb not null default '{}'::jsonb, connected_at timestamptz not null default now());
alter table public.ce_drive enable row level security;
revoke all on public.ce_drive from anon, authenticated;
