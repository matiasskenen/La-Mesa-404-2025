import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.usuario.mesa404',
  appName: 'Mesa404',
  webDir: 'www',
  plugins: {
    StatusBar: {
      overlaysWebView: false, // ✅ nombre correcto de la propiedad
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    CapacitorHttp:{
      enabled: true
    },
  },
};

export default config;
