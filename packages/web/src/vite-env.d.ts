/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_TRPC_API_URL: string;
  VITE_TURNSTILE_SITE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
