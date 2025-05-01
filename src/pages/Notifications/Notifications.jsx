import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, FlatList} from 'react-native';
import axios from 'axios';
import {API_URL} from '@env';
import {jwtDecode} from 'jwt-decode';
import {getToken} from '../../utils/dbStore';
// Optionally import a date formatting library
// import { format } from 'date-fns';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await getToken();
        const decodedToken = jwtDecode(token);
        const user = decodedToken.userId;

        const response = await axios.get(
          `${API_URL}/notifications/user/${user}`,
        );
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Fetch notifications when the component mounts
    fetchNotifications();
  }, []);

  const renderNotification = ({item}) => {
    return (
      <View style={styles.notification}>
        <Text style={styles.title}>{item.NotificationTitle}</Text>
        <Text>{item.NotificationBody}</Text>
        {/* Optionally format the date */}
        {/* <Text>{format(new Date(item.createdAt), 'PPpp')}</Text> */}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
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
