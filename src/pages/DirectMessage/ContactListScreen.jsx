import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, StyleSheet, RefreshControl, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import dmApi from './dmApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../../utils/dbStore';
import { initSocket } from './socket';
import {API_URL} from '@env';
import { jwtDecode } from 'jwt-decode';

// Custom Avatar Component with fallback
const Avatar = ({ uri, name, size = 48, showOnline = false, isOnline = false }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarUri = () => {
    if (!uri || imageError) return null;
    if (uri.startsWith('http')) return uri;
    return `${API_URL}${uri.startsWith('/') ? uri : '/' + uri}`;
  };

  const avatarUri = getAvatarUri();

  return (
    <View style={[styles.avatarContainer, { width: size, height: size }]}>
      {avatarUri && !imageError ? (
        <>
          {loading && (
            <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
              <ActivityIndicator size="small" color="#007bff" />
            </View>
          )}
          <Image
            source={{ uri: avatarUri }}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
            onError={() => setImageError(true)}
            onLoad={() => setLoading(false)}
            onLoadStart={() => setLoading(true)}
          />
        </>
      ) : (
        <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.avatarInitials, { fontSize: size * 0.4 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      {showOnline && (
        <View style={[styles.onlineIndicator, { 
          bottom: size * 0.05, 
          right: size * 0.05,
          width: size * 0.25,
          height: size * 0.25,
          borderRadius: size * 0.125,
          backgroundColor: isOnline ? '#4CAF50' : '#9e9e9e'
        }]} />
      )}
    </View>
  );
};

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

  const SERVER_URL = API_URL;
  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dmApi.getRooms();
      setRooms(res);
      setFilteredRooms(res);
      if (res.length === 0) fetchUsers();
    } catch (err) {
      setError('Could not load contacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users for new chat
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setError(null);
    try {
      const Home = await AsyncStorage.getItem('selectedHomeObject');
      const parsedHome = JSON.parse(Home);
      const societyId = parsedHome.SId._id;
      const res = await dmApi.getSocietyUsers(societyId);
      setUsers(res);
      setFilteredUsers(res);
    } catch (err) {
      setError('Could not load society members.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Initial load and refresh - also refreshes when returning from chat
  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, [fetchRooms])
  );

  // Join all DM rooms for live updates
  useEffect(() => {
    let socket;
    let joinedRooms = [];
    (async () => {
      socket = await initSocket();
      if (!socket) return;
      // Join all rooms after rooms are fetched
      rooms.forEach(room => {
        if (room.id) {
          socket.emit('joinRoom', room.id);
          joinedRooms.push(room.id);
        }
      });
    })();
    return () => {
      if (socket && joinedRooms.length > 0) {
        joinedRooms.forEach(roomId => socket.emit('leaveRoom', roomId));
      }
    };
  }, [rooms]);

  // Setup socket listeners for new messages and online status
  useEffect(() => {
    let socket;
    (async () => {
      socket = await initSocket();
      
      // Get current user ID for message filtering
      const token = await getToken();
      let currentUserId = null;
      if (token) {
        try {
          const decoded = jwtDecode(token);
          currentUserId = decoded.userId;
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }

      socket.on('newMessage', (message) => {
        const updateRoom = (room) => 
          room.id === message.room_id
            ? {
                ...room,
                last_msg: message.text,
                last_msg_time: message.created_at,
                // Only increment unread count if message is from another user
                unread: message.sender_id === currentUserId 
                  ? (room.unread || 0) 
                  : (room.unread || 0) + 1
              }
            : room;

        setRooms(prevRooms => prevRooms.map(updateRoom));
        setFilteredRooms(prevRooms => prevRooms.map(updateRoom));
      });
      socket.on('userOnlineStatus', (statusInfo) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (statusInfo.isOnline) newSet.add(statusInfo.userId);
          else newSet.delete(statusInfo.userId);
          return newSet;
        });
      });
    })();
    return () => {
      if (socket) {
        socket.off('newMessage');
        socket.off('userOnlineStatus');
      }
    };
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRooms(rooms);
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRooms(rooms.filter(room =>
        room.other.name?.toLowerCase().includes(query) ||
        room.last_msg?.toLowerCase().includes(query)
      ));
      setFilteredUsers(users.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      ));
    }
  }, [searchQuery, rooms, users]);

  // Mark room as read
  const markRoomAsRead = async (roomId) => {
    try {
      await dmApi.markAsRead(roomId);
      // Update local state to remove unread count
      const updateRoom = (room) => 
        room.id === roomId ? { ...room, unread: 0 } : room;
      
      setRooms(prevRooms => prevRooms.map(updateRoom));
      setFilteredRooms(prevRooms => prevRooms.map(updateRoom));
    } catch (err) {
      console.error('Failed to mark room as read:', err);
      // If API call fails, we should still keep the optimistic update
      // since the user has already seen the messages
    }
  };

  // Navigate to chat room and mark as read
  const navigateToChatRoom = async (roomId, other) => {
    // Mark as read immediately for instant UI feedback
    const updateRoom = (room) => 
      room.id === roomId ? { ...room, unread: 0 } : room;
    
    setRooms(prevRooms => prevRooms.map(updateRoom));
    setFilteredRooms(prevRooms => prevRooms.map(updateRoom));

    // Navigate to chat
    navigation.navigate('ChatScreen', { roomId, other });

    // Mark as read on backend (this will also update state, but that's okay)
    await markRoomAsRead(roomId);
  };

  // Start chat with a user
  const startChatWithUser = async (otherUser) => {
    try {
      setLoading(true);
      const room = await dmApi.startChat(otherUser._id);
      setShowNewChat(false);
      navigation.navigate('ChatScreen', { roomId: room.id, other: room.other });
    } catch (err) {
      Alert.alert('Error', 'Could not start chat');
    } finally {
      setLoading(false);
    }
  };

  // Format time helper
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Render a DM room
  const renderRoom = ({ item }) => {
    const isOnline = onlineUsers.has(item.other._id);
    return (
      <TouchableOpacity
        style={styles.roomItem}
        onPress={() => navigateToChatRoom(item.id, item.other)}
        activeOpacity={0.7}
      >
        <Avatar 
          uri={item.other.avatar} 
          name={item.other.name} 
          size={56} 
          showOnline={true}
          isOnline={isOnline}
        />
        <View style={styles.roomInfo}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomName} numberOfLines={1}>{item.other.name}</Text>
            <Text style={styles.lastMsgTime}>{formatTime(item.last_msg_time)}</Text>
          </View>
          <View style={styles.roomFooter}>
            <Text style={[styles.lastMsg, item.unread > 0 && styles.unreadLastMsg]} numberOfLines={1}>
              {item.last_msg || 'No messages yet'}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread > 99 ? '99+' : item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render user for new chat
  const renderUser = ({ item }) => {
    const isOnline = onlineUsers.has(item._id);
    return (
      <TouchableOpacity 
        style={styles.userItem} 
        onPress={() => startChatWithUser(item)}
        activeOpacity={0.7}
      >
        <Avatar 
          uri={item.avatar} 
          name={item.Name} 
          size={48} 
          showOnline={true}
          isOnline={isOnline}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{item.Name}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>{item.Email}</Text>
          {item.Phone && (
            <Text style={styles.userPhone} numberOfLines={1}>{item.Phone}</Text>
          )}
        </View>
        <View style={styles.userActions}>
          <View style={styles.chatButton}>
            <Text style={styles.chatButtonText}>Chat</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity 
          style={styles.newChatButton} 
          onPress={() => { fetchUsers(); setShowNewChat(true); }}
          activeOpacity={0.8}
        >
          <Text style={styles.newChatButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#007bff" /></View>
      ) : error ? (
        <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View>
      ) : (
        rooms.length === 0 ? (
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item._id}
            renderItem={renderUser}
            refreshControl={
              <RefreshControl refreshing={usersLoading} onRefresh={fetchUsers} />
            }
            ListEmptyComponent={
              usersLoading ? (
                <ActivityIndicator style={{ marginTop: 32 }} />
              ) : (
                <Text style={styles.emptyText}>No users found</Text>
              )
            }
          />
        ) : (
          <FlatList
            data={filteredRooms}
            keyExtractor={item => item.id}
            renderItem={renderRoom}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={fetchRooms} />
            }
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator style={{ marginTop: 32 }} />
              ) : (
                <Text style={styles.emptyText}>No chats found</Text>
              )
            }
          />
        )
      )}
      <Modal visible={showNewChat} animationType="slide" onRequestClose={() => setShowNewChat(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Start New Chat</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setShowNewChat(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.newChatButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {usersLoading ? (
            <View style={styles.loader}><ActivityIndicator size="large" color="#007bff" /></View>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUser}
              keyExtractor={item => item._id}
              contentContainerStyle={styles.usersList}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Avatar Component Styles
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007bff',
  },
  avatarInitials: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#fff',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007bff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  newChatButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  newChatButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderColor: '#e0e0e0',
    marginHorizontal: 12,
    marginVertical: 6,
    elevation: 1,
    
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    borderRadius: 20,
  },
  
  // Room Item Styles
  roomsList: {
    paddingBottom: 16,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomInfo: {
    flex: 1,
    marginLeft: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  lastMsgTime: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
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
  unreadLastMsg: {
    color: '#333',
    fontWeight: '500',
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
  
  // User Item Styles
  usersList: {
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: '#999',
  },
  userActions: {
    marginLeft: 12,
  },
  chatButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007bff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  
  // State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
});

export default ContactListScreen;