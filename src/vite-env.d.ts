/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Địa chỉ backend TokenScope. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
