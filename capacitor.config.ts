import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.dadgym.app',
    appName: 'DAD GYM',
    webDir: 'out',
    server: {
        // In production, load from the bundled files
        // For dev, you can uncomment below to use live reload:
        // url: 'http://YOUR_IP:3000',
        // cleartext: true,
    },
    plugins: {
        SplashScreen: {
            launchAutoHide: false, // We'll hide it manually after auth check
            backgroundColor: '#050508',
            showSpinner: false,
            androidScaleType: 'CENTER_CROP',
            splashFullScreen: true,
            splashImmersive: true,
        },
        StatusBar: {
            style: 'DARK', // Light text on dark background
            backgroundColor: '#050508',
        },
        Keyboard: {
            resize: 'body' as any,
            resizeOnFullScreen: true,
        },
    },
    ios: {
        contentInset: 'automatic',
        backgroundColor: '#050508',
        preferredContentMode: 'mobile',
    },
    android: {
        backgroundColor: '#050508',
        allowMixedContent: false,
    },
};

export default config;
