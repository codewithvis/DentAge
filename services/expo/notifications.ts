import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;

// Wrap in try-catch to prevent crash if notifications module is not fully ready in Expo Go
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('Failed to set notification handler:', e);
  }
}

/**
 * Requests permissions for local notifications.
 */
export async function requestNotificationPermissions() {
  if (isExpoGo || !Notifications) {
    console.warn('Notifications not supported in Expo Go.');
    return false;
  }
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Notification permissions error:', e);
    return false;
  }
}

/**
 * Sends a local notification.
 */
export async function sendLocalNotification(title: string, body: string) {
  if (isExpoGo || !Notifications) return;
  
  try {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
    }
  } catch (e) {
    console.warn('Failed to send notification:', e);
  }
}
