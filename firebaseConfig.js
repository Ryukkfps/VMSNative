import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
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
        Alert.alert('Permissions Denied', 'Please enable push notifications.');
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
