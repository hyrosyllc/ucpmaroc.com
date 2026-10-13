# Authentication Feature

## Responsibility

The auth feature handles account entry and initial actor/client profile creation. Supabase Auth owns credentials, sessions, OTP verification, and OAuth. Application identity and role data live in `actors` and `clients`; the feature does not own storefront customer login, which lives in ecommerce.

## Entry Points

| Route | Page | Purpose |
| --- | --- | --- |
| `/actor-login` | `src/features/auth/pages/ActorLoginPage.tsx` | Password and OAuth sign-in for actors/admins; redirects based on profile/role |
| `/actor-signup` | `src/features/auth/pages/ActorSignUpPage.tsx` | Actor/creative registration and email OTP verification |
| `/client-auth` | `src/features/auth/pages/ClientAuthPage.tsx` | Client sign-up/sign-in and OTP verification |
| `/create-profile` | `src/features/auth/pages/CreateProfilePromptPage.tsx` | Create a missing actor or client profile after authentication |

The route registry is `src/App.tsx`. The feature barrel `src/features/auth/index.ts` exports the four page components, but `App.tsx` currently imports the pages directly.

## Flows

### Actor registration

1. `ActorSignUpPage` calls `supabase.auth.signUp` with `full_name`, `signup_type`, role, and country metadata.
2. It upserts an `actors` row keyed by `user_id`, initializing marketplace capability and defaults. `type=creative` creates a profile with marketplace access disabled.
3. The UI asks for the signup OTP; `verifyOtp` completes the session and routes to `/dashboard` or `/dashboard/portfolio`.

### Client registration

1. `ClientAuthPage` creates a Supabase Auth user, then upserts `clients` by `user_id`.
2. It verifies the signup OTP and routes to `/client-dashboard`.
3. Client authentication for portfolio-store customers is separate: `src/features/ecommerce/pages/CustomerLoginPage.tsx` associates the user with a portfolio through `pro_customers`.

### Sign-in and role routing

`ActorLoginPage` and `ClientAuthPage` query `actors` first, then `clients`, to direct admins to `/admin`, marketplace actors to `/dashboard`, builder-only actors to `/dashboard/portfolio`, and clients to `/client-dashboard`. The layouts repeat their own session/profile checks; page redirects are navigation, not the only authorization boundary.

`src/components/ProtectedRoute.tsx` is the shared role gate used around the admin route tree. It checks the Supabase session, then actor role, then client presence. Database RLS and server-side function authorization remain separate security boundaries.

## Data and Integrations

- Supabase Auth: `signUp`, `signInWithPassword`, `signInWithOAuth`, `getUser`/`getSession`, `verifyOtp`, and `signOut`.
- Profile tables: `actors` and `clients`, linked to auth identities by `user_id`.
- OAuth providers are selected in the UI; callback destinations are passed as `redirectTo` values in the page components.
- `ActorSignUpPage` can use `src/lib/countries.ts`; client authentication uses `react-i18next` translations.
- No auth Edge Function is invoked by these page flows in the inspected implementation.

## Connections

- Actor workspace bootstrap and actor-specific data are owned by `src/layouts/ActorDashboardLayout.tsx`.
- Admin authorization is shared with `ProtectedRoute` and `AdminDashboardLayout`.
- Talent marketplace orders require a client identity before quote/order submission; `QuoteCalculatorModal` returns unauthenticated users to `/client-auth`.
- Store customer identity is portfolio-scoped in ecommerce and must not be confused with the global `clients` profile.

## Maintenance Notes

- Keep profile creation idempotent on `user_id`; signup and a database trigger may both attempt profile creation.
- Preserve the role/profile routing rules when changing signup metadata or OAuth callback paths.
- The actor login UI links to `/forgot-password`, but `src/App.tsx` has no matching route in the inspected route table; verify before advertising password recovery.
- Review RLS on `actors` and `clients` whenever profile writes are changed; the browser uses the public Supabase client.

## Complete Module File Map

- `src/features/auth/index.ts`
- `src/features/auth/pages/ActorLoginPage.tsx`
- `src/features/auth/pages/ActorSignUpPage.tsx`
- `src/features/auth/pages/ClientAuthPage.tsx`
- `src/features/auth/pages/CreateProfilePromptPage.tsx`