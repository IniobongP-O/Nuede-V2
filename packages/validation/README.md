# @nuede/validation

This package will hold reusable runtime validation schemas when approved feature cycles introduce real data boundaries.

Schemas may be shared when both applications or backend contracts need the same validation. This package must not import application code or contain authoritative pricing and payment behavior.

Cycle 4 introduces the shared standard-product and category form schemas in
`src/catalog.js`. Currency input is validated as a decimal string and converted to
integer kobo without floating-point arithmetic.

Cycle 5 extends that module with grouped-parent, variant, add-on, and catalog-image
validation. Supported image MIME types and the five-megabyte limit are shared with
the admin upload workflow and migration-owned bucket configuration.

Cycle 8 adds `saved-meals` validation for the device-local list of stable product
UUIDs. Browser data is treated as untrusted and invalid entries are discarded.
