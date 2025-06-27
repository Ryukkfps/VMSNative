import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator} from 'react-native';
import axios from 'axios';
import {API_URL} from '@env';
import {jwtDecode} from 'jwt-decode';
import {getToken, getUserRole} from '../../utils/dbStore';
import {useNavigation} from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faArrowLeft, faCheckCircle, faTimesCircle, faClock, faBell} from '@fortawesome/free-solid-svg-icons';

const Notifications = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleGoBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FontAwesomeIcon icon={faCheckCircle} size={20} color="#28a745" />;
      case 'denied':
        return <FontAwesomeIcon icon={faTimesCircle} size={20} color="#dc3545" />;
      case 'pending':
        return <FontAwesomeIcon icon={faClock} size={20} color="#ffc107" />;
      default:
        return <FontAwesomeIcon icon={faBell} size={20} color="#6c757d" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const renderNotification = ({item}) => {
    return (
      <View style={[
        styles.notificationCard,
        !item.isViewed && styles.unviewedNotification
      ]}>
        <View style={styles.notificationHeader}>
          <View style={styles.statusIconContainer}>
            {getStatusIcon(item.status)}
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.notificationTitle}>{item.NotificationTitle}</Text>
            <Text style={styles.timeStamp}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.notificationBody}>{item.NotificationBody}</Text>

        {item.requestType === 'permitRequest' && item.status === 'pending' && userRole !== 'Guard' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item._id, item.requestId)}
              activeOpacity={0.8}>
              <FontAwesomeIcon icon={faCheckCircle} size={16} color="#ffffff" />
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.denyButton]}
              onPress={() => handleDeny(item._id, item.requestId)}
              activeOpacity={0.8}>
              <FontAwesomeIcon icon={faTimesCircle} size={16} color="#ffffff" />
              <Text style={styles.buttonText}>Deny</Text>
            </TouchableOpacity>
          </View>
        )}

        {(item.status === 'approved' || item.status === 'denied') && (
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              item.status === 'approved' ? styles.approvedBadge : styles.deniedBadge
            ]}>
              {getStatusIcon(item.status)}
              <Text style={[
                styles.statusText,
                item.status === 'approved' ? styles.approvedText : styles.deniedText
              ]}>
                {item.status === 'approved' ? 'Approved' : 'Denied'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesomeIcon icon={faBell} size={64} color="#e9ecef" />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateText}>You're all caught up! No new notifications at this time.</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#e9ecef',
  },
  unviewedNotification: {
    borderLeftColor: '#007AFF',
    backgroundColor: '#f8f9ff',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  headerContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timeStamp: {
    fontSize: 12,
    color: '#6c757d',
  },
  notificationBody: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  denyButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  approvedBadge: {
    backgroundColor: '#d4edda',
  },
  deniedBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  approvedText: {
    color: '#28a745',
  },
  deniedText: {
    color: '#dc3545',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Notifications;


