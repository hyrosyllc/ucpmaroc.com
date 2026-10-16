-- Fix broken RLS policy on subscriptions table
-- Remove the incorrect policy that was checking actor_id = auth.uid()
-- Restore the correct policy that checks the actor's user_id

drop policy if exists subscriptions_read on public.subscriptions;

-- Correct RLS policy: check if current user owns the actor
create policy subscriptions_actor_read
  on public.subscriptions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.actors
      where actors.id = subscriptions.actor_id
        and actors.user_id = auth.uid()
    )
  );
