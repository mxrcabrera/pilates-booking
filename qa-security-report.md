# Security QA Report — Pilates Booking

**Date:** 2026-02-25
**Reviewed by:** Security Audit (Claude Opus 4.6)
**Stack:** Next.js 15, React 19, Prisma 6, PostgreSQL (Supabase), NextAuth v5, Netlify
**Scope:** Application security audit — authentication, authorization, input validation, data protection

---

## Executive Summary

Comprehensive security audit of the Pilates Booking application identified **23 findings** across 4 severity levels. All findings have been resolved across 23 individual commits with zero failures or reverts. Key areas addressed: IDOR vulnerabilities in server actions, hard-delete data loss, role escalation, JWT/session security, rate limiting, input validation, and CSP headers.

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 2 | 2/2 Fixed |
| High | 6 | 6/6 Fixed |
| Medium | 8 | 8/8 Fixed |
| Low | 7 | 7/7 Fixed |

---

## Critical Findings

### C1: IDOR in Server Actions (Insecure Direct Object Reference)
- **Files:** `app/(dashboard)/alumnos/actions.ts`, `app/(dashboard)/configuracion/actions.ts`
- **Description:** Server actions (update, delete, toggle) accepted entity IDs without verifying the authenticated user owns the resource. Any authenticated profesor could modify another profesor's alumnos, horarios, and packs by guessing/enumerating UUIDs.
- **Impact:** Full cross-tenant data manipulation.
- **Fix:** Added `findFirst({ where: { id, profesorId: userId, deletedAt: null } })` ownership check before every mutation in both files.
- **Commit:** `d36a2f5`
- **Status:** ✅ Fixed

### C2: Hard Delete Causes Permanent Data Loss
- **Files:** `app/(dashboard)/alumnos/actions.ts`, `app/(dashboard)/configuracion/actions.ts`
- **Description:** `deleteAlumno`, `deleteHorario`, and `deletePack` used `prisma.delete()` causing irreversible data loss. Deleting an alumno also left orphaned pagos and clases.
- **Impact:** No recovery from accidental deletes. Orphaned financial records.
- **Fix:** Changed to soft delete (`deletedAt: new Date()`). Alumno delete now uses a transaction to cascade: soft-delete alumno + soft-delete pending pagos + cancel future clases.
- **Commit:** `9b02ef0`
- **Status:** ✅ Fixed

---

## High Findings

### H1: OAuth Tokens Exposed in Client Session
- **Files:** `lib/auth/auth.ts`, `types/next-auth.d.ts`
- **Description:** Google OAuth `accessToken` and `refreshToken` were exposed in the NextAuth session object, accessible to client-side JavaScript.
- **Impact:** Token theft via XSS could grant attackers access to user's Google Calendar and profile.
- **Fix:** Removed token fields from session callback and Session type definition. Tokens remain in JWT for server-side use only.
- **Commit:** `0d34f6b`
- **Status:** ✅ Fixed

### H2: JWT_SECRET Has Insecure Fallback
- **File:** `middleware.ts`
- **Description:** `JWT_SECRET` had a hardcoded fallback `'dev-secret-only-for-local'`. If the env var was missing in production, the middleware would silently use this weak secret.
- **Impact:** All JWTs could be forged with the known fallback secret.
- **Fix:** Removed fallback. `JWT_SECRET` is now required in all environments — missing value throws at startup.
- **Commit:** `13412ad`
- **Status:** ✅ Fixed

### H3: No Rate Limiting on Login/Signup Server Actions
- **File:** `app/(auth)/login/actions.ts`
- **Description:** The `login()` and `signup()` server actions had no rate limiting, unlike the API route counterpart which had IP-based limits.
- **Impact:** Unlimited brute-force attempts on passwords via server actions.
- **Fix:** Added rate limiting using `headers()` for IP detection. Then in M7, these duplicate server actions were removed entirely (the form uses the API route).
- **Commit:** `810996c`
- **Status:** ✅ Fixed

### H4: NextAuth Session Not Cryptographically Validated in Middleware
- **File:** `middleware.ts`
- **Description:** Middleware checked NextAuth session existence by cookie presence only (`!!nextAuthSession`) without decrypting or validating the JWT. An attacker could craft a fake cookie.
- **Impact:** Session bypass — any crafted cookie would grant authenticated access.
- **Fix:** Added cryptographic validation using `decode` from `next-auth/jwt` with proper `secret` (AUTH_SECRET) and `salt` (cookie name). Role is now extracted from the verified payload.
- **Commit:** `8bd3cf2`
- **Status:** ✅ Fixed

### H5: Role Escalation via Onboarding Endpoint
- **File:** `app/onboarding/actions.ts`
- **Description:** `updateUserRole()` allowed changing role at any time after account creation. An ALUMNO could call this action to escalate to PROFESOR.
- **Impact:** Full privilege escalation — students gain teacher access to all data.
- **Fix:** Added time-window restriction: role can only be set within 1 hour of `user.createdAt`. After that, the action throws.
- **Commit:** `8a60581`
- **Status:** ✅ Fixed

### H6: Weak Password Policy (6 Characters Minimum)
- **Files:** `lib/schemas/auth.schema.ts`, `lib/schemas/alumno.schema.ts`, `lib/schemas/configuracion.schema.ts`, `app/(auth)/login/login-form.tsx`, `app/api/auth/login/route.ts`
- **Description:** Minimum password length was 6 characters across all schemas and UI validation.
- **Impact:** Weak passwords vulnerable to dictionary attacks.
- **Fix:** Increased minimum to 8 characters in all Zod schemas, UI validation, and API route validation.
- **Commit:** `e1c5517`
- **Status:** ✅ Fixed

---

## Medium Findings

### M1: Rate Limit Memory Unbounded
- **File:** `lib/rate-limit.ts`
- **Description:** In-memory `Map` for rate limiting had no size cap. Under sustained attack, memory could grow indefinitely.
- **Impact:** Potential memory exhaustion DoS.
- **Fix:** Added `MAX_ENTRIES = 10_000` guard with `pruneExpired()` cleanup function. Added documentation about serverless limitations.
- **Commit:** `6b17476`
- **Status:** ✅ Fixed

### M2: No Content-Security-Policy Header
- **File:** `next.config.ts`
- **Description:** No CSP header configured. No protection against XSS via injected scripts, clickjacking via framing, or form action hijacking.
- **Impact:** Increased XSS and clickjacking attack surface.
- **Fix:** Added CSP header with: `frame-ancestors 'self'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`, and appropriate `connect-src` for Google OAuth.
- **Commit:** `163d6d7`
- **Status:** ✅ Fixed

### M3: Client-Controlled profesorId in Pago Creation
- **Files:** `app/api/v1/pagos/route.ts`, `lib/schemas/pago.schema.ts`
- **Description:** `profesorId` was accepted from the request body in pago creation. A malicious client could assign payments to a different profesor.
- **Impact:** Cross-tenant payment manipulation.
- **Fix:** Removed `profesorId` from Zod schema and route handler. Pagos always use the authenticated `userId`.
- **Commit:** `f0d1c48`
- **Status:** ✅ Fixed

### M4: No Zod Validation on updatePreferencias
- **File:** `app/(dashboard)/configuracion/actions.ts`
- **Description:** `updatePreferencias` server action parsed FormData manually without Zod validation, accepting arbitrary field values.
- **Impact:** Invalid or malicious data could be persisted to user preferences.
- **Fix:** Added Zod schema (`updatePreferenciasSchema`) validation with `safeParse()` before database update.
- **Commit:** `2f2b738`
- **Status:** ✅ Fixed

### M5: Unsafe JSON.parse in Zod Schema Transform
- **File:** `lib/schemas/clase.schema.ts`
- **Description:** `diasSemana` field used `JSON.parse()` in a Zod `.transform()` without try/catch. Malformed input would throw an unhandled error.
- **Impact:** Server crash on malformed input (DoS vector).
- **Fix:** Wrapped in try/catch using `ctx.addIssue()` for graceful Zod error handling with `z.NEVER` return.
- **Commit:** `0fbe789`
- **Status:** ✅ Fixed

### M6: Health Endpoint Leaks Database Status
- **File:** `app/api/health/route.ts`
- **Description:** Health endpoint exposed `db: 'connected'` / `db: 'disconnected'` in its response.
- **Impact:** Information disclosure — attackers can probe database availability.
- **Fix:** Removed database status from the public response. Health check still verifies DB internally.
- **Commit:** `595542d`
- **Status:** ✅ Fixed

### M7: Duplicate Login/Signup Server Actions (Dead Code)
- **File:** `app/(auth)/login/actions.ts`
- **Description:** `login()` and `signup()` server actions duplicated the API route logic but were never called by the form (which uses the API route directly).
- **Impact:** Dead code with divergent validation logic — potential confusion and maintenance burden.
- **Fix:** Removed `login()` and `signup()` functions. File now only contains `logout()` and `loginWithGoogle()`.
- **Commit:** `5b7fdb7`
- **Status:** ✅ Fixed

### M8: Unpinned next-auth Beta Version
- **Files:** `package.json`, `lib/auth/auth.config.ts`
- **Description:** `next-auth` was specified as `^5.0.0-beta.30`, allowing automatic upgrades to newer beta versions that may introduce breaking changes.
- **Impact:** Unpredictable auth behavior after `npm install` on a new machine.
- **Fix:** Pinned to exact version `5.0.0-beta.30` (removed `^`). Added comment documenting the risk.
- **Commit:** `cc4797f`
- **Status:** ✅ Fixed

---

## Low Findings

### L1: Weak bcrypt Cost Factor
- **File:** `lib/auth/auth-utils.ts`
- **Description:** bcrypt cost factor was 10 (default). Modern hardware can brute-force at this level more quickly.
- **Impact:** Faster offline password cracking if database is compromised.
- **Fix:** Increased cost factor from 10 to 12 (~4x slower hashing, still under 500ms).
- **Commit:** `1415849`
- **Status:** ✅ Fixed

### L2: JWT and Cookie Expiration Too Long (7 Days)
- **Files:** `lib/auth/auth-utils.ts`, `app/api/auth/login/route.ts`
- **Description:** JWT tokens and auth cookies were valid for 7 days. A stolen token would grant access for a full week.
- **Impact:** Extended window for stolen credential abuse.
- **Fix:** Reduced to 24 hours for both JWT expiration and cookie maxAge.
- **Commit:** `d3d27a0`
- **Status:** ✅ Fixed

### L3: Email Not Normalized on Alumno Creation/Update
- **File:** `lib/schemas/alumno.schema.ts`
- **Description:** Alumno email field did not normalize case or whitespace. `User@Email.com` and `user@email.com` would be treated as different emails.
- **Impact:** Duplicate accounts, failed lookups, inconsistent data.
- **Fix:** Added `.transform(v => v.toLowerCase().trim())` to email field in both create and update schemas.
- **Commit:** `1c57893`
- **Status:** ✅ Fixed

### L4: npm Audit Vulnerabilities in Dev Dependencies
- **File:** `package-lock.json`
- **Description:** `npm audit` reported vulnerabilities in development dependencies.
- **Impact:** Potential supply chain risk during development.
- **Fix:** Ran `npm audit fix` to resolve vulnerabilities.
- **Commit:** `a3d5331`
- **Status:** ✅ Fixed

### L5: Missing deletedAt Filter in Horario Upsert
- **File:** `app/(dashboard)/configuracion/actions.ts`
- **Description:** The `saveHorario` create path (upsert check) did not filter `deletedAt: null`, potentially finding and updating soft-deleted horarios.
- **Impact:** Soft-deleted horarios could be resurrected instead of creating new ones.
- **Fix:** Added `deletedAt: null` to the `findFirst` query in the upsert check.
- **Commit:** `63ac3be`
- **Status:** ✅ Fixed

### L6: CSV Formula Injection in Export
- **File:** `lib/export.ts`
- **Description:** CSV export did not sanitize values starting with `=`, `+`, `-`, `@`, `\t`, `\r`. These characters trigger formula execution when opened in Excel/Google Sheets.
- **Impact:** Malicious data in alumno names/emails could execute formulas when exported.
- **Fix:** Added prefix `'` (single quote) to values starting with formula-triggering characters.
- **Commit:** `5455436`
- **Status:** ✅ Fixed

### L7: Open Redirect via callbackUrl Parameter
- **File:** `middleware.ts`
- **Description:** The `callbackUrl` query parameter on the login redirect was not validated. An attacker could craft a URL like `/login?callbackUrl=https://evil.com` to redirect users after login.
- **Impact:** Phishing attacks via trusted domain redirect.
- **Fix:** Added whitelist of allowed path prefixes. Only internal paths (`/dashboard`, `/calendario`, `/alumnos`, etc.) are accepted as callbackUrl.
- **Commit:** `6e6e08d`
- **Status:** ✅ Fixed

---

## Commit Log

| # | Commit | Finding | Description |
|---|--------|---------|-------------|
| 1 | `d36a2f5` | C1 | Add ownership verification to server actions (IDOR) |
| 2 | `9b02ef0` | C2 | Change hard deletes to soft deletes in server actions |
| 3 | `8a60581` | H5 | Restrict role change to onboarding window |
| 4 | `0d34f6b` | H1 | Remove Google OAuth tokens from client session |
| 5 | `13412ad` | H2 | Require JWT_SECRET in all environments |
| 6 | `810996c` | H3 | Add rate limiting to login/signup server actions |
| 7 | `8bd3cf2` | H4 | Validate NextAuth sessions in middleware with role extraction |
| 8 | `e1c5517` | H6 | Increase minimum password length from 6 to 8 characters |
| 9 | `6b17476` | M1 | Add memory cap and improve rate limit documentation |
| 10 | `163d6d7` | M2 | Add Content-Security-Policy header |
| 11 | `f0d1c48` | M3 | Always use authenticated userId for pago creation |
| 12 | `2f2b738` | M4 | Validate updatePreferencias with Zod schema |
| 13 | `0fbe789` | M5 | Add safe JSON.parse in diasSemana schema transforms |
| 14 | `595542d` | M6 | Remove database status from health endpoint response |
| 15 | `5b7fdb7` | M7 | Remove duplicate login/signup server actions |
| 16 | `cc4797f` | M8 | Pin next-auth beta version and document risk |
| 17 | `1415849` | L1 | Increase bcrypt cost factor from 10 to 12 |
| 18 | `d3d27a0` | L2 | Reduce JWT and cookie expiration from 7 days to 24 hours |
| 19 | `1c57893` | L3 | Normalize alumno email with toLowerCase and trim |
| 20 | `a3d5331` | L4 | Resolve npm audit vulnerabilities in dev dependencies |
| 21 | `63ac3be` | L5 | Add deletedAt null filter to horario upsert query |
| 22 | `5455436` | L6 | Prevent CSV formula injection in export |
| 23 | `6e6e08d` | L7 | Whitelist callbackUrl paths in middleware redirect |

---

## Remaining Recommendations

1. **Migrate rate limiting to Redis** — In-memory rate limiting is ineffective on serverless (Netlify Functions). Use `@upstash/ratelimit` for persistent, distributed rate limiting.
2. **Add email verification** — `allowDangerousEmailAccountLinking` is enabled in NextAuth. Pre-registration attacks are possible without email verification.
3. **Implement CSRF tokens** — Logout endpoint accepts GET requests (CSRF via `<img>` tags). Consider POST-only with CSRF protection.
4. **Add security headers** — Consider `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
5. **Audit third-party dependencies** — Regularly run `npm audit` and consider using `socket.dev` or `snyk` for continuous monitoring.

---

## Phase 16B Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ Pass (only pre-existing playwright.config.ts error) |
| `npm run lint` | ✅ Pass |
| `npm run build` | ✅ Pass |
