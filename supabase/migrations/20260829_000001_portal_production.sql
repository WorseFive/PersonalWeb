create extension if not exists pgcrypto;

do $$
begin
  create type public.comment_status as enum ('pending', 'published', 'rejected');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null check (post_slug ~ '^[A-Za-z0-9-]{3,100}$'),
  author_name text not null check (char_length(author_name) between 2 and 40),
  body text not null check (char_length(body) between 2 and 1200),
  status public.comment_status not null default 'pending',
  created_at timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by text,
  check ((status = 'pending' and moderated_at is null and moderated_by is null) or (status in ('published', 'rejected') and moderated_at is not null and moderated_by is not null))
);

create table if not exists public.comment_moderation_events (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete restrict,
  action public.comment_status not null check (action in ('published', 'rejected')),
  actor text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 100),
  description text not null check (char_length(description) between 2 and 280),
  source_name text not null check (char_length(source_name) between 1 and 255),
  storage_key text not null unique check (storage_key ~ '^[0-9a-f-]+\.(txt|pdf|png)$'),
  media_type text not null check (media_type in ('text/plain', 'application/pdf', 'image/png')),
  size bigint not null check (size between 1 and 5242880),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_public_reader_idx on public.comments (post_slug, created_at) where status = 'published';
create index if not exists comments_moderation_idx on public.comments (created_at) where status = 'pending';
create index if not exists resources_public_idx on public.resources (created_at desc) where visibility = 'public';
create index if not exists comment_moderation_events_comment_idx on public.comment_moderation_events (comment_id, created_at);

-- The application sends only an HMAC of the visitor address. This function is
-- intentionally callable only by the server-side service-role client.
create table if not exists public.comment_rate_windows (
  request_hash text primary key check (request_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count >= 1)
);

create or replace function public.take_comment_allowance(
  p_request_hash text,
  p_max integer default 3,
  p_window interval default interval '1 minute'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
begin
  if p_request_hash !~ '^[0-9a-f]{64}$' or p_max < 1 or p_window <= interval '0 seconds' then
    raise exception 'Invalid rate-limit input';
  end if;

  insert into public.comment_rate_windows (request_hash, window_started_at, request_count)
  values (p_request_hash, now(), 1)
  on conflict (request_hash) do update
  set
    window_started_at = case
      when public.comment_rate_windows.window_started_at <= now() - p_window then now()
      else public.comment_rate_windows.window_started_at
    end,
    request_count = case
      when public.comment_rate_windows.window_started_at <= now() - p_window then 1
      else public.comment_rate_windows.request_count + 1
    end
  returning request_count <= p_max into allowed;

  return allowed;
end;
$$;

alter table public.comments enable row level security;
alter table public.comment_moderation_events enable row level security;
alter table public.resources enable row level security;
alter table public.comment_rate_windows enable row level security;

revoke all on table public.comments from anon, authenticated;
revoke all on table public.comment_moderation_events from anon, authenticated;
revoke all on table public.resources from anon, authenticated;
revoke all on table public.comment_rate_windows from anon, authenticated;
revoke all on function public.take_comment_allowance(text, integer, interval) from public, anon, authenticated;
grant execute on function public.take_comment_allowance(text, integer, interval) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portal-resources',
  'portal-resources',
  false,
  5242880,
  array['text/plain', 'application/pdf', 'image/png']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- No browser role receives a Storage policy. The server's service-role client
-- is the only storage actor, and download responses are checked against the
-- public resources table before bytes are returned.
