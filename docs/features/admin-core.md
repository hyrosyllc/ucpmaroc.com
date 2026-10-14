# Admin Core Feature

## Responsibility

Admin Core is the platform-operations surface. It manages platform actors/clients, marketplace listings, platform orders, payouts, and theme submissions. It is not the actor's store dashboard; that lives under `/dashboard/*` and `src/features/ecommerce/`.

## Entry Points and Access

All admin pages are nested under `/admin` in `src/App.tsx` and wrapped by `ProtectedRoute allowedRoles={['admin']}`. `AdminDashboardLayout` supplies the admin navigation and independently requires a signed-in user. Individual pages still query data and should be reviewed with Supabase RLS/function authorization; route wrapping alone is not a backend security control.

| Route | Page | Data/operation |
| --- | --- | --- |
| `/admin` | `AdminDashboardPage` | Platform dashboard and order summaries |
| `/admin/order/:orderId` | `AdminOrderDetailPage` | Platform talent order details |
| `/admin/actors`, `/admin/clients` | `AdminActorListPage`, `AdminClientListPage` | Profile status, payment requests, account deletion |
| `/admin/payouts` | `AdminPayoutsPage` | Pending/completed actor payout summaries |
| `/admin/themes` | `AdminThemesPage` | Review and compile marketplace themes |
| `/admin/marketplace-settings` | `AdminMarketplaceSettingsPage` | Service listing approval and marketplace settings |

## Important Flows

- **Account operations:** actor/client lists read `actors` and `clients`; permanent deletion invokes `admin-delete-account`. Actor active-state changes invoke `toggle-actor-status` and update optimistically, rolling back on failure.
- **Marketplace moderation:** `AdminMarketplaceSettingsPage` reviews `actor_services` and updates status/enabled/media fields. The allowed service catalog is shared with `src/features/talent-marketplace/serviceCatalog.ts` through `marketplace_settings`.
- **Payouts:** pending totals derive from completed `orders` with `payout_status='unpaid'` and active `actor_payout_methods`. The `mark_actor_payouts_as_paid` RPC marks an actor's payout group as paid; the UI then reloads history.
- **Theme review:** pending rows come from `marketplace_themes`. Approval invokes `compile-theme`; rejection writes `status='rejected'` directly.

## Connections

- `src/layouts/AdminDashboardLayout.tsx` owns admin navigation; `src/components/ProtectedRoute.tsx` checks role eligibility.
- Actor payouts connect to talent marketplace payout settings (`actor_payout_methods`) and marketplace orders (`orders`).
- Theme approval connects to Theme Studio submissions and the builder preview through `marketplace_themes.compiled_bundle`; public `PortfolioLayout` does not currently load that bundle.
- Admin AI chat is a global component mounted by `App.tsx`, not an Admin Core route page; its implementation belongs to `src/features/messaging/components/AdminChatSheet.tsx`.

## Maintenance Notes

- The admin UI performs a mix of direct Supabase table writes and Edge Function/RPC calls. Keep financial, deletion, role, and compilation operations server-authoritative and check the matching SQL/function policy before changing the browser call.
- `AdminPayoutsPage` is an operational mark-paid workflow, not a payment-provider integration; document reconciliation/process ownership separately.
- The visible source tree does not prove that an Edge Function or migration has been deployed. See `docs/BILLING_OPERATIONS.md` for billing and payout-adjacent deployment boundaries.

## Complete Module File Map

- `src/features/admin-core/index.ts`
- `src/features/admin-core/pages/AdminActorListPage.tsx`
- `src/features/admin-core/pages/AdminClientListPage.tsx`
- `src/features/admin-core/pages/AdminDashboardPage.tsx`
- `src/features/admin-core/pages/AdminMarketplaceSettingsPage.tsx`
- `src/features/admin-core/pages/AdminOrderDetailPage.tsx`
- `src/features/admin-core/pages/AdminPayoutsPage.tsx`
- `src/features/admin-core/pages/AdminThemesPage.tsx`