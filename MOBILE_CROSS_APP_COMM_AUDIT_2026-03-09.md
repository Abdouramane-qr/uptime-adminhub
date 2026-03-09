# Mobile Cross-App Communication Audit (2026-03-09)

## Scope
- Admin panel: `uptime-adminhub`
- Mobile provider app: `uptime_sp`
- Mobile requester app: `uptime-repo`
- Backend target: `https://wlxgpvqfzrxzqaahwkmr.supabase.co`

## Executive status
- Mobile-to-Supabase communication path is configured to the same backend project in both mobile apps.
- Both mobile keys currently authenticate against Supabase Auth settings (`/auth/v1/settings` returned HTTP 200 for both keys).
- Current production blocker remains on admin Edge Function authorization (`401` on `admin-portal/*`), not on mobile table connectivity.

## Verified configuration
- `uptime_sp/config/dart_define.local.json`
  - `SUPABASE_URL`: `https://wlxgpvqfzrxzqaahwkmr.supabase.co`
  - `SUPABASE_ANON_KEY`: JWT anon key format (`eyJ...`)
- `uptime-repo/config/dart_define.local.json`
  - `SUPABASE_URL`: `https://wlxgpvqfzrxzqaahwkmr.supabase.co`
  - `SUPABASE_ANON_KEY`: publishable format (`sb_publishable_...`)

## Communication contracts found in mobile apps

### uptime_sp (provider app)
Primary tables used directly via Supabase client:
- `profiles`
- `provider_presence`
- `service_requests`
- `vehicles`
- `notifications`

### uptime-repo (requester app)
Primary tables used directly via Supabase client:
- `profiles`
- `service_requests`
- `provider_presence`
- `vehicles`
- `payments`
- `payment_methods`
- `provider_locations`
- `messages`
- `saved_locations`
- `notifications`
- `pricing_quotes`

## Admin panel coupling (impact on mobile)
- `uptime-adminhub` uses Edge Functions for admin datasets (`admin-portal`, `admin-accounts`, `onboarding-crud`).
- It also uses direct Supabase tables for auth/profile/roles checks (`profiles`, `user_roles`, `rpc is_admin/has_role`).
- Because mobiles are table-first and admin is function-first for many screens, admin `401` can coexist with mobile apps still working.

## Key finding on current incidents
From observed browser logs:
- `401` on `functions/v1/admin-portal/*` endpoints.
- Fallback telemetry triggers mock fallback in admin pages.

Interpretation:
- This is consistent with missing/invalid auth propagation and/or role check failure in Edge Function path.
- It is not evidence of broken mobile table communication.

## Risk list
1. Admin role model drift:
- `profiles.role` constraint currently allows only: `platform_admin`, `owner`, `member`.
- Any flow expecting `admin`/`user` string in `profiles.role` will fail.

2. Edge Function auth context:
- If admin function validates role from `user_roles` while profile only is patched (or inverse), authorization may still fail.

3. Contract divergence:
- Mobile apps depend on direct table schema stability.
- Admin functions may apply transformed DTO contracts; breaking either side independently can desync dashboards vs mobile reality.

## Evidence from local test suite
- Ran `npm run -s test:backend-client` in `uptime-adminhub`.
- Result: `10/10` tests pass for endpoint construction/auth headers/wrapper routing.
- Meaning: frontend client wiring is coherent; runtime `401` likely backend role/secret/policy side.

## Immediate action checklist
1. In Supabase SQL editor, validate admin identity against both stores:
- `public.profiles` role and row exists for auth uid.
- `public.user_roles` contains expected admin app role for same uid.

2. In `admin-portal` function secrets, confirm:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- any allowlist env (`ADMIN_EMAILS` or equivalent)

3. In function code, ensure bearer token is forwarded and verified consistently before role checks.

4. Keep `VITE_ALLOW_MOCK_FALLBACK=false` in admin during recette to surface real backend failures.

## Conclusion
- Cross-app mobile communication to Supabase appears intact at config/auth-entry level.
- The migration blocker is concentrated in admin authorization path (`admin-portal` Edge Function), not in the mobile data channels.
