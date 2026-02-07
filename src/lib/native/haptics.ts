import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './platform';

/**
 * Haptic feedback abstraction. No-ops gracefully on web.
 */
export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
    if (!isNative()) return;
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
    if (!isNative()) return;
    const map = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error };
    await Haptics.notification({ type: map[type] });
}

export async function hapticSelection() {
    if (!isNative()) return;
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
}
