---
name: referral-startup
description: Check session readiness, referral API calls and payout indicators when changing conversion initialization or rewards loading.
---

# Referral startup

Read `src/app/hooks/use-conversion-verification.ts` and its tests before changing initialization.

The shared SWR query coordinates page bootstrap. A persisted registration flag does not prove the browser has a valid cookie. Validate the account endpoint, and validate it again after registration before publishing readiness. Recover only recognized missing-session errors. Rate limits and service failures must remain failures.

Readiness is cached within a window. It does not guarantee authentication after cookies change later. Failed initialization currently requires a window reload. A broader recovery change needs cached-remount and explicit-retry tests.

Keep payout and update checks independent of session readiness. Preserve the original payout scan window while the authenticated referral check is pending. There is no new persisted badge field or migration in this fix.

Run `yarn test src/app/hooks/use-conversion-verification.test.tsx --runInBand` and `yarn ts`. Browser verification needs a separately identified source-built artifact and valid build configuration; do not overwrite the pinned public wallet archive.
