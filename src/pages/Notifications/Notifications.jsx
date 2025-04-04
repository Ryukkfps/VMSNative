import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Foreground notification listener
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM Notification received in foreground:', remoteMessage);
      
      if (remoteMessage?.notification) {
        const newNotification = {
          id: remoteMessage.messageId || Date.now().toString(),
          title: remoteMessage.notification.title || 'New Notification',
          body: remoteMessage.notification.body || '',
          type: remoteMessage.data?.type || 'request',
          userId: remoteMessage.data?.userId || 'Unknown',
          status: remoteMessage.data?.status || 'Pending',
        };

        setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
      }
    });

    // Handle notifications when the app is opened from a background state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification opened from quit state:', remoteMessage);
          Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body);
        }
      });

    return () => unsubscribe();
  }, []);

  const renderNotification = ({ item }) => {
    return (
      <View style={styles.notification}>
        <Text style={styles.title}>{item.title}</Text>
        <Text>{item.body}</Text>
        <Text>{item.type === 'request' ? `User ID: ${item.userId}` : `Status: ${item.status}`}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notification: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Notifications;
