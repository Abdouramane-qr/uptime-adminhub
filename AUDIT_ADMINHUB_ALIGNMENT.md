# AdminHub Alignment Audit

Date: 2026-03-10

Scope:
- `uptime-adminhub`
- `admin_uptime`
- `uptime-repo` Supabase Edge Functions and mobile app flows

## Executive Summary

`uptime-adminhub` is not yet a strict superset of the legacy `admin_uptime` business workflow.

It is now operational again for:
- Supabase auth
- admin access control
- Edge Function calls
- tenant update persistence

But it still diverges from the legacy and mobile-aligned workflow in several important areas:
- onboarding approval logic
- company-to-technician modeling
- technician/resource visibility in admin pages
- location semantics
- partial mock/static UI behavior in some pages

The main architectural conclusion is:
- `Accounts` should manage tenants and members
- `Onboarding` should remain the only approval/rejection workflow
- activation side effects must remain tied to onboarding approval

## What Was Verified

## Restored Platform Behavior

- `admin-portal` Edge Function auth was repaired.
- CORS issues on Edge Functions were repaired.
- admin access for the current user was restored.
- `PATCH /functions/v1/admin-portal/tenants/:id` was fixed so onboarding-only status updates no longer fail with false `404`.
- `Accounts` stale local state was fixed so tenant updates are reflected in the open drawer.
- `mapTenant is not defined` in `Accounts` was fixed.

## Local Validation Status

In `uptime-adminhub`:
- `npm run qa:strict-backend` passed
- `npm test` passed
- `npm run build:strict-backend` passed
- `npm run lint` passes with warnings only

Warnings remaining are mostly `react-hooks/exhaustive-deps` and do not currently block build/test.

## Legacy Baseline

The legacy app documents and implements this separation:

### Accounts domain

- tenant CRUD via `admin-portal`
- tenant members via `admin-portal`
- no direct business approval inside Accounts

References:
- [admin_uptime/js/api.js](/home/suprox/projects/new/garage/admin_uptime/js/api.js#L351)

### Onboarding domain

- queue review
- dossier detail
- approve/reject/submit via `onboarding-crud`
- SP approval auto-materializes `provider_presence`

References:
- [admin_uptime/js/onboarding.page.js](/home/suprox/projects/new/garage/admin_uptime/js/onboarding.page.js#L141)
- [uptime-repo/supabase/functions/onboarding-crud/index.ts](/home/suprox/projects/new/garage/uptime-repo/supabase/functions/onboarding-crud/index.ts#L251)

### Business signoff expectation

Legacy signoff expects:
1. account creation
2. onboarding dossier completion
3. `pending_review`
4. admin approval
5. provider presence materialization for SP
6. mobile login success

References:
- [admin_uptime/E2E_BUSINESS_SIGNOFF.md](/home/suprox/projects/new/garage/admin_uptime/E2E_BUSINESS_SIGNOFF.md#L63)

## Current Alignment Findings

## Finding 1: Accounts Approval Diverged From Legacy

Severity: High

`uptime-adminhub` had introduced approve/reject actions directly in `Accounts`, backed by:
- `PATCH /functions/v1/admin-portal/tenants/:id`

This is not aligned with the legacy workflow, where approval belongs to onboarding review.

Impact:
- business approval could happen outside the dossier review workflow
- approval side effects expected by the legacy flow could be skipped
- UI semantics became misleading

Current remediation:
- `Accounts` approve/reject now redirects the operator to `/onboarding` instead of pretending to perform the full business approval.

References:
- [uptime-adminhub/src/pages/Accounts.tsx](/home/suprox/projects/new/garage/uptime-adminhub/src/pages/Accounts.tsx)

## Finding 2: Tenant Update Route Is Not Full Approval Logic

Severity: High

The tenant update route in `admin-portal` updates:
- `tenants`
- owner contact data
- `account_onboarding.status`

But it does not own the legacy approval side effects such as SP activation workflow.

References:
- [uptime-repo/supabase/functions/admin-portal/index.ts](/home/suprox/projects/new/garage/uptime-repo/supabase/functions/admin-portal/index.ts#L1393)
- [uptime-repo/supabase/functions/onboarding-crud/index.ts](/home/suprox/projects/new/garage/uptime-repo/supabase/functions/onboarding-crud/index.ts#L251)

Conclusion:
- `PATCH /tenants/:id` is an admin maintenance route
- `POST /onboarding/:id/approve|reject` is the business workflow route

## Finding 3: Accounts Technicians Tab Is Static

Severity: High

The technicians/services/documents tabs in `Accounts` are placeholder/static content.

This means the UI currently implies live business relations that do not exist in the rendered data.

Reference:
- [uptime-adminhub/src/pages/Accounts.tsx](/home/suprox/projects/new/garage/uptime-adminhub/src/pages/Accounts.tsx#L431)

Risk:
- operators may think a company already has linked technicians/resources when the page is only showing placeholders

## Finding 4: Company -> Technician Modeling Is Incomplete In AdminHub

Severity: High

Current reality:
- creating a managed account creates `tenant + owner + onboarding draft`
- it does not create technicians
- technicians are a separate onboarding/resource concept

References:
- [uptime-repo/supabase/functions/admin-portal/index.ts](/home/suprox/projects/new/garage/uptime-repo/supabase/functions/admin-portal/index.ts#L1298)
- [uptime-repo/supabase/migrations/202602280005_web_workflow_onboarding.sql](/home/suprox/projects/new/garage/uptime-repo/supabase/migrations/202602280005_web_workflow_onboarding.sql)

Implication:
- the correct relationship is not "company automatically contains technicians at create time"
- the correct current workflow is "company/tenant exists, then onboarding resources or members are added"

## Finding 5: Position Semantics Are Not Per-Technician

Severity: High

Current system behavior:
- platform map/admin presence uses `provider_presence`
- live mission tracking uses `provider_locations`
- admin technician view derives location from provider presence, not from a dedicated technician GPS source

References:
- [uptime-repo/supabase/functions/admin-portal/index.ts](/home/suprox/projects/new/garage/uptime-repo/supabase/functions/admin-portal/index.ts#L892)
- [uptime-repo/lib/features/request/data/tracking_repository_supabase.dart](/home/suprox/projects/new/garage/uptime-repo/lib/features/request/data/tracking_repository_supabase.dart#L35)

Conclusion:
- the system currently knows where a provider/garage is
- the system can track a provider during a mission
- the system does not currently maintain a real-time persistent location per technician

## Finding 6: Some AdminHub Pages Still Mix Backend And Placeholder Logic

Severity: Medium

Examples observed:
- `Accounts` detail tabs use placeholders
- intervention/technician workflows still include static lists and display assumptions

Impact:
- backend truth and UI truth can drift
- this makes regression diagnosis harder

## Finding 7: Legacy Intent Was Improvement, Not Behavioral Rewrite

Severity: Medium

Legacy repository documentation clearly positions `uptime-adminhub` as the replacement, but the replacement should preserve the validated workflow contract where relevant.

References:
- [admin_uptime/README.md](/home/suprox/projects/new/garage/admin_uptime/README.md)
- [admin_uptime/DEPRECATED.md](/home/suprox/projects/new/garage/admin_uptime/DEPRECATED.md)

Therefore:
- modernizing UI is acceptable
- changing core business transition ownership without replacing side effects is not

## Current Risk Register

## Operational Risks

- Operators may approve/reject from the wrong screen if the workflow is not constrained.
- Placeholder tabs can cause false confidence in tenant-resource linkage.
- Provider and technician location semantics may be misinterpreted by ops teams.

## Product Risks

- Stakeholders may assume parity with mobile flows when the admin UI still contains partial mock behavior.
- Cross-app incidents become harder to diagnose when admin pages do not mirror the legacy workflow boundaries.

## Technical Risks

- approval side effects may drift between `admin-portal` and `onboarding-crud`
- frontend status UX may not represent backend lifecycle ownership
- future changes may duplicate logic instead of consolidating it

## Recommended Target Model

## Workflow Ownership

- `Accounts`
  - create tenant/owner
  - edit tenant metadata
  - manage tenant members
- `Onboarding`
  - review dossier
  - create/read resource bundles
  - approve/reject
  - activation side effects

## Data Model Direction

- `tenants`
  - company / garage / fleet entity
- `profiles`
  - owner/admin/member identity
- `sp_technicians`
  - service provider technicians linked to onboarding or later canonical tenant entities
- `fleet_drivers`
  - fleet drivers linked to onboarding or later canonical tenant entities
- `provider_presence`
  - provider or garage level active presence
- `provider_locations`
  - mission-specific movement history

If product requires per-technician live location, add:
- `technician_presence`

This should not be faked through `provider_presence`.

## Remediation Plan

## Phase 1: Workflow Safety

Priority: Immediate

- Keep approval/rejection only in `/onboarding`
- Remove or redirect misleading approval actions from `Accounts`
- Ensure tenant editing in `Accounts` is clearly metadata maintenance only

Status:
- redirect mitigation already applied in `Accounts`

## Phase 2: Remove Placeholder Business Detail

Priority: High

- Replace static tabs in `Accounts` with real data or explicit empty states
- Mark unavailable sections honestly instead of showing fake content

## Phase 3: Canonical Resource Linking

Priority: High

- Define canonical read APIs for:
  - tenant technicians
  - tenant drivers
  - tenant services/pricing
  - tenant documents
- Ensure each admin page reads from one backend source of truth

## Phase 4: Location Semantics Clarification

Priority: High

- Decide whether ops needs:
  - provider/garage location only
  - or individual technician live location
- If technician location is required, add dedicated schema and write path

## Phase 5: Cross-App E2E Alignment

Priority: High

Re-run equivalent end-to-end paths for:
- Service Provider onboarding
- Fleet onboarding
- approval
- provider presence creation
- mobile login after approval
- dispatch visibility

## Immediate Action Items

1. Keep using `/onboarding` for business approval and rejection.
2. Replace placeholder detail tabs in `Accounts`.
3. Audit `Providers`, `FleetManagers`, and `Interventions` for remaining static assumptions.
4. Decide product truth for technician location.
5. Add an explicit alignment regression checklist comparing:
   - legacy `admin_uptime`
   - `uptime-adminhub`
   - mobile provider/fleet flows

## Audit Verdict

Verdict: Partially aligned, not yet functionally equivalent.

`uptime-adminhub` is now technically stable enough to continue, but it should still be treated as a transition-stage replacement, not a full business-equivalent successor, until:
- onboarding ownership is kept exclusive
- placeholder business data is removed
- company/member/resource/location semantics are made explicit

## Suggested Next Deliverables

- `ALIGNMENT_REGRESSION_CHECKLIST.md`
- canonical tenant detail endpoints for admin
- removal of static `Accounts` tabs
- explicit architecture note for location semantics
