import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import io from 'socket.io-client';
import {SERVER_URL} from '@env'

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Connect to the Socket.IO server
    const socket = io(`${SERVER_URL}`); // Replace with your server's IP address

    // Listen for entry requests
    socket.on('entryRequest', (data) => {
      console.log('Entry request received:', data);
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        { type: 'request', ...data },
      ]);
    });

    // Listen for entry responses
    socket.on('entryResponse', (data) => {
      console.log('Entry response received:', data);
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        { type: 'response', ...data },
      ]);
    });

    // Clean up the effect
    return () => {
      socket.disconnect();
    };
  }, []);

  const renderNotification = ({ item }) => {
    return (
      <View style={styles.notification}>
        <Text>{item.type === 'request' ? 'Entry Request' : 'Entry Response'}</Text>
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
        keyExtractor={(item, index) => index.toString()}
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
    marginBottom: 16,
  },
  notification: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default Notifications;
