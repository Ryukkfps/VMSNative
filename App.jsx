import { StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import messaging from '@react-native-firebase/messaging';
import { requestUserPermission } from './firebaseConfig';

const App = () => {
    useEffect(() => {
        // Request notification permission when the app starts
        requestUserPermission();

        // Handle foreground notifications
        const unsubscribe = messaging().onMessage(async remoteMessage => {
            Toast.show({
                type: 'info',
                text1: remoteMessage.notification.title,
                text2: remoteMessage.notification.body,
            });
        });

        return unsubscribe;
    }, []);

    return (
        <>
            <AppNavigator />
            <Toast />
        </>
    );
}

export default App;

const styles = StyleSheet.create({});
