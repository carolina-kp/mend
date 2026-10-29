-- mend. prototype: feedback and choices. Only anonymous data (brief section 8).
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('feedback', 'choice')),
  session_id text not null,
  garment text,
  skill text,
  source text,
  sample text,
  rating smallint check (rating between 1 and 5),
  would_try boolean,
  data jsonb not null default '{}'::jsonb -- fibre mix, tools, ideas shown, comment, choice details
);
create index if not exists events_created_at_idx on public.events (created_at desc);

-- Only the server (service role key) reads and writes. No public access at all.
alter table public.events enable row level security;
