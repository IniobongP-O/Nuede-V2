# Development guide

## Local requirements

- Node.js 24
- npm 11
- Git
- Docker Desktop or another Docker-compatible container runtime for local Supabase

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

## Local Supabase

The Supabase CLI is an exact-version root development dependency. Run it through repository scripts so every developer uses the lockfile version.

```sh
npm run supabase:start
npm run db:reset
npm run db:test
npm run supabase:stop
```

`npm run db:reset` targets the local stack explicitly, replays `supabase/migrations`, and applies `supabase/seed.sql`. It destroys local database state and must not be replaced with `--linked` during Cycle 2.

Full Cycle 2 verification after the local stack is running:

```sh
npm run verify:cycle2
```

Do not run `supabase login`, `supabase link`, `supabase db push`, or `supabase db reset --linked` as part of the local Cycle 2 workflow.

## Cycle 3 admin Auth development

Copy `apps/admin/.env.example` to an ignored `apps/admin/.env.local` and set only:

```text
VITE_SUPABASE_URL=<local-or-approved-project-url>
VITE_SUPABASE_ANON_KEY=<public-anon-key>
```

Never add a service-role key, password, access token, or refresh token to a Vite variable. The admin build must contain browser-safe credentials only.

Public email signup is disabled in local `supabase/config.toml`. To bootstrap a manual local administrator:

1. Start local Supabase and open the local Studio URL printed by the CLI.
2. Use the local Auth administration screen to create an email/password user.
3. Copy that Auth user's UUID.
4. In local Studio SQL, insert a matching `admin_users` row with a lowercase email, optional display name, one of `owner`/`admin`/`editor`, and `is_active = true`.
5. Keep the chosen password local; never add this identity to migrations or seed data.

Cycle 3 security verification after the local stack is running:

```sh
npm run db:reset
npm run db:test
npm run test:security:cycle3
npm run verify
```

Or run the combined command:

```sh
npm run verify:cycle3
```

The direct security utility reads temporary local credentials from `supabase status -o env`, refuses non-local API URLs, creates ephemeral Auth personas, attacks RLS through Supabase clients, and removes its test records. It never writes credentials to source or a frontend environment.

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
