import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Drop-in replacement for React Native's Alert.alert with the same signature.
 * react-native-web ships Alert.alert as a hard no-op (see
 * node_modules/react-native-web/src/exports/Alert), so every confirm/notice
 * dialog in the app would silently do nothing when run on web — including the
 * button's own onPress, since that only fires from inside the (never-shown)
 * dialog. This falls through to the browser's native confirm/alert on web,
 * which is unstyled but actually functions.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const list = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
  const fullMessage = [title, message].filter(Boolean).join('\n\n');

  if (list.length === 1) {
    window.alert(fullMessage);
    list[0].onPress?.();
    return;
  }

  const cancelButton = list.find((b) => b.style === 'cancel');
  const confirmButton = list.find((b) => b.style !== 'cancel') || list[list.length - 1];

  if (window.confirm(fullMessage)) {
    confirmButton.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
