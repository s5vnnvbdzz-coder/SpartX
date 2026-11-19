-- SpartanX cloud training snapshots. Run in your private Supabase project's SQL editor.
-- Rows are private to the authenticated athlete via row-level security.
-- Each browser/device has independent snapshot rows, preventing silent cross-device overwrites.
create table if not exists public.sx_training_snapshots (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  dataset text not null check (dataset in ('spartx_sessions', 'ascensionx_training')),
  data jsonb not null,
  captured_at timestamptz not null default now(),
  primary key (user_id, device_id, dataset),
  constraint sx_training_payload_object check (jsonb_typeof(data) = 'object')
);
alter table public.sx_training_snapshots enable row level security;
revoke all on public.sx_training_snapshots from anon;
grant select, insert, update on public.sx_training_snapshots to authenticated;

create policy "Athlete reads own snapshots"
on public.sx_training_snapshots for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Athlete uploads own snapshots"
on public.sx_training_snapshots for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Athlete updates own snapshots"
on public.sx_training_snapshots for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
