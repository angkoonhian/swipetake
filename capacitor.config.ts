import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coolideas.swipetake',
  appName: 'SwipeTake',
  webDir: 'dist',
  plugins: {
    AdMob: {
      appId: process.env.VITE_ADMOB_APP_ID_ANDROID || 'ca-app-pub-3940256099942544~3347511713',
      initializeForTesting: true,
    },
  },
};

export default config;
