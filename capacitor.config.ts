import type { CapacitorConfig } from '@capacitor/cli';

// AdMob app IDs — replace with your real IDs from https://admob.google.com
// These are Google's official test app IDs (safe to use during development)
const ADMOB_APP_ID_ANDROID =
  process.env.VITE_ADMOB_APP_ID_ANDROID ?? 'ca-app-pub-3940256099942544~3347511713';
const ADMOB_APP_ID_IOS =
  process.env.VITE_ADMOB_APP_ID_IOS ?? 'ca-app-pub-3940256099942544~1458002511';

const config: CapacitorConfig = {
  appId: 'com.swipetake.app',
  appName: 'SwipeTake',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Haptics: {},
    AdMob: {
      // App IDs are required in the native manifest files as well:
      //   Android: android/app/src/main/AndroidManifest.xml
      //     <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
      //                android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
      //   iOS: ios/App/App/Info.plist
      //     <key>GADApplicationIdentifier</key>
      //     <string>ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ</string>
      appIdAndroid: ADMOB_APP_ID_ANDROID,
      appIdIos: ADMOB_APP_ID_IOS,
      // Set to false in production to stop Google test ads
      initializeForTesting: true,
      testingDevices: [],
    },
  },
};

export default config;
