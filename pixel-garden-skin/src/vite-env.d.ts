/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_MUX_PLAYBACK_ID?: string;
  readonly VITE_MUX_TOKEN_ID?: string;
  readonly VITE_MUX_TOKEN_SECRET?: string;
  readonly VITE_MUX_API_BASE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
