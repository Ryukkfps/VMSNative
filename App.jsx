import {StyleSheet, Platform, PermissionsAndroid} from 'react-native';
import React, {useEffect} from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';
import messaging from '@react-native-firebase/messaging';
import {requestUserPermission, configureNotifications} from './firebaseConfig';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

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
  useEffect(() => {
    // Request notification permission when the app starts
    requestUserPermission();
    // Configure notifications for background/killed state
    configureNotifications();

    // Request gallery and contacts permissions
    requestGalleryPermission();
    requestContactsPermission();

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
};

export default App;

const styles = StyleSheet.create({});


