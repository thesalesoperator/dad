'use client';

import { useEffect } from 'react';
import { isNative, isAndroid } from '@/lib/native/platform';

/**
 * Initializes native Capacitor plugins on mount.
 * Safe to render on web — all native calls are guarded.
 */
export default function NativeInit() {
    useEffect(() => {
        if (!isNative()) return;

        async function init() {
            try {
                // Hide splash screen after app is ready
                const { SplashScreen } = await import('@capacitor/splash-screen');
                await SplashScreen.hide({ fadeOutDuration: 300 });

                // Configure status bar — light text on dark background
                const { StatusBar, Style } = await import('@capacitor/status-bar');
                await StatusBar.setStyle({ style: Style.Dark });
                await StatusBar.setBackgroundColor({ color: '#050508' });

                // Handle Android back button
                if (isAndroid()) {
                    const { App } = await import('@capacitor/app');
                    App.addListener('backButton', ({ canGoBack }) => {
                        if (canGoBack) {
                            window.history.back();
                        } else {
                            App.exitApp();
                        }
                    });
                }

                // Configure keyboard behaviour
                const { Keyboard } = await import('@capacitor/keyboard');
                Keyboard.addListener('keyboardWillShow', () => {
                    document.body.classList.add('keyboard-open');
                });
                Keyboard.addListener('keyboardWillHide', () => {
                    document.body.classList.remove('keyboard-open');
                });
            } catch (e) {
                console.warn('NativeInit: plugin init failed', e);
            }
        }

        init();
    }, []);

    // This component renders nothing — it's purely for side effects
    return null;
}
