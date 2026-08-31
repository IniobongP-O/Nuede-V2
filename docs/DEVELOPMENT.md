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

## Git and recovery

Use clear Conventional Commit-style checkpoint messages from the field guide. The planned Cycle 0 checkpoint is:

```text
chore: initialize Nuede V2 architecture
```

Do not create a checkpoint until lint, builds, relevant tests, review, and manual acceptance all pass. Never build a later cycle on unresolved failures. Preserve the last known-good checkpoint rather than hiding or stacking breakage.
