---
name: beacon-signing
description: Preserve signing bytes and legacy request compatibility when changing Beacon signing response metadata.
---

# Beacon signing

Beacon's SDK contract expects signingType in responses to explicit-mode requests. Temple also accepts older requests without a mode. Preserve their existing response shape and payload path unless a separate behavior change is intended.

RAW request preparation changes payload bytes; omitted mode currently does not. A metadata-only fix must not default omitted mode to RAW, infer a mode from bytes, or alter payload validation.

Keep the response envelope typed. The mapper test exercises metadata and codec round trips; it does not prove signing cryptography. Run `yarn test src/lib/temple/beacon-sign-response.test.ts src/lib/temple/beacon.test.ts --runInBand` and `yarn ts`. Browser verification must independently check the signature against the original requested bytes.
