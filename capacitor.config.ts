import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studyquest.app',
  appName: 'StudyQuest',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#020611',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#020611',
  },
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
