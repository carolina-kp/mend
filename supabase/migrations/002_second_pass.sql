-- mend. prototype, second pass: lab comparisons, quote requests, follow-ups and trial tracking.
-- Only the server (service role key) reads and writes; row level security is on with no policies.

-- Follow-up answers ("did you make it?") are stored as events too.
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check check (type in ('feedback', 'choice', 'followup'));

-- Lab: one blind A/B comparison. The true mapping (which set is mend.) is kept here, never shown to raters.
create table if not exists public.lab_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  garment text not null,
  skill text not null,
  input jsonb not null,          -- garment, fibre mix, tools, skill
  set1 jsonb not null,           -- three ideas in the neutral format raters see
  set2 jsonb not null,
  mend_set smallint not null check (mend_set in (1, 2)),
  mend_source text not null      -- "ai" or "fallback" (if Gemini was down for the mend. side)
);

-- Lab: one outside sewer's ratings of one comparison.
create table if not exists public.lab_ratings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  run_id uuid not null references public.lab_runs (id) on delete cascade,
  rater text,                    -- a label such as "Sewer A", not a full name
  ratings jsonb not null,        -- [{ set, index, feasibility, creativity, fabric, unsafe }]
  comments jsonb not null default '{}'::jsonb
);

-- Get it made: the ready brief, without photos and without contact details.
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  garment text not null,
  parts jsonb not null,
  idea jsonb not null,           -- title, steps, difficulty, time, mender brief
  notes text,
  budget integer check (budget between 0 and 10000),
  desired_date date,
  status text not null default 'new'
);

-- The optional email on a quote request, kept apart from the brief and only for replying.
create table if not exists public.quote_contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  email text not null check (char_length(email) <= 254)
);

-- Lab trial tracking: one row per tester session.
create table if not exists public.trials (
  session_id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  followup_sent boolean not null default false,
  made boolean
);

create index if not exists lab_ratings_run_idx on public.lab_ratings (run_id);
create index if not exists quote_contacts_quote_idx on public.quote_contacts (quote_id);

alter table public.lab_runs enable row level security;
alter table public.lab_ratings enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_contacts enable row level security;
alter table public.trials enable row level security;
