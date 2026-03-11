-- MVP Alignment Fixes
-- 1) Fix transition guard to properly allow service_role bypass (even if auth.uid() is null)
-- 2) Update is_admin to recognize service_role as a super-admin
-- 3) Ensure providers can read their own assigned requests regardless of status
-- 4) Fix profile RLS for team members

-- Update is_admin to be more robust for internal technical roles
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  -- service_role and supabase_admin are always admins
  select coalesce(current_setting('role', true) in ('service_role', 'supabase_admin'), false)
         or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
         or exists (
           select 1
           from public.admin_users au
           where au.user_id = auth.uid()
             and au.revoked_at is null
         );
$$;

-- Update transition guard to be more robust
create or replace function public.validate_service_request_transition()
returns trigger
language plpgsql
as $$
declare
    actor_id uuid := auth.uid();
    jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
    current_role text := current_setting('role', true);
begin
    -- Allow technical JWT roles OR service_role bypass
    if jwt_role in ('service_role', 'supabase_admin') or current_role in ('service_role', 'supabase_admin') then
        return new;
    end if;

    -- If nothing changes, allow
    if new.status = old.status
       and new.assigned_provider_id is not distinct from old.assigned_provider_id then
        return new;
    end if;

    -- Validate target status
    if new.status not in ('pending', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled') then
        raise exception 'invalid target status: %', new.status;
    end if;

    -- Admins can bypass
    if public.is_admin() then
        return new;
    end if;

    -- Must be authenticated for user-level transitions
    if actor_id is null then
        raise exception 'unauthenticated transition not allowed';
    end if;

    -- Prevent reassignment of claimed requests
    if old.assigned_provider_id is not null
       and new.assigned_provider_id is distinct from old.assigned_provider_id then
        raise exception 'cannot reassign a claimed request';
    end if;

    -- Provider claiming an unassigned pending request
    if old.status = 'pending'
       and old.assigned_provider_id is null
       and new.status = 'assigned'
       and new.assigned_provider_id = actor_id then
        return new;
    end if;

    -- Valid transitions for assigned provider
    if old.assigned_provider_id = actor_id then
        if old.status = 'assigned' and new.status in ('assigned', 'en_route', 'cancelled') then
            return new;
        elsif old.status = 'en_route' and new.status in ('en_route', 'arrived', 'cancelled') then
            return new;
        elsif old.status = 'arrived' and new.status in ('arrived', 'in_progress', 'cancelled') then
            return new;
        elsif old.status = 'in_progress' and new.status in ('in_progress', 'completed', 'cancelled') then
            return new;
        elsif old.status in ('completed', 'cancelled') and new.status = old.status then
            return new;
        end if;
        raise exception 'invalid provider transition: % -> %', old.status, new.status;
    end if;

    -- Valid transitions for customer
    if old.user_id = actor_id then
        if new.status = old.status then
            return new;
        end if;
        if new.status = 'cancelled' and old.status in ('pending', 'assigned', 'en_route', 'arrived') then
            return new;
        end if;
        if new.status = 'completed' and old.status in ('arrived', 'in_progress') then
            return new;
        end if;
        raise exception 'invalid customer transition: % -> %', old.status, new.status;
    end if;

    -- Default deny
    raise exception 'forbidden transition';
end;
$$;

-- Ensure Assigned Provider can ALWAYS read their requests
drop policy if exists "Assigned provider can read requests" on public.service_requests;
create policy "Assigned provider can read requests"
on public.service_requests
for select
to authenticated
using (auth.uid() = assigned_provider_id or public.is_admin());

-- Fix profile RLS to avoid recursion and allow team reading
create or replace function public.current_user_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid() limit 1;
$$;

drop policy if exists "Tenant members can read same tenant profiles" on public.profiles;
create policy "Tenant members can read same tenant profiles"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or (
    tenant_id is not null
    and tenant_id = public.current_user_tenant_id()
  )
  or public.is_admin()
);

-- 5) Enable Realtime for key tables
-- We check if publication exists first
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- Add tables to publication (ignoring errors if already added)
do $$
begin
  alter publication supabase_realtime add table public.service_requests;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.provider_locations;
exception when others then null;
end $$;

-- 6) Ensure profile exists on signup
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, created_at)
  values (new.id, new.raw_user_meta_data->>'full_name', now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
