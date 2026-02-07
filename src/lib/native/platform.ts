import { Capacitor } from '@capacitor/core';

/** True when running inside a native iOS/Android shell */
export function isNative(): boolean {
    return Capacitor.isNativePlatform();
}

export function isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
}

export function isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
}

export function isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
}
