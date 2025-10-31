/// <reference types="vite/client" />

// Leaflet image assets
declare module "leaflet/dist/images/marker-icon.png" {
  const src: string;
  export default src;
}

declare module "leaflet/dist/images/marker-icon-2x.png" {
  const src: string;
  export default src;
}

declare module "leaflet/dist/images/marker-shadow.png" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
