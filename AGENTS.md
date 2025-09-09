# Repository Guidelines

## Project Structure & Module Organization
- `src/` — React + TypeScript app code. Key folders: `components/` (UI, PascalCase), `config/` (runtime config in `index.ts`), `contexts/`, `types/`, `utils/`.
- `public/` — static assets served by Vite.
- `ao_process/` — AO process (Lua) deployed via `aos`; main file: `ao_agent.lua`.
- Root files: `index.html`, `vite.config.ts`, `eslint.config.js`, `tsconfig*.json`.

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start Vite dev server at localhost with HMR.
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the production build locally.
- Linting: run `npx eslint .` to lint TypeScript/React (config in `eslint.config.js`).

## Coding Style & Naming Conventions
- TypeScript, React 18+ functional components.
- Files: components as `PascalCase.tsx` in `src/components`; utilities `camelCase.ts` in `src/utils`.
- Imports: prefer named exports; avoid default exports for shared utilities.
- Indentation: 2 spaces; use single quotes; semicolons optional but be consistent.
- React: follow Hooks rules; stateful UI n components, side effects in `useEffect`.

## Testing Guidelines
- No formal tests included. If adding tests, prefer Vitest + Testing Library.
- Place unit tests next to sources as `*.test.ts`/`*.test.tsx` or under `src/__tests__/`.
- Keep tests deterministic and fast; mock network and AO calls.

## Commit & Pull Request Guidelines
- Git history uses short, imperative messages (no strict Conventional Commits). Example: `update router process id`.
- Aim for concise, descriptive messages; optionally prefix with type, e.g., `feat:`, `fix:`, `docs:`.
- PRs should include: clear description, screenshots for UI changes, steps to verify, and linked issues.

## Security & Configuration Tips
- Update `src/config/index.ts` for `aoProcessId` and APUS/HyperBEAM settings; do not commit secrets or private keys.
- AO process: deploy from `ao_process/` using `aos`; keep process IDs and endpoints configurable via `config`.

## Agent-Specific Instructions
- Preserve this structure and conventions when modifying files.
- Prefer minimal, surgical changes; do not reformat unrelated files.
