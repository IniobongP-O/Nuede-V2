# @nuede/domain

This package will hold framework-independent Nuede business rules when their approved cycles arrive.

Allowed responsibilities include nutrition calculations, normalized order helpers, money formatting, and domain constants. It must not import React, either application, browser-only code, Supabase clients, or backend secrets.

Cycle 4 introduces integer-kobo display and form helpers in `src/currency.js`.
Authoritative prices remain PostgreSQL values; these helpers only format or normalize
those integer values at application boundaries.

Cycle 5 adds framework-independent grouped-product orderability and stable variant
reorder helpers in `src/catalog.js`. PostgreSQL triggers remain the persistence
authority for the equivalent invariants.
