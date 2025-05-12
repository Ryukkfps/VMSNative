import messaging from '@react-native-firebase/messaging';
import { Alert, Platform, Linking } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import PushNotification from 'react-native-push-notification';

export async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Notification permission granted.');
        await getFcmToken();
    } else {
        console.log('Notification permission denied');
        Alert.alert(
            'Permissions Required',
            'Push notifications are disabled. Please enable them in your device settings to receive important updates.',
            [
                {
                    text: 'Later',
                    style: 'cancel',
                },
                {
                    text: 'Open Settings',
                    onPress: () => {
                        // On Android, this opens app settings
                        if (Platform.OS === 'android') {
                            Linking.openSettings();
                        }
                    },
                },
            ]
        );
    }
}

export async function getFcmToken() {
    try {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error('Error getting FCM token:', error);
    }
}

export async function sendFcmTokenToBackend(userId) {
    try {
        console.log("Start sending FCM token...");
        const token = await messaging().getToken();
        
        if (token) {
            await axios.post(`${API_URL}/users/save-fcm-token`, {
                userId, 
                fcmToken: token
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            await AsyncStorage.setItem('fcmToken', token);
            console.log("FCM Token saved to backend & AsyncStorage.");
        }
    } catch (error) {
        console.error('Error sending FCM token to backend:', error);
    }
}

// Add this function to configure background notifications
export function configureNotifications() {
  // Configure local notifications
  PushNotification.configure({
    // (required) Called when a remote or local notification is opened or received
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);
    },
    // Should the initial notification be popped automatically
    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });

  // Create notification channel for Android
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'default-channel',
        channelName: 'Default Channel',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Channel created: ${created}`)
    );
  }

  // Set up background message handler
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
    
    // Display the notification using PushNotification
    PushNotification.localNotification({
      channelId: 'default-channel',
      title: remoteMessage.notification.title,
      message: remoteMessage.notification.body,
      playSound: true,
      soundName: 'default',
    });
  });
}
