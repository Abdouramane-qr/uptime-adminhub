#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Missing SUPABASE_DB_URL."
  echo "Example:"
  echo "  export SUPABASE_DB_URL='postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require'"
  exit 1
fi

echo "== WF-008 evidence: account_onboarding =="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select id, user_id, account_type, status, submitted_at, approved_at, approved_by, updated_at
from public.account_onboarding
where created_at >= now() - interval '2 days'
order by created_at desc;
"

echo "== WF-008 evidence: SP resources =="
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

echo "== WF-008 evidence: Fleet resources =="
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

echo "== WF-008 evidence: provider_presence =="
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
select provider_id, display_name, lat, lng, is_available, service_ids, updated_at
from public.provider_presence
order by updated_at desc
limit 50;
"

echo "WF-008 SQL evidence extraction completed."
