import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  StyleSheet,
  RefreshControl,
  Modal,
  Dimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFallback from '../../components/IconFallback';
import dmApi from './dmApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import { getToken } from '../../utils/dbStore';
import { initSocket, onNewMessage, onUserOnlineStatus } from './socket';

const { width } = Dimensions.get('window');

const ContactListScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const navigation = useNavigation();

  const fetchUsers = useCallback(async () => {
    let isActive = true;
    setUsersLoading(true);
    setError(null);
    try {
      const Home = await AsyncStorage.getItem('selectedHomeObject');
      const parsedHome = JSON.parse(Home);
      const societyId = parsedHome.SId._id;
      const res = await dmApi.getSocietyUsers(societyId);
      if (isActive) {
        setUsers(res);
        setFilteredUsers(res);
      }
    } catch (err) {
      if (isActive) setError('Could not load society members.');
    } finally {
      if (isActive) setUsersLoading(false);
    }
    return () => { isActive = false; };
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await dmApi.getRooms();
      setRooms(res);
      setFilteredRooms(res);
      if (res.length === 0) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error fetching DM rooms:', err);
      setError('Could not load contacts.');
    }
  }, [fetchUsers]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);
      setError(null);
      
      fetchRooms()
        .finally(() => isActive && setLoading(false));
      
      return () => { isActive = false; };
    }, [fetchRooms])
  );

  // Setup socket listeners
  useEffect(() => {
    const setupSocket = async () => {
      await initSocket();
      
      // Listen for new messages to update room list
      onNewMessage((message) => {
        setRooms(prevRooms => 
          prevRooms.map(room => 
            room.id === message.room_id 
              ? { 
                  ...room, 
                  last_msg: message.text, 
                  last_msg_time: message.created_at,
                  unread: room.unread + 1
                }
              : room
          )
        );
      });
      
      // Listen for online status updates
      onUserOnlineStatus((statusInfo) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (statusInfo.isOnline) {
            newSet.add(statusInfo.userId);
          } else {
            newSet.delete(statusInfo.userId);
          }
          return newSet;
        });
      });
    };
    
    setupSocket();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRooms(rooms);
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRooms(rooms.filter(room => 
        room.other.name?.toLowerCase().includes(query) || 
        room.last_msg?.toLowerCase().includes(query)
      ));
      setFilteredUsers(users.filter(user => 
        user.Name?.toLowerCase().includes(query) || 
        user.Email?.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, rooms, users]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  }, [fetchRooms]);

  const startChatWithUser = async (otherUser) => {
    try {
      console.log('Starting chat with user:', otherUser._id);
      const token = await getToken();
      const res = await axios.post(`${API_URL}/dm/rooms/create`, {
        otherUserId: otherUser._id,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const room = res.data;
      setShowNewChat(false);

      navigation.navigate('ChatScreen', {
        roomId: room._id,
        other: {
          _id: otherUser._id,
          name: otherUser.Name,
          avatar: otherUser.avatar,
        },
      });
    } catch (err) {
      console.error('Error creating chat room:', err);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };

  const handleRoomLongPress = (room) => {
    Alert.alert(
      'Room Options',
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: () => archiveRoom(room.id)
        },
        {
          text: 'Mute',
          onPress: () => muteRoom(room.id)
        },
      ]
    );
  };

  const archiveRoom = async (roomId) => {
    try {
      await dmApi.archiveRoom(roomId);
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      Alert.alert('Success', 'Chat archived successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to archive chat');
    }
  };

  const muteRoom = async (roomId) => {
    try {
      await dmApi.muteRoom(roomId);
      Alert.alert('Success', 'Chat muted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to mute chat');
    }
  };

  const renderUser = ({ item }) => {
    const isOnline = onlineUsers.has(item._id);
    
    return (
      <TouchableOpacity
        onPress={() => startChatWithUser(item)}
        style={styles.userItem}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.avatar || 'https://via.placeholder.com/48' }} 
            style={styles.avatar} 
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.Name}</Text>
          <Text style={styles.userEmail}>{item.Email}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRoom = ({ item }) => {
    const isOnline = onlineUsers.has(item.other._id);
    const lastMsgTime = item.last_msg_time ? new Date(item.last_msg_time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }) : '';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ChatScreen', { roomId: item.id, other: item.other })}
        onLongPress={() => handleRoomLongPress(item)}
        style={styles.roomItem}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.other.avatar || 'https://via.placeholder.com/48' }} 
            style={styles.avatar} 
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.roomInfo}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomName}>{item.other.name}</Text>
            <Text style={styles.lastMsgTime}>{lastMsgTime}</Text>
          </View>
          <View style={styles.roomFooter}>
            <Text numberOfLines={1} style={styles.lastMsg}>
              {item.last_msg || 'No messages yet'}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNewChatModal = () => (
    <Modal
      visible={showNewChat}
      animationType="slide"
      onRequestClose={() => setShowNewChat(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowNewChat(false)}>
            <IconFallback name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Chat</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.searchContainer}>
          <IconFallback name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {usersLoading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#007bff" />
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item._id}
            renderItem={renderUser}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.usersList}
          />
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  if (error) {
    return (
        <View style={styles.errorContainer}>
          <IconFallback name="error" size={48} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRooms}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => setShowNewChat(true)}
        >
          <IconFallback name="add" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconFallback name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Rooms List */}
      {filteredRooms.length > 0 ? (
        <FlatList
          data={filteredRooms}
          keyExtractor={item => item.id}
          renderItem={renderRoom}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.roomsList}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item._id}
          renderItem={renderUser}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.roomsList}
        />
      )}

      {/* New Chat Modal */}
      {renderNewChatModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  newChatButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  roomsList: {
    paddingBottom: 16,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  roomInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  lastMsgTime: {
    fontSize: 12,
    color: '#666',
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMsg: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 76,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  startChatButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  startChatText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  usersList: {
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContactListScreen;
