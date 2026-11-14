# ALISA PIN sign-in

ALISA opens the existing Supabase diary with one five-digit code. The PIN value is configured privately and is never included in this repository.

- Client: sends the PIN to `alisa-pin-login` and stores the returned user session.
- Server: checks a bcrypt hash in a private table, limits wrong attempts to five per fifteen minutes, then creates a normal Supabase Auth session for the configured existing account without sending email.
- The browser still accesses diary data through the existing owner-only RLS policies.
- The privileged key stays in Edge Function environment variables.
- Leading zeros are preserved: the PIN is always a string.
- Saved sessions are refreshed automatically.
- Existing local storage keys, history IDs, database records, and import markers are unchanged.

## Deployment
The edge function source is `supabase/functions/alisa-pin-login/index.ts`. JWT gateway checking is disabled because the function authenticates the PIN itself; no user JWT exists before this login.
`supabase/pin-schema.sql` documents the schema only. Provision the account and bcrypt hash through a private administrative operation, never a public migration.

## Verification
`node --test tests/cloud-sync.test.cjs` tests PIN form behavior, leading zeros, denied attempts, existing history, offline edits, multi-device merges and conflict protection.
The deployed function was also verified against the existing account and returned its existing diary. No password, PIN or user token is written to logs.
