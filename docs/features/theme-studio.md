# Theme Studio Feature

## Responsibility

Theme Studio is the developer-facing editor and marketplace workflow for custom theme code. It is distinct from the built-in themes in `src/themes/registry.ts`. It covers theme drafts, multi-file Monaco editing, live preview against a real test site, submission, admin review/compilation, and runtime rendering in the builder and on published sites.

## Entry Points and Records

- `/dashboard/studio` → `ThemeStudioPage`: file explorer (create, rename, delete), Monaco editor, preview, test-value panels, submit for review.
- `/dashboard/creator-hub` → `DeveloperHubPage`: create themes, metadata/prices, status and rejection reasons. Submission happens in Studio so files are validated first.
- `/studio-preview` → `StudioPreview`: same-origin iframe that evaluates a compiled bundle and renders it.
- `/admin/themes` → `AdminThemesPage`: automated checks, code viewer, approve, reject with reason.

`marketplace_themes` stores owner, metadata/prices, `files`, `status` (`draft`, `pending_review`, `approved`, `rejected`), `compiled_bundle`, and (after migration `20261016000000`) `rejection_reason`, `reviewed_at`, `reviewed_by`.

## Shared runtime (`src/lib/theme-runtime/`)

One module system serves Studio preview, builder preview, and the live site.

- `loader.ts`: evaluates a bundle of CommonJS files. Relative imports between theme files work (`./SectionTitle`, `../x/Y`); circular imports are safe; one broken file reports an error without blocking the others. Pure, unit tested (`theme-runtime.test.ts`).
- `modules.ts`: the single allowlist of external modules (react, react-dom, `@ucp/sdk`, `@/lib/utils`, framer-motion, recharts, date-fns, canvas-confetti, `Link` from react-router-dom, lucide-react with a placeholder for unknown icons, and the shadcn UI modules). Any other import throws.
- `schema.ts`: accepts both schema formats (array `[{ id, type, label, defaultValue, options }]` and the legacy object map) and normalises to the section field format.
- `compile.ts`: Babel transform used by Studio; also reports sections without a default export.
- `sectionTypes.ts`: maps file names to section types through the section registry (`Faq.tsx` → `faq`, `RichText.tsx` → `rich_text`).

`useActiveTheme(themeId)` (builder hooks) resolves a built-in theme or an approved marketplace theme to a component map. Missing sections fall back to Modern. It reads the bundle from `marketplace_themes_public` (falling back to the table before the view exists) and caches it. `PortfolioHome`, `DynamicPage`, `PortfolioLayout`, `BuilderPreview`, and `SectionEditor` all use it, so custom themes render live and expose their design schemas in the editor.

## Authoring and Preview Flow

1. A new theme opens with all Cupertino sections as starter files (SDK-only code, including the `SectionTitle` helper). Existing themes keep their files; add starters from New file.
2. Edits autosave after 1.5 s. Editing a theme that is `pending_review` withdraws the submission (status returns to `draft`) so reviewers never approve code that has since changed.
3. Studio compiles all files with Babel and posts `STUDIO_LOAD { bundle, mode, activeFile }` to the iframe. It recompiles shortly after edits, on file switch, on test-site change, on Refresh, and on Ctrl/Cmd+S.
4. The iframe returns `PREVIEW_READY`, `STUDIO_ERRORS` (per-file load errors), `SCHEMA_PARSED` (normalised design schema, the section's content schema from the registry, current data and settings), and `STUDIO_INLINE_EDIT`. Both sides accept messages only from the same origin and the expected window.
5. Component mode shows one file with the test site's real data for that section type (registry starter content when absent). The Design settings and Content tabs edit `settings` and `data` through the shared schema renderer; edits survive recompiles.
6. Full page mode renders the test site's sections in order, with their settings and layout controls, resolved exactly like the live site (missing sections fall back to Modern). A crashing section shows an inline error instead of blanking the page.

## Review and Publication

- **Submit** (Studio): compiles every file; blocks on errors or when no section file exists; then sets `pending_review`. For an approved theme it submits an update while the live version stays available.
- **Admin** (`compile-theme`, requires JWT and `actors.role='admin'`): `analyze` returns blocking problems (disallowed or unresolvable imports, syntax errors, size limits) and review findings (`eval`, `fetch`, storage, cross-window messaging, direct database access, raw HTML). `approve` compiles all files server-side, writes `compiled_bundle`, sets `approved`; findings need explicit acknowledgement. `reject` stores the reason shown to the developer.
- **Database** (migration `20261016000000_theme_studio_hardening.sql`): a trigger stops non-admins from writing `compiled_bundle` or deciding review outcomes (developers may only submit or withdraw); theme source is readable only by its developer and admins; browsers read bundles through `marketplace_themes_public`. The migration prints a notice for any existing `FOR ALL` policy that may still expose source; review those.

## Versions and rollback

Migration `20261017000000_theme_versions.sql` adds `marketplace_theme_versions` (immutable snapshots with status `pending`, `approved`, `rejected`, `withdrawn`) and `marketplace_themes.published_version`.

- **Submit** calls `submit_theme_version`, which snapshots the files as the next version and moves the theme to `pending_review`.
- **Edit while in review** withdraws the pending version (trigger) and returns the theme to `draft`.
- **Review** (`compile-theme`) reads the pending snapshot, never the working copy; approve stores the bundle on that version, publishes it (`published_version`, `compiled_bundle`), reject records the reason on the version.
- **Rollback**: `rollback_theme_version` (owner or admin) re-points the live bundle to any approved version. Studio's Versions dialog lists history, loads a version's files into the editor, and makes an approved version live.
- **Pinning**: a site can load a specific approved version through `theme_config.themeVersion` (public view `marketplace_theme_versions_public`); without it the published version is served.
- The write guard lets only these functions and admins change `compiled_bundle`, `published_version`, and review fields.

## Commerce views

A theme can restyle the store by shipping files named after these views (default export, props only): `ShopLayout`, `ProductLayout`, `LoginLayout`, `CartDrawer`, `CheckoutView`, `ThankYouView`. The platform renders the theme's view when present, otherwise the Modern default, and falls back to the default if the view throws (`CommerceView`). Logic never moves to the theme:

- `CartDrawer` calls `UCP.useCartDrawer()`; `ShopLayout` uses `UCP.useProductCard()`.
- `CheckoutView` calls `UCP.useCheckout(portfolio)` (step, items, totals, shipping rates, coupon state, and `slots.contact` / `slots.payment`). The theme decides where the slots sit; Stripe fields and order creation are always platform components.
- `ThankYouView` calls `UCP.useThankYou(portfolio)` (order, downloads, display fields, URLs, `handlePrint`).
- `ShopLayout`, `ProductLayout` and `LoginLayout` still receive state and callbacks as props from their pages (same security property; moving them behind hooks is the next consistency step).
- Cupertino ships all six as the starter set; Studio previews each with sample data.

## Security Boundary

Theme code is executable with `new Function`; the module allowlist and review are the controls. Policy is reviewed-only themes. Static scanning is a reviewer aid. A CSP runs in report-only mode (`vercel.json`, reports at `api/csp-report.ts`). Studio's "Isolated" toggle runs the preview in a sandboxed iframe (`sandbox.html`, opaque origin, strict CSP, sample data only); the builder preview and live site still mount reviewed themes directly.

## Known gaps

- Live commerce views (shop, product, cart, checkout) are not themeable by custom themes yet (Phase 6).
- Monaco semantic type checking is off (React types are not loaded); syntax errors are shown.
- `files` and `compiled_bundle` on `marketplace_themes` mirror the working copy and the live version; history lives in `marketplace_theme_versions`.

## Complete Module File Map

- `src/features/theme-studio/index.ts`
- `src/features/theme-studio/pages/DeveloperHubPage.tsx`
- `src/features/theme-studio/pages/StudioPreview.tsx`
- `src/features/theme-studio/pages/ThemeStudioPage.tsx`
- `src/lib/theme-runtime/` (`loader.ts`, `modules.ts`, `schema.ts`, `compile.ts`, `sectionTypes.ts`, `index.ts`, test)
- `src/features/portfolio-builder/hooks/useActiveTheme.ts`, `usePrecompiledTheme.ts`, `useDynamicThemeCompiler.ts`
- `supabase/functions/compile-theme/index.ts`
- `supabase/migrations/20261016000000_theme_studio_hardening.sql`
