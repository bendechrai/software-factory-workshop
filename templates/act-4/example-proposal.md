# Proposal

## Why

A short link lives forever today. People share links for a launch, a sale or a one-off event and then want them to stop working. Right now the only way to stop a link is to delete it, which also loses its click count.

## What Changes

- When creating a link the user can set an expiry as a number of days from now, from 1 to 365. The field is optional. A link with no expiry never expires.
- After the expiry passes, visiting the short link returns 410 Gone with a plain page that says the link has expired. The visit is not counted as a click.
- The home page shows an expired link greyed out, with the word Expired in place of its click count. An expired link can still be deleted.
- The links API returns when a link expires and whether it has expired, so the page does not need to work it out from the browser clock.
- A new migration adds the expiry column. Existing links get no expiry and keep working as before.

No breaking changes. Links created before this change behave exactly as they do today.

## Capabilities

### New Capabilities

- `link-expiry`: a link can carry an optional expiry date. What happens when a link is created with or without one, what a visitor sees after it passes, and how the home page and API report it.

### Modified Capabilities

None. There are no existing specs in this project yet.

## Impact

- `migrations/`: one new numbered migration that adds a nullable `expires_at` column to `links`.
- `src/services/links.ts`: the row gains the expiry and `insert` stores it.
- `src/actions/`: `create-link` validates the days and works out the expiry date; `follow-link` refuses an expired link; `list-links` and `get-link` report the expired state. A small shared rule decides whether a link has expired.
- `src/routes/`: `POST /api/links` accepts `expiresInDays`; `GET /:code` returns 410 with a plain page for an expired link.
- `public/`: the form gains an optional days field; the table greys out expired rows and shows Expired instead of the count.
- `e2e/hop.spec.ts`: a browser scenario for an expired link. The e2e database moves from memory to a throwaway file so the test can set an expiry in the past.
- No new dependencies and no new environment variables.
