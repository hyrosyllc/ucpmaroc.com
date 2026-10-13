# Development Resources

This repository is a React 18, TypeScript, Vite application using Tailwind, Radix/shadcn-style components, Lucide, and Framer Motion. The resources below are scoped to that stack and installed as agent guidance; they do not add runtime dependencies.

## Installed

- **UI/UX Pro Max**: `.github/prompts/ui-ux-pro-max.prompt.md` and its local searchable data. Installed with the upstream Copilot installer; search with `python3 .github/prompts/ui-ux-pro-max/scripts/search.py "mobile dashboard" --domain ux -n 3`. MIT. Source revision: `nextlevelbuilder/ui-ux-pro-max-skill` at `09170eec67eefd46a7ae85de61b40c194020f997`.
- **React Best Practices**: `.github/skills/react-best-practices/`. Includes the complete Vercel rule set; its scope note excludes Next.js-only guidance for this Vite app. MIT is declared by the upstream skill. Source revision: `vercel-labs/agent-skills` at `063bee94c3f4df8453406c830b0a7df0f2860278`.
- **Frontend Design**: `.github/skills/frontend-design/`. Includes the upstream Apache 2.0 license and UCP Maroc-specific design context. Source revision: `anthropics/skills` at `8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4`.
- **Web Design Guidelines**: `.github/skills/web-design-guidelines/`. Reviews against a local copy of Vercel's rules so audits do not require network access. MIT. Skill source revision: `vercel-labs/agent-skills` at `063bee94c3f4df8453406c830b0a7df0f2860278`; rule snapshot revision: `vercel-labs/web-interface-guidelines` at `e3d624baaf29dc1fc645aff3e38f03e564d2d6b1`.

These prompts and skills are optional guidance. Follow the user's request and existing project conventions when recommendations conflict; verify accessibility, responsive behavior, and performance in the affected feature.

## Reference Catalogs

These repositories are indexes, not application dependencies. Browse them for a specific need and evaluate the chosen package or asset before adoption.

- [Awesome React](https://github.com/enaqx/awesome-react): React ecosystem catalog.
- [Awesome Agent Skills](https://github.com/VoltAgent/awesome-agent-skills): agent-skill catalog.
- [Design Resources for Developers](https://github.com/bradtraversy/design-resources-for-developers): design and asset catalog.
- [shadcn/ui](https://ui.shadcn.com/): accessible, copy-in components compatible with the current Tailwind/Radix foundation.

The suggested `ibelick/baseline-ui` URL was unavailable when checked. The Beautiful Shadows reference did not include a repository URL, so it was not installed.