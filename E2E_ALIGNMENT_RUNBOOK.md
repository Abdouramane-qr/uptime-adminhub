# E2E Alignment Runbook

Date: 2026-03-10

Purpose:
- validate `uptime-adminhub` against the legacy `admin_uptime` workflow
- confirm backend side effects are present
- confirm mobile-facing outcomes still work

This runbook is intentionally operational:
- perform the UI actions
- verify the database state
- confirm the expected mobile outcome

## Preconditions

- `uptime-adminhub` running locally
- latest `admin-portal` deployed
- latest `onboarding-crud` deployed
- admin user can access:
  - `/accounts`
  - `/onboarding`
  - `/dashboard`
- `VITE_ALLOW_MOCK_FALLBACK=false`

Recommended local validation before starting:

```bash
npm run qa:strict-backend
npm test
npm run build:strict-backend
```

Recommended SQL evidence export:

```bash
export SUPABASE_DB_URL='postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require'
./scripts/e2e_alignment_sql_evidence.sh
```

## Test Data Convention

Use unique emails per run.

Suggested values:

- SP account email:
  - `sp.e2e.<timestamp>@example.com`
- Fleet account email:
  - `fleet.e2e.<timestamp>@example.com`

Keep a note of:
- tenant id
- onboarding id
- owner user id

## Useful SQL Queries

### Latest tenants

```sql
select id, name, code, type, created_at
from public.tenants
order by created_at desc
limit 20;
```

### Latest onboarding rows

```sql
select id, user_id, tenant_id, account_type, status, submitted_at, approved_at, approved_by, rejection_reason, updated_at
from public.account_onboarding
order by updated_at desc
limit 20;
```

### SP technicians by onboarding

```sql
select onboarding_id, count(*) as technicians
from public.sp_technicians
group by onboarding_id
order by technicians desc;
```

### SP pricing by onboarding

```sql
select onboarding_id, count(*) as pricing_rows
from public.sp_service_pricing
group by onboarding_id
order by pricing_rows desc;
```

### Fleet vehicles by onboarding

```sql
select onboarding_id, count(*) as vehicles
from public.fleet_vehicles
group by onboarding_id
order by vehicles desc;
```

### Fleet drivers by onboarding

```sql
select onboarding_id, count(*) as drivers
from public.fleet_drivers
group by onboarding_id
order by drivers desc;
```

### Provider presence

```sql
select provider_id, display_name, lat, lng, is_available, service_ids, updated_at
from public.provider_presence
order by updated_at desc
limit 20;
```

### Owner profile linkage

```sql
select p.id, p.full_name, p.tenant_id, p.role, u.email
from public.profiles p
left join auth.users u on u.id = p.id
order by p.created_at desc nulls last
limit 20;
```

## Scenario A: Service Provider Workflow

## A1. Create SP Account In Accounts

UI:
- open `/accounts`
- click create account
- choose `SP`
- enter company name
- enter email
- enter phone
- save

Expected:
- tenant is created
- owner user is created
- onboarding row exists

Verify in SQL:

```sql
select id, name, code, type
from public.tenants
where type = 'sp'
order by created_at desc
limit 5;
```

```sql
select id, tenant_id, user_id, account_type, status, company_name, contact_email
from public.account_onboarding
where account_type = 'sp'
order by created_at desc
limit 5;
```

Pass criteria:
- tenant exists
- onboarding exists
- status is `draft`

## A2. Open Onboarding Queue

UI:
- open `/onboarding`
- filter to `SP` if needed
- open the newly created dossier

Expected:
- correct company displayed
- overview values match SQL
- no admin error

## A3. Complete SP Resources

Current note:
- resource creation for technicians/pricing must be confirmed against the current onboarding UI capabilities
- if the UI does not yet create these resources, record as a functional gap

Expected target state:
- `sp_technicians` rows exist
- `sp_service_pricing` rows exist

Verify in SQL:

```sql
select *
from public.sp_technicians
where onboarding_id = '<ONBOARDING_ID>';
```

```sql
select *
from public.sp_service_pricing
where onboarding_id = '<ONBOARDING_ID>';
```

Pass criteria:
- at least one technician row
- at least one pricing row

If missing:
- mark as alignment gap

## A4. Submit Dossier

UI:
- use the onboarding workflow to submit the dossier

Expected:
- onboarding transitions `draft -> pending_review`

Verify in SQL:

```sql
select id, status, submitted_at
from public.account_onboarding
where id = '<ONBOARDING_ID>';
```

Pass criteria:
- `status = 'pending_review'`
- `submitted_at` is not null

## A5. Approve Dossier

UI:
- from `/onboarding`
- approve the dossier
- optionally provide:
  - display name
  - lat/lng
  - service ids
  - availability

Expected:
- onboarding transitions `pending_review -> approved`
- `approved_at` set
- `approved_by` set

Verify in SQL:

```sql
select id, status, approved_at, approved_by
from public.account_onboarding
where id = '<ONBOARDING_ID>';
```

Pass criteria:
- `status = 'approved'`
- `approved_at` not null

## A6. Verify Provider Presence Materialization

Expected:
- `provider_presence` row exists for the owner/provider id
- coordinates are valid
- `service_ids` not empty

Verify in SQL:

```sql
select provider_id, display_name, lat, lng, is_available, service_ids
from public.provider_presence
where provider_id = '<OWNER_USER_ID>';
```

Pass criteria:
- one row exists
- `lat` and `lng` are not null
- `service_ids` has at least one value

## A7. Verify Admin Visibility

UI:
- `/map`
- `/providers`
- `/dashboard`

Expected:
- provider appears on map/backend-driven pages
- no placeholder-only behavior for that new SP record

## A8. Verify Mobile Login

Mobile/provider app expected outcome:
- approved SP owner can sign in
- app lands in the correct tenant context

Suggested verification:
- login with the created SP credentials
- confirm session works
- confirm no onboarding-blocking gate remains

Pass criteria:
- login succeeds
- provider account is recognized as approved/active

## Scenario B: Fleet Workflow

## B1. Create Fleet Account In Accounts

UI:
- open `/accounts`
- create a new `Fleet` account

Expected:
- tenant exists
- owner exists
- onboarding exists
- onboarding status starts as `draft`

Verify in SQL:

```sql
select id, name, code, type
from public.tenants
where type = 'fleet_manager'
order by created_at desc
limit 5;
```

```sql
select id, tenant_id, user_id, account_type, status, company_name, contact_email
from public.account_onboarding
where account_type = 'fleet_manager'
order by created_at desc
limit 5;
```

## B2. Complete Fleet Resources

Expected target state:
- `fleet_drivers` rows exist
- `fleet_vehicles` rows exist

Verify in SQL:

```sql
select *
from public.fleet_drivers
where onboarding_id = '<ONBOARDING_ID>';
```

```sql
select *
from public.fleet_vehicles
where onboarding_id = '<ONBOARDING_ID>';
```

Pass criteria:
- at least one driver
- at least one vehicle

If missing:
- mark as alignment gap

## B3. Submit And Approve

UI:
- submit dossier
- approve dossier from `/onboarding`

Expected:
- `draft -> pending_review -> approved`

Verify in SQL:

```sql
select id, status, submitted_at, approved_at
from public.account_onboarding
where id = '<ONBOARDING_ID>';
```

## B4. Verify Admin Visibility

UI:
- `/accounts`
- `/fleet-managers`
- `/interventions` create form fleet option list

Expected:
- fleet tenant appears consistently
- no contradictory status across pages

## B5. Verify Mobile Login

Expected:
- approved Fleet owner can sign in

Pass criteria:
- login succeeds
- tenant context is correct

## Scenario C: Interventions Backend Truth

## C1. Create Intervention

UI:
- open `/interventions`
- create a new intervention with:
  - fleet manager
  - service provider
  - vehicle data
  - service type
  - location

Expected:
- one `service_requests` row created
- details survive refresh

Verify in SQL:

```sql
select id, user_id, assigned_provider_id, status, service_type, breakdown_details, pickup_lat, pickup_lng, created_at
from public.service_requests
order by created_at desc
limit 10;
```

Pass criteria:
- `breakdown_details` contains the created details
- page refresh preserves the visible row data

## C2. Status Progression

UI:
- advance status
- cancel another request

Expected:
- transitions persist after refresh

## Scenario D: Accounts And Members

## D1. Tenant Members

UI:
- open a tenant drawer in `/accounts`
- inspect members tab

Expected:
- real tenant members shown from backend
- no fake list

## D2. Add Member

If UI supports it:
- add a member

Expected:
- member appears in backend and remains after refresh

Verify in SQL:

```sql
select p.id, p.full_name, p.tenant_id, p.role, u.email
from public.profiles p
left join auth.users u on u.id = p.id
where p.tenant_id = '<TENANT_ID>'
order by p.full_name asc;
```

## Failure Classification

If a step fails, classify it immediately:

- Auth failure
  - session/JWT/admin access problem
- Workflow failure
  - wrong route owns the business action
- Persistence failure
  - UI changes but backend row not updated
- Modeling gap
  - UI expects data the backend does not currently model
- Alignment gap
  - legacy/mobile supported the step, AdminHub does not

## Exit Criteria

Mark the run successful only if:

- SP create -> submit -> approve -> provider_presence -> mobile login passes
- Fleet create -> submit -> approve -> mobile login passes
- Interventions persist after refresh
- Accounts reflects backend truth only
- No critical page depends on placeholder data to complete the tested flow
