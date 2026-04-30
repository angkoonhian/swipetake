/// <reference types="vite/client" />

declare module '@capacitor-community/admob' {
  export const AdMob: any;
  export const BannerAdSize: any;
  export const BannerAdPosition: any;
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
