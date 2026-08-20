/// <reference types="astro/client" />

import type { JbUser } from './lib/auth';

// No `ImportMetaEnv` declarations here on purpose. Typing these as
// `import.meta.env.*` would advertise them as build-time values — the exact
// thing this template avoids. They are declared once, as runtime values, in
// `astro.config.mjs`'s env schema, and imported from `astro:env/server`.

// `declare global` because this file has a top-level import, which makes it a
// MODULE — a bare `declare namespace App` would be scoped to this file and
// augment nothing, leaving `Astro.locals.user` untyped. It was written that way,
// and `pnpm check` had been failing on it.
declare global {
  namespace App {
    interface Locals {
      /** The signed-in JournalistBoost user.
       *  Set only when AUTH_MODE=jb. Undefined for FA apps (AUTH_MODE=zephr),
       *  where readers are gated by Zephr at the edge and have no JB session,
       *  and locally with AUTH_DISABLED=true. Always guard before using it. */
      user?: JbUser;
    }
  }
}
