import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, FlatList, TouchableOpacity} from 'react-native';
import axios from 'axios';
import {API_URL} from '@env';
import {jwtDecode} from 'jwt-decode';
import {getToken, getUserRole} from '../../utils/dbStore';
// Optionally import a date formatting library
// import { format } from 'date-fns';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const decodedToken = jwtDecode(token);
        const user = decodedToken.userId;
        const role = await getUserRole();
        setUserRole(role);

        const response = await axios.get(
          `${API_URL}/notifications/user/${user}`,
        );
        // Sort notifications by creation time, newest first
        const sortedNotifications = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sortedNotifications);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (notificationId, permitId) => {
    try {
      const token = await getToken();
      // Update permit request status
      await axios.patch(
        `${API_URL}/permit-requests/${permitId}`,
        { status: 'approved' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      
      // Update notification status
      await axios.patch(
        `${API_URL}/notifications/status`,
        { id: notificationId, status: 'approved' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      
      // Update notification status in UI
      setNotifications(
        notifications.map(item =>
          item._id === notificationId
            ? {...item, status: 'approved'}
            : item
        ),
      );
    } catch (error) {
      console.error('Error approving permit:', error);
    }
  };

  const handleDeny = async (notificationId, permitId) => {
    try {
      const token = await getToken();
      await axios.patch(
        `${API_URL}/permit-requests/${permitId}`,
        { status: 'rejected' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await axios.patch(
        `${API_URL}/notifications/status`,
        { id: notificationId, status: 'denied' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // Update notification status in UI
      setNotifications(
        notifications.map(item =>
          item._id === notificationId
            ? {...item, status: 'denied'}
            : item
        ),
      );
    } catch (error) {
      console.error('Error denying permit:', error);
    }
  };

  const renderNotification = ({item}) => {
    return (
      <View style={[
        styles.notification, 
        !item.isViewed && styles.unviewedNotification
      ]}>
        <Text style={styles.title}>{item.NotificationTitle}</Text>
        <Text>{item.NotificationBody}</Text>
        {/* Optionally format the date */}
        {/* <Text>{format(new Date(item.createdAt), 'PPpp')}</Text> */}
        
        {item.requestType === 'permitRequest' && item.status === 'pending' && userRole !== 'Guard' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item._id, item.requestId)}>
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.denyButton]}
              onPress={() => handleDeny(item._id, item.requestId)}>
              <Text style={styles.buttonText}>Deny</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {(item.status === 'approved' || item.status === 'denied') && (
          <Text style={[
            styles.statusText,
            item.status === 'approved' ? styles.approvedText : styles.deniedText
          ]}>
            {item.status === 'approved' ? 'Approved' : 'Denied'}
          </Text>
        )}
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
  unviewedNotification: {
    backgroundColor: '#e6f7ff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  denyButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 8,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  approvedText: {
    color: '#4CAF50',
  },
  deniedText: {
    color: '#F44336',
  },
});

export default Notifications;


