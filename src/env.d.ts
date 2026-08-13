/// <reference types="astro/client" />

import type { JbUser } from './lib/auth';

interface ImportMetaEnv {
  readonly SIMULATE_ZEPHR?: string;
  readonly ZEPHR_COMPONENTS_URL?: string;
  readonly JB_URL?: string;
  readonly AUTH_MODE?: string;
  readonly AUTH_DISABLED?: string;
  readonly DATABASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    /** The signed-in JournalistBoost user.
     *  Set only when AUTH_MODE=jb. Undefined for FA apps (AUTH_MODE=zephr),
     *  where readers are gated by Zephr at the edge and have no JB session,
     *  and locally with AUTH_DISABLED=1. Always guard before using it. */
    user?: JbUser;
  }
}
