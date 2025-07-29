import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, StyleSheet, RefreshControl, Modal } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import dmApi from './dmApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../../utils/dbStore';
import { initSocket } from './socket';
import {API_URL} from '@env';

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

  // Initial load and refresh
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
      socket.on('newMessage', (message) => {
        setRooms(prevRooms =>
          prevRooms.map(room =>
            room.id === message.room_id
              ? {
                  ...room,
                  last_msg: message.text,
                  last_msg_time: message.created_at,
                  unread: (room.unread || 0) + 1
                }
              : room
          )
        );
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

  // Render a DM room
  const renderRoom = ({ item }) => {
    const isOnline = onlineUsers.has(item.other._id);
    return (
      <TouchableOpacity
        style={styles.roomItem}
        onPress={() => navigation.navigate('ChatScreen', { roomId: item.id, other: item.other })}
      >
        <Image source={{ uri: item.other.avatar || 'https://via.placeholder.com/48' }} style={styles.avatar} />
        <View style={styles.roomInfo}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomName}>{item.other.name}</Text>
            <Text style={styles.lastMsgTime}>{new Date(item.last_msg_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={styles.roomFooter}>
            <Text style={styles.lastMsg} numberOfLines={1}>{item.last_msg}</Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unread}</Text></View>
            )}
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render user for new chat
  const renderUser = ({ item }) => {
    // Use Name and Email from API, and fix avatar
    const avatarUrl = item.avatar && item.avatar.startsWith('http')
      ? item.avatar
      : SERVER_URL + (item.avatar || '/avatar/default-avatar.jpg');
    return (
      <TouchableOpacity style={styles.userItem} onPress={() => startChatWithUser(item)}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.Name}</Text>
          <Text style={styles.userEmail}>{item.Email}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={() => { fetchUsers(); setShowNewChat(true); }}>
          <Text style={{ fontSize: 24 }}>+</Text>
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
            <TouchableOpacity onPress={() => setShowNewChat(false)}><Text style={{ fontSize: 24 }}>×</Text></TouchableOpacity>
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ContactListScreen;