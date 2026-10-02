# Tasks

## 1. Schema and service

- [x] 1.1 Add `migrations/002-add-expires-at.sql` that adds a nullable `expires_at` TEXT column to `links`, and verify `npm run migrate` applies it once and a second run applies 0 (the existing `migrations.test.ts` covers the twice-is-nothing case)
- [x] 1.2 Extend `Link` with `expiresAt: string | null` and `LinksService.insert` with an `expiresAt` parameter in `src/services/links.ts`, reading and writing the new column, and verify a new case in `src/services/links.test.ts` round-trips a link with an expiry and one without
- [x] 1.3 Update `src/actions/fake-links.ts` so `insert` stores `expiresAt` and seeded rows can carry one, and verify `npm run typecheck` passes with the wider type

## 2. Actions and routes

- [x] 2.1 Add `src/actions/is-expired.ts` with the one rule "expiresAt is set and is at or before now", and verify `src/actions/is-expired.test.ts` covers null, future and past
- [x] 2.2 Make `createLink` in `src/actions/create-link.ts` accept `expiresInDays` and an optional `now`, reject anything that is not a whole number from 1 to 365 with the words "whole number of days from 1 to 365", treat blank as none, and store `now + days`; verify new cases in `create-link.test.ts` for 30 days, blank, 0, 366, 1.5 and text
- [x] 2.3 Make `followLink` in `src/actions/follow-link.ts` read the link first, return the new reason `expired` without counting the click when the rule says so, and add `expired` to `ActionResult` in `src/actions/result.ts`; verify new cases in `follow-link.test.ts` show an expired link is refused with clicks unchanged and a future or null expiry still redirects and counts
- [x] 2.4 Make `listLinks` and `getLink` return each link with an `expired` flag, taking an optional `now`; verify `npm run typecheck` and the existing action tests pass
- [x] 2.5 In `src/routes/links.ts` pass `expiresInDays` from the body into `createLink`; verify `src/app.test.ts` gains cases for a link created with 7 days (201, `expiresAt` set, `expired` false), blank (`expiresAt` null) and 400 for 0 and 366, and that the list carries `expiresAt` and `expired`
- [x] 2.6 Add `src/routes/expired-page.ts` holding the plain "This link has expired" page and make `src/routes/redirect.ts` answer the `expired` reason with status 410 and that page; verify `src/app.test.ts` plants a link with `expires_at` in the past through the real service and gets 410, the words "expired" in the body and an unchanged click count, while an unknown code still gets 404

## 3. Home page and browser test

- [x] 3.1 Add an optional "Expires in (days)" number input (min 1, max 365) to the form in `public/index.html` and send it as `expiresInDays` from `public/app.js`, clearing it after a successful create; verify by creating a link with 30 days in the browser and seeing the API response carry `expiresAt`
- [x] 3.2 In `public/app.js` render an expired row with class `expired` and the text Expired in the clicks cell, keeping the Delete button, and add the greyed style in `public/style.css`; verify by loading the home page with an expired link in the database
- [x] 3.3 Point the Playwright server at a throwaway file database under `data/` in `playwright.config.ts`, deleting it before the run, and verify `npm run e2e` still passes the existing scenarios
- [x] 3.4 Add a scenario to `e2e/hop.spec.ts` that creates a link with an expiry, sets its expiry in the past through the links service on the shared database file, and checks the row is greyed with Expired, visiting the short link gives 410 with the expired page, and the link can still be deleted; verify `npm run e2e` passes

## 4. Final checks

- [x] 4.1 Run `npm run verify` and `npm run e2e` after the last edit and quote the exit codes; confirm every gate in DEFINITION_OF_DONE.md passes or is waived in writing, and that no environment variable was added that needs `.env.example`
