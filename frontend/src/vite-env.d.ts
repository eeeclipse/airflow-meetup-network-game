/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_TEST_MODE?: string;
  readonly VITE_EVENT_ID?: string;
  readonly VITE_ORG_PIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
