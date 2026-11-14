# FOXY cloud storage

FOXY uses Supabase Auth and a private diary per signed-in account.
The browser contains only a publishable API key. Never add a secret or service-role key.

## Account setup
In Supabase Authentication → URL Configuration, set Site URL to:
https://alisiatkc.github.io/foxy-diary/index.html

Allow both:
- https://alisiatkc.github.io/foxy-diary/
- https://alisiatkc.github.io/foxy-diary/index.html

Keep email confirmation enabled. The owner registers in FOXY → Data, confirms email, then signs in.

## Data and sync
- Existing localStorage key and diary format are preserved.
- Local changes save immediately; online changes sync after a short debounce.
- Reconnection and returning to the tab trigger synchronization.
- Records merge by ID against the previous cloud baseline.
- Concurrent edits to the same record stop synchronization and require an explicit choice.
- Writes use an expected revision to reject concurrent overwrites.
- Before resolving a conflict, FOXY downloads a JSON backup.
- The local diary is bound to its first cloud account to prevent accidental cross-account uploads.
- Private historical imports are claimed by the authenticated, confirmed email.
- An import marker prevents duplicate imports and resurrection of deleted imported records.
- No personal history is stored in this repository.

## Database
`supabase/schema.sql` records the applied schema. The private import table has no direct client access.
The only elevated helper lives in a non-exposed schema, checks auth.uid(), and reads only the verified email's import.

## Validation
Database checks cover row ownership, anonymous denial, private history ownership, and stale revisions.
Client checks cover offline saves, two-device merges, conflicts, repeated imports, JSONB key order, and deleted history.
Run client tests with: `node --test tests/cloud-sync.test.cjs`.

## Current setup status
The database and private history are provisioned. The production Site URL and both exact FOXY redirect URLs are configured and verified in the Supabase dashboard. Email confirmation remains enabled. The owner still needs to create a FOXY account, confirm their email, and sign in once to claim the prepared history.
