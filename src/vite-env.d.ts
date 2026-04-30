/// <reference types="vite/client" />

// Stub declaration for @capacitor-community/admob so TypeScript is satisfied
// even before the package is installed via `npm install && npx cap sync`.
// All actual types are `any` — the runtime implementation guards with try/catch.
declare module '@capacitor-community/admob' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const AdMob: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const BannerAdSize: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const BannerAdPosition: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const AdMobRewardItem: any;
}

interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_ADSENSE_PUBLISHER_ID?: string;
  readonly VITE_ADSENSE_INTERSTITIAL_SLOT?: string;
  readonly VITE_ADSENSE_BANNER_SLOT?: string;
  readonly VITE_ADMOB_APP_ID_ANDROID?: string;
  readonly VITE_ADMOB_APP_ID_IOS?: string;
  readonly VITE_ADMOB_INTERSTITIAL_ID?: string;
  readonly VITE_ADMOB_REWARDED_ID?: string;
  readonly VITE_ADMOB_BANNER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
