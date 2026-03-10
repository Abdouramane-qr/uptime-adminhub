#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Missing SUPABASE_DB_URL."
  echo "Example:"
  echo "  export SUPABASE_DB_URL='postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require'"
  exit 1
fi

echo "== E2E alignment evidence: tenants =="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select id, name, code, type, created_at
from public.tenants
where created_at >= now() - interval '7 days'
order by created_at desc;
"

echo "== E2E alignment evidence: onboarding =="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select id, user_id, tenant_id, account_type, status, submitted_at, approved_at, approved_by, rejection_reason, updated_at
from public.account_onboarding
where created_at >= now() - interval '7 days'
order by updated_at desc;
"

echo "== E2E alignment evidence: tenant owners and members =="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select p.id, p.full_name, p.tenant_id, p.role, u.email
from public.profiles p
left join auth.users u on u.id = p.id
where p.tenant_id is not null
order by p.tenant_id, p.role desc, p.full_name asc;
"

echo "== E2E alignment evidence: SP resources =="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select onboarding_id, count(*) as technicians
from public.sp_technicians
group by onboarding_id
order by technicians desc;
"

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select onboarding_id, count(*) as pricing_rows
from public.sp_service_pricing
group by onboarding_id
order by pricing_rows desc;
"

echo "== E2E alignment evidence: Fleet resources =="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select onboarding_id, count(*) as vehicles
from public.fleet_vehicles
group by onboarding_id
order by vehicles desc;
"

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select onboarding_id, count(*) as drivers
from public.fleet_drivers
group by onboarding_id
order by drivers desc;
"

echo "== E2E alignment evidence: provider presence =="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select provider_id, display_name, lat, lng, is_available, service_ids, updated_at
from public.provider_presence
order by updated_at desc
limit 50;
"

echo "== E2E alignment evidence: service requests =="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select id, user_id, assigned_provider_id, status, service_type, pickup_lat, pickup_lng, created_at
from public.service_requests
where created_at >= now() - interval '7 days'
order by created_at desc
limit 100;
"

echo "E2E alignment SQL evidence extraction completed."
