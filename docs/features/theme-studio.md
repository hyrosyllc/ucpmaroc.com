# Theme Studio Feature

## Responsibility

Theme Studio is the developer-facing editor and marketplace workflow for custom theme code. It is distinct from built-in themes in `src/themes/registry.ts` and from normal portfolio section editing. The feature includes theme drafts, Monaco editing, preview execution, submission for moderation, and admin compilation/publication.

## Entry Points and Records

- `/dashboard/studio` → `ThemeStudioPage`: edit files, compile/run, inspect a real test site, use inline/schema preview.
- `/dashboard/creator-hub` → `DeveloperHubPage`: create themes, set metadata/prices, list status, submit for review.
- `/studio-preview` → `StudioPreview`: iframe environment for compiled/editor code and portfolio-derived test data.
- `/admin/themes` → `AdminThemesPage`: admin review/compile/reject.

All routes are in `src/App.tsx`. `marketplace_themes` stores developer, metadata/pricing, `files`, review status, and `compiled_bundle`. Developer ownership queries filter by `developer_id=actorData.id`.

## Authoring and Preview Flow

1. `DeveloperHubPage` inserts a draft `marketplace_themes` row, then navigates to `/dashboard/studio?themeId=...`.
2. `ThemeStudioPage` loads the developer-owned row, merges any missing `INITIAL_FILES`, and autosaves edited `files` after a debounce.
3. Monaco uses `src/lib/ucp-sdk/` type declarations and the editor's `addExtraLib` definitions for UCP components and available UI types.
4. Compile/run transpiles JSX/TSX with Babel Standalone. It sends `EXECUTE_CODE` or `EXECUTE_BUNDLE` through `postMessage` to the preview frame. The frame can return `PREVIEW_READY`, `SCHEMA_PARSED`, `FULL_PAGE_READY`, or inline-edit messages.
5. `StudioPreview` can load a selected portfolio as real test data and supplies mapped React/UI/SDK modules to the preview renderer.

## Review and Runtime Consumption

`DeveloperHubPage` changes a draft status to `pending_review`. `AdminThemesPage` lists pending themes and calls `compile-theme` on approval; the function reads `files`, Babel-transforms TSX/JSX, writes `compiled_bundle`, and changes status to `approved`. Rejection writes `status='rejected'`.

Portfolio builder/preview and `PortfolioLayout` can read `marketplace_themes.compiled_bundle`. `usePrecompiledTheme` reconstructs component exports; `resolveThemeComponent`/the section component map then selects components for sections. Built-in theme components remain governed by `THEME_REGISTRY` and the `PortfolioThemeDefinition` contract.

## Security Boundary: Must Verify

Custom theme files are executable code, not inert templates. `useDynamicThemeCompiler`, `usePrecompiledTheme`, and `StudioPreview` execute generated JavaScript with `new Function`; a mocked/allowlisted `require` is not a security sandbox. Review origin isolation, available browser APIs, data exposure, and approval policy before treating custom code as safe.

At the time of this scan, `supabase/config.toml` sets `compile-theme` to `verify_jwt=false`, and `supabase/functions/compile-theme/index.ts` creates a service-role client and updates the theme to approved without validating the caller's identity, theme ownership, or admin role in the function. The admin page's route guard does not protect a directly callable Edge Function. Treat this as a security issue to resolve before relying on the approval flow in production.

## Connections and Maintenance

- Portfolio Builder owns normal site sections, theme selection, theme purchases, and live rendering; Theme Studio owns user-authored marketplace code.
- Admin Core moderates marketplace submissions; `compile-theme` persists executable bundles.
- UCP editor types live in `src/lib/ucp-sdk/`, while runtime module bridges are in `useDynamicThemeCompiler.ts`, `usePrecompiledTheme.ts`, and `StudioPreview.tsx`. Keep declared editor modules aligned with actual runtime modules.
- Version the theme file schema/compiled bundle contract when changing component names or exports; test preview and live rendering together.
- The project has built-in themes (`modern`, `modern_bright`, `cinematic`, `cupertino`) as well as database marketplace themes. Do not treat them as one registry or licensing path.

## Complete Module File Map

- `src/features/theme-studio/index.ts`
- `src/features/theme-studio/pages/DeveloperHubPage.tsx`
- `src/features/theme-studio/pages/StudioPreview.tsx`
- `src/features/theme-studio/pages/ThemeStudioPage.tsx`