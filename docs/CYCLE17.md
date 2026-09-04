# Cycle 17 — testimonials, feedback and storefront content

Cycle 17 implementation is present. Cycles 0–16 were treated as the accepted foundation, without a pre-flight approval gate. Cycle 18 was not implemented. The source feature specification (homepage features 2–4, testimonials 143–145, feedback 146–150 and content 151–153) governed functionality; mockups informed presentation.

## Public testimonials and publication

- `apps/storefront/src/features/content/api/contentApi.js` requests only `id,customer_name,message,rating` from `public.published_testimonials`, bounded to 50 stories in stable ID order.
- The security-barrier projection has an explicit `is_published = true` predicate. Its reviewed postgres ownership is intentional, like the existing checkout-options projection. It exposes no source-feedback relationship, email, timestamps or audit metadata.
- Anonymous base-table SELECT is revoked. Authenticated base-table SELECT is limited to active admins through the existing RLS policy; non-admins use the same safe public projection as guests.
- A native horizontal carousel displays text, display name, and a visible numeric “out of 5” rating. Keyboard arrows, named previous/next controls, mouse drag and native touch scrolling are supported. It has loading, empty and retryable error states, without sample stories.
- Public TanStack Query refetches every 30 seconds while the page is active, on remount and on window focus. Admin mutations invalidate the admin-content cache. Cross-application updates are eventual: an open storefront may retain its last successful response until refetch. No testimonial/private-feedback Realtime subscription is introduced.
- Admin Testimonials provides paged search, publication and rating filters; created/updated dates; full-text editor; add, edit, publish, unpublish and confirmed hard delete. The existing model uses hard deletion, not archive semantics. Audit rows and source feedback survive deletion.
- New stories always save unpublished. Publication is a separate confirmed list action, including for manually authored testimonials. A database trigger rejects an INSERT with `is_published = true` and manages `published_at` when publication changes.

## Guest feedback, privacy and conversion

The homepage feedback form uses existing controls, React Hook Form, Zod and a TanStack mutation. It accepts name, email, subject, rating and written feedback without login. The six canonical subjects are `general_inquiry`, `order_issue`, `menu_suggestion`, `delivery_feedback`, `compliment`, and `other`; the UI shows readable labels.

Validation uses a 120-character name limit, a 254-character email limit with a non-whitespace address/domain pattern, a whole 1–5 rating and a nonblank message up to 5,000 characters. JavaScript trims form values; database checks independently reject invalid subjects, invalid email, blank/whitespace-only names/messages, out-of-range ratings and oversized raw values (including whitespace padding). Unknown ratings are never silently rendered as valid stars.

Submission uses an explicit five-field allowlist and INSERT without SELECT/returning. Anonymous column grants exclude IDs, timestamps and any future admin fields. Anonymous SELECT/UPDATE/DELETE remain denied; authenticated non-admin/inactive identities receive no private rows under RLS. Existing active owner/admin/editor permissions are preserved. Feedback is excluded from the Supabase Realtime publication.

The form has inline errors, submitting/disabled state, an in-flight guard, success confirmation, and a generic recoverable-error message that retains entries. Network uncertainty can still require a retry; this is not a server-idempotency mechanism. No existing CAPTCHA or request-throttle service was found. Payload limits and validation provide bounded submissions; rate limiting/CAPTCHA remain possible Cycle 18 hardening, not implemented here.

Admin Feedback queries only on the protected screen. Search (name/email/message), subject and rating filters compose on the server, with exact counts and 20-row pagination. Changing filters resets the page. Empty inbox and no matches are distinct. A native dialog shows full private text, sender email, rating and date. Text is rendered as React text, never unsafe HTML.

Conversion opens a separate testimonial editor containing only the chosen display name, message and rating. Admins can redact all three public values before saving. The existing `source_feedback_id` foreign key and unique partial index preserve provenance and prevent duplicate copies. The inbox recognizes an existing linked testimonial. The source is never updated/deleted by conversion, and its email column is never copied. Admins must also redact private details that customers themselves wrote inside the message.

Proof of draft-only conversion exists at three layers: the editor has no publish input, the insert explicitly sends `is_published: false`, and the database rejects published creation. Browser integration verifies invisibility after conversion, visibility after explicit publish, and invisibility after unpublish. Those HTTP-mocked checks are not a substitute for the supplied database security matrix.

## Storefront content

- Hero: two promotional slides linking to live Menu and Meal Planner, automatic seven-second rotation, previous/next and position controls, pause/start, hover/focus handling, reduced-motion support, and responsive imagery from the existing live menu. If no image exists, a deliberate branded typographic panel is shown. Existing image loading/error handling is reused.
- About: prepared meals, practical nutrition, ordering/customization and Abuja positioning; no medical promises, invented opening hours or delivery-time guarantees.
- Featured meals: the first eight customer-visible meals in the existing admin-controlled menu sort order. There is no duplicate product service or new feature flag/CMS. Cards reuse the existing menu representation, nutrition, prices, availability and favorites. Simple standard meals quick-add through the shared configuration validator; grouped meals and meals with add-ons open the existing detail dialog. Sold-out, unavailable and price-pending actions cannot bypass established validation.
- FAQ: seven native keyboard-operable disclosures covering delivery, meal planning, customization, nutrition, payment availability, Paystack and WhatsApp orders.
- Nutrition: a visible nutrition note explaining variation from ingredient substitutions, preparation and portions; linked from the footer.
- Contact/footer/social: branding, Menu/Planner/Saved/About/FAQ/nutrition links, current year and Abuja service context. A working feedback/inquiry link remains available even without optional external destinations.
- `features/content/config/storefrontContent.js` centralizes editorial copy and optional contact configuration. `VITE_CONTACT_PHONE`, `VITE_CONTACT_WHATSAPP`, `VITE_CONTACT_EMAIL`, `VITE_CONTACT_INSTAGRAM` and `VITE_CONTACT_HOURS` are documented in the storefront environment example. Missing/invalid destinations are omitted; Instagram requires HTTPS and the expected hostname. External links use meaningful names and safe new-tab attributes.
- General WhatsApp contact is independent of WhatsApp checkout enablement. No checkout/payment settings or commerce calculations changed. Existing Vite page metadata was already appropriate and was retained.

No approved production phone, email, WhatsApp number, Instagram profile or business hours were present in the examined sources. The business must supply these before those optional destinations appear. Production meal photography and real published stories come from the existing catalog/admin workflows; no production data was entered in this cycle.

## Migration and audit

`supabase/migrations/20260904000100_complete_feedback_and_testimonials.sql`:

1. Adds feedback/testimonial content checks. New check constraints use `NOT VALID` to preserve historical rows unchanged while enforcing future INSERT/UPDATE values. Existing invalid historical content must be reviewed before full constraint validation; this migration does not rewrite private history.
2. Narrows anonymous feedback insertion to the five intended columns.
3. Replaces public base-table testimonial access with the four-field published projection; retains the existing active-admin RLS policies.
4. Adds combined subject/rating/date and general date/ID feedback indexes. Existing subject and rating indexes are reused.
5. Adds draft-only creation/publication timestamp enforcement and database-owned audit triggers, using the existing `admin_audit_log`.
6. Excludes feedback from `supabase_realtime` if it was previously added.

Audit actions: `testimonial_created`, `testimonial_updated`, `testimonial_published`, `testimonial_unpublished`, `testimonial_deleted`, and `feedback_converted_to_testimonial`. Audit records retain actor, entity and before/after values. Browser clients cannot insert audit rows. Trusted migration/service operations without an active end-user admin actor do not fabricate one. Development seeds now create drafts and publish selected seed stories in a separate statement; no production data was changed.

## Accessibility, responsive behavior and security review

Both applications retain shared visible-focus styling and existing form-error associations. New controls have labels, numeric rating semantics and textual publication status. Native dialogs contain focus and support Escape; admin-dialog unmount now restores focus, including nested conversion. Native FAQ disclosure semantics and carousel keyboard scrolling were exercised in the browser. Storefront state headings now have unique IDs, preventing collisions when multiple sections are empty or fail at once.

HTTP-mocked browser checks cover 320, 390, 768, 1024 and 1440-pixel viewport widths for both apps, plus the mobile editor. Screenshots are generated under ignored `coverage/cycle17/`. Desktop storefront/admin and mobile screens were visually reviewed. This is focused Cycle 17 verification, not a broad production accessibility audit.

Post-implementation review found and corrected a required-field test selector, a form ref-handler lint issue, dialog focus cleanup, a hero button contrast/pause interaction, reuse of an existing index name, whitespace-padding validation and duplicate-conversion UI state. No frontend service-role secret, public feedback read, automatic publication, source deletion, unsafe HTML, duplicate content table, second menu/cart system or Cycle 18 deployment work was introduced.

## Verification record

| Command/check | Result |
|---|---|
| `node --test scripts/verify-cycle17-content.test.js` | PASS, 12 focused tests |
| `npm test` | PASS; final repository run through `npm run verify` passed all 162 tests, including commerce, authorization architecture and Cycle 16 analytics regressions |
| `npm run lint` | PASS after fixes |
| `npm run build` | PASS for storefront and admin; existing large-bundle and third-party Zod annotation warnings remain |
| `node scripts/verify-cycle17-browser.mjs` | PASS with bundled Playwright and installed headless Edge; HTTP responses explicitly mocked |
| `npm run verify` | PASS — lint, all 162 Node tests, storefront production build and admin production build |
| `npm run db:test` | NOT RUN — local PostgreSQL connection refused at `127.0.0.1:54322`; initial sandbox attempt also hit Supabase CLI telemetry-file access, resolved by normal CLI access |
| `npm run test:security:cycle3` | NOT RUN — the existing security runner reports that local Supabase is not running |
| `git -c core.safecrlf=false diff --check` | PASS |

The initial repository test failure was an exact shared-file inventory that needed the new validation module. The initial build attempt was blocked by esbuild's sandbox directory traversal; normal build access succeeded. The early browser runs exposed test-selector/assertion scope errors; corrected runs passed. None of those initial failures is represented as a pass without rerunning it.

The new `011_cycle17_content.test.sql` exercises actual roles, grants, published/draft access, private submission/read/update/delete, input constraints, owner/admin/editor/inactive/non-admin behavior, filters, conversion, publication, source preservation and audit behavior when local Supabase is available. It has not been executed here. Migration replay, database-backed persistence, live Auth/RLS and real Realtime denial are not claimed verified. No hosted database was used as a substitute.

To rerun the browser checks in this environment:

```powershell
$env:NUEDE_BROWSER_MODULES = 'C:\Users\paulo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:NUEDE_BROWSER_CHANNEL = 'msedge'
node scripts/verify-cycle17-browser.mjs
```

With Playwright installed normally, omit `NUEDE_BROWSER_MODULES`; with its bundled Chromium installed, omit the channel override. The script starts isolated localhost Vite servers on 5275/5274, overrides configuration only in its own process, closes both servers and its browser, and never edits application environment files.

Remaining verification is environmental, not a known unresolved Cycle 17 implementation defect. The migration must be replayed and the database matrix run when local Supabase is available. Final Git state is branch `main`, with 22 modified tracked files and 18 new untracked files, all unstaged. No checkpoint commit is created by this task. Intended checkpoint: `feat: complete content feedback and testimonials`.
