# Development guide

## Local requirements

- Node.js 24
- npm 11
- Git

Install all workspaces from the repository root:

```sh
npm install
```

The lockfile is committed so clean environments can use `npm ci`.

## Development commands

```sh
npm run dev:storefront
npm run dev:admin
npm run build:storefront
npm run build:admin
npm run build
npm run lint
npm test
npm run verify
```

The storefront uses port 5173. The admin application uses port 5174. Ports are strict so a conflict is visible instead of silently changing the expected URL.

## Development-cycle workflow

Every cycle follows:

```text
INSPECT -> IMPLEMENT -> REVIEW -> VERIFY -> MANUAL ACCEPTANCE -> GIT CHECKPOINT
```

1. Inspect the current repository, architecture, feature sources, and relevant data boundaries without changing files.
2. Agree on a cycle-scoped plan.
3. Implement only the approved cycle.
4. Review changed code for structural, correctness, security, and scope problems.
5. Run relevant lint, tests, builds, and focused technical checks without suppressing failures.
6. Have the user perform the documented manual acceptance test.
7. Create the known-good Git checkpoint only after explicit acceptance or authorization.

A cycle is not complete merely because implementation stopped or automated checks pass.

## Engineering rules

- Use JavaScript and JSX only.
- Keep the storefront and admin independently runnable and buildable.
- Do not import application code into shared packages.
- Keep backend code out of browser bundles.
- Add dependencies only when the current cycle justifies them.
- Preserve meaningful validation and test failures.
- Prefer small feature-focused files over giant utilities.
- Do not create abstractions solely for future cycles.
- Never commit real secrets or generated build output.

## Cycle 1 frontend conventions

- Each app owns its router under `src/app/router.jsx` and its route manifest under `src/app/routePaths.js`.
- Storefront and admin must not import one another.
- Shared brand tokens are imported from `@nuede/config/brand.css`; component and page styles remain application-owned.
- Use Lucide React as the only icon source.
- Use the native `dialog` element through the application-owned `Dialog` component for modal focus containment, Escape behavior, and focus restoration.
- Form controls require visible labels. Helper/error text must be associated through `aria-describedby`.
- Reusable feedback components cover loading, error, and empty states. Toast viewports use ARIA live regions.
- Fixture content belongs under `src/fixtures` and must not be promoted into shared domain/config packages or disguised behind a fake API.
- About, FAQ, and Contact remain storefront homepage anchors until production content work.
- Commercial-looking Cycle 1 actions must be inert or explicitly describe themselves as demonstrations.

See `docs/DESIGN.md` for visual, responsive, interaction, and accessibility conventions.

## Git and recovery

Use clear Conventional Commit-style checkpoint messages from the field guide. The planned Cycle 0 checkpoint is:

```text
chore: initialize Nuede V2 architecture
```

Do not create a checkpoint until lint, builds, relevant tests, review, and manual acceptance all pass. Never build a later cycle on unresolved failures. Preserve the last known-good checkpoint rather than hiding or stacking breakage.
