/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SIMULATE_ZEPHR?: string;
  readonly ZEPHR_COMPONENTS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
