# Development Resources

This repository is a React 18, TypeScript, Vite application using Tailwind, Radix/shadcn-style components, Lucide, and Framer Motion. The skills below provide agent guidance; the upstream repositories are isolated reference submodules. Neither changes the application dependency graph.

## Installed

- **UI/UX Pro Max**: `.github/prompts/ui-ux-pro-max.prompt.md` and its local searchable data. Installed with the upstream Copilot installer; search with `python3 .github/prompts/ui-ux-pro-max/scripts/search.py "mobile dashboard" --domain ux -n 3`. MIT. Source revision: `nextlevelbuilder/ui-ux-pro-max-skill` at `09170eec67eefd46a7ae85de61b40c194020f997`.
- **React Best Practices**: `.github/skills/react-best-practices/`. Includes the complete Vercel rule set; its scope note excludes Next.js-only guidance for this Vite app. MIT is declared by the upstream skill. Source revision: `vercel-labs/agent-skills` at `063bee94c3f4df8453406c830b0a7df0f2860278`.
- **Frontend Design**: `.github/skills/frontend-design/`. Includes the upstream Apache 2.0 license and UCP Maroc-specific design context. Source revision: `anthropics/skills` at `8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4`.
- **Web Design Guidelines**: `.github/skills/web-design-guidelines/`. Reviews against a local copy of Vercel's rules so audits do not require network access. MIT. Skill source revision: `vercel-labs/agent-skills` at `063bee94c3f4df8453406c830b0a7df0f2860278`; rule snapshot revision: `vercel-labs/web-interface-guidelines` at `e3d624baaf29dc1fc645aff3e38f03e564d2d6b1`.

These prompts and skills are optional guidance. Follow the user's request and existing project conventions when recommendations conflict; verify accessibility, responsive behavior, and performance in the affected feature.

## Other Workspace Prompt Suites

The workspace also contains bundled design/brand skills and their supporting references/scripts under `.github/prompts/`: `brand`, `design`, `design-system`, `slides`, `banner-design`, and `ui-styling`. `design` routes among identity, logo, corporate-identity, slide, banner, social, and icon workflows; the focused suites contain their own data, templates, tests, or generation helpers. These are development-time resources, not app dependencies. The complete prompt-file inventory is in `docs/REPOSITORY_CATALOG.md`'s agent-resource section.

## Local Reference Repositories

The checked-out sources live under `resources/reference-repos/`, outside Vite's `src/` tree. Git records each as a commit-pinned submodule; no source from these repositories is bundled into the product automatically.

- `resources/reference-repos/awesome-react` ([enaqx/awesome-react](https://github.com/enaqx/awesome-react)): React ecosystem index.
- `resources/reference-repos/awesome-agent-skills` ([VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)): agent-skill index.
- `resources/reference-repos/design-resources-for-developers` ([bradtraversy/design-resources-for-developers](https://github.com/bradtraversy/design-resources-for-developers)): design and asset index.
- `resources/reference-repos/vercel-agent-skills` ([vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)): upstream skill sources.
- `resources/reference-repos/anthropic-skills` ([anthropics/skills](https://github.com/anthropics/skills)): skill examples and sources; licensing varies by skill, so inspect each skill's license.
- `resources/reference-repos/ui-ux-pro-max-skill` ([nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)): UI/UX design data and Copilot skill source (MIT).
- `resources/reference-repos/liquid-web` ([koirodev/liquid-web](https://github.com/koirodev/liquid-web)): Liquid Glass effect library source (MIT). Its shallow checkout is about 99 MB; it is reference material, not an installed app library.
- `resources/reference-repos/shadcn-ui` ([shadcn-ui/ui](https://github.com/shadcn-ui/ui)): upstream component registry/source (MIT); this project already has local shadcn-style components.

Initialize submodules after cloning the project with:

```bash
git submodule update --init --depth 1 --recursive
```

Before adapting code, packages, or assets, check the relevant upstream license, maintenance status, accessibility, browser support, and bundle/performance impact. Keep imports out of application code unless a dependency is intentionally adopted and reviewed.

The suggested `ibelick/baseline-ui` URL was unavailable when checked. The Beautiful Shadows reference did not include a repository URL, so it was not added.