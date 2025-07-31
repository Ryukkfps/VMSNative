import {StyleSheet, Platform, PermissionsAndroid} from 'react-native';
import React, {useEffect, useRef} from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import messaging from '@react-native-firebase/messaging';
import {requestUserPermission, configureNotifications} from './firebaseConfig';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const requestGalleryPermission = async () => {
  if (Platform.OS === 'android') {
    await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
    await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
  } else {
    await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
  }
};

const requestContactsPermission = async () => {
  if (Platform.OS === 'android') {
    await request(PERMISSIONS.ANDROID.READ_CONTACTS);
  } else {
    await request(PERMISSIONS.IOS.CONTACTS);
  }
};

const App = () => {
  const navigationRef = useRef();

  useEffect(() => {
    // Request notification permission when the app starts
    requestUserPermission();
    // Configure notifications for background/killed state with navigation ref
    configureNotifications(navigationRef);

    // Request gallery and contacts permissions
    requestGalleryPermission();
    requestContactsPermission();

    // Handle foreground notifications
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      
      // For DM messages, show different toast or navigate directly
      if (remoteMessage.data?.type === 'dm_message') {
        Toast.show({
          type: 'info',
          text1: remoteMessage.notification.title,
          text2: remoteMessage.notification.body,
          onPress: () => {
            // Navigate to chat when toast is pressed
            if (navigationRef.current && remoteMessage.data?.roomId) {
              navigationRef.current.navigate('ChatScreen', {
                roomId: remoteMessage.data.roomId,
                other: {
                  _id: remoteMessage.data.senderId,
                  name: 'Chat',
                }
              });
            }
            Toast.hide();
          }
        });
      } else {
        // Default notification handling
        Toast.show({
          type: 'info',
          text1: remoteMessage.notification.title,
          text2: remoteMessage.notification.body,
        });
      }
    });

    // Handle notification opened app (from killed state)
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage && remoteMessage.data?.type === 'dm_message') {
        console.log('App opened from notification:', remoteMessage);
        // Navigate to chat after app loads
        setTimeout(() => {
          if (navigationRef.current && remoteMessage.data?.roomId) {
            navigationRef.current.navigate('ChatScreen', {
              roomId: remoteMessage.data.roomId,
              other: {
                _id: remoteMessage.data.senderId,
                name: 'Chat',
              }
            });
          }
        }, 1000); // Wait for navigation to be ready
      }
    });

    // Handle notification opened app (from background state)
    const unsubscribeNotificationOpen = messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage && remoteMessage.data?.type === 'dm_message') {
        console.log('App opened from background notification:', remoteMessage);
        if (navigationRef.current && remoteMessage.data?.roomId) {
          navigationRef.current.navigate('ChatScreen', {
            roomId: remoteMessage.data.roomId,
            other: {
              _id: remoteMessage.data.senderId,
              name: 'Chat',
            }
          });
        }
      }
    });

    return () => {
      unsubscribe();
      unsubscribeNotificationOpen();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator navigationRef={navigationRef} />
      <Toast />
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({});


