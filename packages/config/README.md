# @nuede/config

This package holds public, non-secret configuration helpers and stable shared constants.

Cycle 1 adds `brand.css`, the framework-independent Nuede color, typography, radius, and shadow token source used by both applications. React components and application layout styles remain owned by their applications.

It must never contain credentials, Supabase service-role access, Paystack secrets, webhook secrets, or application-specific UI code.

The package remains independent of React, routing, and application code.
