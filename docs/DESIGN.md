# Nuede visual foundation

## Cycle 17 content completion

The homepage now has a dark promotional hero with controllable slides, live featured cards, a brand section, published testimonial carousel, native FAQ disclosures, a visible nutrition note, private feedback form and configurable contact/footer links. Live catalog images use the existing image component; a deliberate typographic hero remains usable when photography is missing. Historical fixture references below describe earlier cycles, not the current homepage.

The testimonial and feedback admin screens use responsive cards, existing labeled controls and native dialogs. Publication is a textual state and a separate confirmed action; conversion is an editable unpublished draft. Focus restoration includes nested conversion. Carousels support keyboard and native touch scrolling, ratings include numbers, reduced-motion preferences are honored, and multiple storefront feedback states use unique heading IDs. Focused browser checks cover five viewport widths, including mobile admin editing. See [Cycle 17 evidence](CYCLE17.md).

## Purpose

Cycle 1 establishes a small reusable visual and interaction language for two independent applications. This document prevents later feature cycles from inventing new colors, spacing, controls, modal behavior, or responsive conventions.

It is not a standalone component library and does not claim full WCAG compliance.

## Brand tokens

The canonical CSS values live in `packages/config/src/brand.css` and are consumed through `@nuede/config/brand.css`.

- `brand-950` and `brand-900`: primary dark green text/surfaces.
- `brand-700`: primary action and selected state.
- `brand-100`: subtle selected and supporting surface.
- `canvas` and `surface`: warm page and white component surfaces.
- `ink`, `muted`, and `line`: text hierarchy and restrained borders.
- `success`, `warning`, and `danger`: status meaning. Always pair status color with text or an icon.

Do not add a large decorative palette. New colors require a real semantic need.

## Typography

- Editorial storefront display: Georgia/Cambria serif stack.
- Interface, forms, tables, and admin: system sans-serif stack.
- Storefront heroes may use fluid display sizing; operational controls must retain predictable readable sizing.
- Eyebrows use small uppercase green text with restrained letter spacing.
- Body copy uses generous line height and a readable maximum width.

No unapproved font file or external font request is allowed.

## Layout and spacing

- Use Tailwind's four-pixel spacing rhythm.
- Mobile page gutters begin at 16px, grow to 24px on tablet, and 32px or more on large layouts.
- Storefront content is bounded near 1280px with narrower editorial copy.
- Admin content is bounded near 1600px and prioritizes operational canvas width.
- Separate major regions primarily through whitespace and thin borders, not nested shadows.

## Components

- Controls use a restrained 8–10px radius and minimum 44px height for primary interactive targets.
- Cards/panels use 16–20px radii, a one-pixel border, and normally no shadow.
- Shadows are reserved for floating dialogs and notifications.
- Primary buttons use action green; secondary buttons use a border; ghost buttons support lower-priority actions; destructive styling is rare.
- Disabled controls must remain legible, expose the native disabled state, and not rely on visual styling alone.

## Navigation and responsive behavior

- Desktop storefront navigation is inline; mobile navigation is a labelled modal menu.
- Admin uses a persistent sidebar at laptop widths and a modal menu below that threshold.
- Storefront cards collapse from three columns to two and then one.
- Planner uses grid regions on large screens and day-card composition on narrow screens.
- Checkout stacks the summary below the form before adopting a side panel on laptop layouts.
- Admin tables use a labelled horizontal scroll region and retain a practical minimum width rather than compressing columns into illegibility.

## Accessibility and interaction

- Both applications provide a skip link and semantic landmarks.
- Every page has one primary heading.
- Form labels stay visible and error/helper text is associated with its field.
- Focus-visible rings use the brand action color with an offset.
- Active navigation uses text/shape as well as color and exposes `aria-current` through React Router.
- Dialogs use native `dialog`, an accessible title, Escape handling, initial focus, focus containment, and opener focus restoration.
- Toasts use polite live regions; errors may use alert semantics.
- Animations are limited to simple transitions and busy indicators. Reduced-motion preferences suppress non-essential movement.

## Assets and fixtures

No approved production logo, font, or food-photo asset existed at Cycle 1 implementation time. The text wordmark and gradient image fields are temporary layout devices.

Fixture names, prices, orders, metrics, delivery areas, testimonials, feedback, payment states, and meal-plan slots are not production data or business rules. They must be replaced by the responsible future cycle.
