---
name: SOLOS+ ESPORTZ auth pattern
description: Username-based auth bypass for gaming clan app — generated Zod/OpenAPI types use email, but runtime and backend use username.
---

Auth uses username (not email) despite the OpenAPI spec and generated types defining email-based auth.

**Why:** Gaming clan apps use in-game names, not emails. The generated `LoginInput` / `RegisterInput` types have `email` field, but backend routes were rewritten to use username.

**How to apply:**
- Backend `auth.ts` uses inline Zod schemas (`LoginInput = { username, password }`) instead of generated `@workspace/api-zod` schemas.
- Frontend `auth.tsx` uses `as any` cast when calling `login.mutate()` and `register.mutate()` to bypass the TypeScript `LoginInput` / `RegisterInput` type mismatch.
- DB schema has `email` and `whatsapp` as nullable (`text("email").unique()` without `.notNull()`).
- `UserUpdate` (generated) does NOT include `email` — profile editing is limited to `avatarUrl`, `bio`, social links.
- The `CO_LEADER` and `MANAGEMENT` roles exist in the DB/backend but NOT in the generated `User.role` enum — use `as string[]` includes check for role comparisons in the frontend.
