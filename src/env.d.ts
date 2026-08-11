/// <reference types="astro/client" />

import type { JbUser } from './lib/auth';

interface ImportMetaEnv {
  readonly SIMULATE_ZEPHR?: string;
  readonly ZEPHR_COMPONENTS_URL?: string;
  readonly JB_URL?: string;
  readonly AUTH_DISABLED?: string;
  readonly DATABASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    /** The signed-in JournalistBoost user. Always set — the login middleware
     *  redirects anyone without a valid session before a page renders. */
    user: JbUser;
  }
}
