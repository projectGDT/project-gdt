/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_TRPC_API_URL: string;
  VITE_TURNSTILE_SITE_KEY: string;
  VITE_XBOX_OAUTH_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
