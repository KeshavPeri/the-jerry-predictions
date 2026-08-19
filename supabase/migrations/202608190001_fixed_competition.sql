-- The Jerry Predictions: one fixed 2026/27 competition.
-- Apply through the owner-controlled Supabase SQL editor or CLI.

create extension if not exists pgcrypto;

create type public.prediction_entry_status as enum ('draft', 'locked');

create table public.competitions (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  subtitle text not null,
  results_published boolean not null default false,
  results_published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixed_competition_slug check (slug = 'the-jerry-predictions-2026-27'),
  constraint publication_timestamp_consistent check (
    (results_published and results_published_at is not null)
    or (not results_published and results_published_at is null)
  )
);

create table public.participants (
  id uuid primary key,
  competition_id uuid not null references public.competitions(id) on delete restrict,
  slug text not null,
  display_name text not null,
  monogram text not null,
  display_order smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, slug),
  unique (competition_id, display_order),
  unique (competition_id, id),
  constraint fixed_display_order check (display_order between 1 and 4),
  constraint two_letter_monogram check (monogram ~ '^[A-Z]{2}$')
);

create table public.prediction_entries (
  participant_id uuid primary key,
  competition_id uuid not null,
  status public.prediction_entry_status not null default 'draft',
  predictions jsonb not null default '{}'::jsonb,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (competition_id, participant_id)
    references public.participants(competition_id, id) on delete restrict,
  constraint predictions_are_object check (jsonb_typeof(predictions) = 'object'),
  constraint lock_timestamp_consistent check (
    (status = 'locked' and locked_at is not null)
    or (status = 'draft' and locked_at is null)
  )
);

create table public.actual_results (
  competition_id uuid primary key references public.competitions(id) on delete restrict,
  outcomes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outcomes_are_object check (jsonb_typeof(outcomes) = 'object')
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger competitions_set_updated_at
before update on public.competitions
for each row execute function public.set_updated_at();

create trigger participants_set_updated_at
before update on public.participants
for each row execute function public.set_updated_at();

create trigger actual_results_set_updated_at
before update on public.actual_results
for each row execute function public.set_updated_at();

create or replace function public.enforce_prediction_entry_transition()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if auth.role() = 'anon' then
    if old.status <> 'draft' then
      raise exception 'Anonymous clients cannot change a locked entry';
    end if;
    if new.status not in ('draft', 'locked') then
      raise exception 'Anonymous clients may only save or lock a draft';
    end if;
    if new.participant_id <> old.participant_id or new.competition_id <> old.competition_id then
      raise exception 'Anonymous clients cannot move an entry';
    end if;
  end if;

  if new.status = 'locked' and old.status = 'draft' then
    new.locked_at = now();
  elsif new.status = 'draft' then
    new.locked_at = null;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger prediction_entries_enforce_transition
before update on public.prediction_entries
for each row execute function public.enforce_prediction_entry_transition();

insert into public.competitions (
  id, slug, title, subtitle, results_published, results_published_at
) values (
  '26002700-0000-4000-8000-000000000001',
  'the-jerry-predictions-2026-27',
  'THE JERRY PREDICTIONS',
  '2026/27 Football Prediction Competition',
  false,
  null
);

insert into public.participants (
  id, competition_id, slug, display_name, monogram, display_order
) values
  ('26002700-0000-4000-8000-000000000101', '26002700-0000-4000-8000-000000000001', 'keshav', 'Keshav', 'KE', 1),
  ('26002700-0000-4000-8000-000000000102', '26002700-0000-4000-8000-000000000001', 'anshul', 'Anshul', 'AN', 2),
  ('26002700-0000-4000-8000-000000000103', '26002700-0000-4000-8000-000000000001', 'kshitij', 'Kshitij', 'KI', 3),
  ('26002700-0000-4000-8000-000000000104', '26002700-0000-4000-8000-000000000001', 'parth', 'Parth', 'PA', 4);

insert into public.prediction_entries (participant_id, competition_id)
select id, competition_id from public.participants order by display_order;

insert into public.actual_results (competition_id)
values ('26002700-0000-4000-8000-000000000001');

alter table public.competitions enable row level security;
alter table public.participants enable row level security;
alter table public.prediction_entries enable row level security;
alter table public.actual_results enable row level security;

revoke all on public.competitions from anon, authenticated;
revoke all on public.participants from anon, authenticated;
revoke all on public.prediction_entries from anon, authenticated;
revoke all on public.actual_results from anon, authenticated;

grant select on public.competitions to anon;
grant select on public.participants to anon;
grant select on public.prediction_entries to anon;
grant update (predictions, status) on public.prediction_entries to anon;
grant select on public.actual_results to anon;

create policy "anon reads fixed competition"
on public.competitions for select to anon
using (true);

create policy "anon reads fixed participants"
on public.participants for select to anon
using (true);

create policy "anon reads current entries"
on public.prediction_entries for select to anon
using (true);

create policy "anon edits drafts or locks them"
on public.prediction_entries for update to anon
using (status = 'draft')
with check (status in ('draft', 'locked'));

create policy "anon reads published actual results"
on public.actual_results for select to anon
using (
  exists (
    select 1
    from public.competitions
    where competitions.id = actual_results.competition_id
      and competitions.results_published = true
  )
);

comment on table public.prediction_entries is
  'Anonymous access protects entry state, not participant identity. Any visitor may edit any draft.';
