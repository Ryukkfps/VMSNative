import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Image, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IconFallback from '../../components/IconFallback';
import { API_URL } from '@env';

import { 
  initSocket, 
  getSocket, 
  sendMessage, 
  joinRoom, 
  leaveRoom, 
  markMessagesAsRead, 
  updateTypingStatus,
  onNewMessage,
  onUserTyping,
  onMessagesRead,
  onMessageDeleted,
  onUserOnlineStatus,
  removeEventListeners
} from './socket';
import dmApi from './dmApi';

const { height: screenHeight } = Dimensions.get('window');

const ChatScreen = () => {
  const { roomId, other } = useRoute().params;
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState({ id: '' });
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch user ID from storage
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('userId');
      setUser({ id });
    })();
  }, []);

  // Setup socket and fetch messages
  useEffect(() => {
    let socketInstance;

    const setupChat = async () => {
      try {
        const socket = await initSocket();
        socketInstance = socket;

        // Join the room
        joinRoom(roomId);

        // Fetch existing messages
        const rawMessages = await dmApi.getMessages(roomId);
        const mappedMessages = rawMessages
          .map(mapToMessage)
          .filter(m => m)
          .reverse();
        setMessages(mappedMessages);

        // Setup socket listeners
        onNewMessage(handleIncomingMessage);
        onUserTyping(handleUserTyping);
        onMessagesRead(handleMessagesRead);
        onMessageDeleted(handleMessageDeleted);
        onUserOnlineStatus(handleUserOnlineStatus);

        setLoading(false);
      } catch (error) {
        console.error('Setup chat error:', error);
        setLoading(false);
      }
    };

    setupChat();

    return () => {
      if (socketInstance) {
        leaveRoom(roomId);
        removeEventListeners();
      }
    };
  }, [roomId, user.id]);

  // Mark messages as read when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      markMessagesAsRead(roomId);
    });

    return unsubscribe;
  }, [navigation, roomId]);

  const handleIncomingMessage = useCallback((msg) => {
    if (msg.room_id === roomId) {
      const mapped = mapToMessage(msg);
      if (mapped) {
        setMessages(prev => [mapped, ...prev]);
        // Mark as read if screen is active
        markMessagesAsRead(roomId);
      }
    }
  }, [roomId]);

  const handleUserTyping = useCallback((typingInfo) => {
    if (typingInfo.roomId === roomId && typingInfo.userId !== user.id) {
      setOtherUserTyping(typingInfo.isTyping);
    }
  }, [roomId, user.id]);

  const handleMessagesRead = useCallback((readInfo) => {
    if (readInfo.roomId === roomId) {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        read: true
      })));
    }
  }, [roomId]);

  const handleMessageDeleted = useCallback((deleteInfo) => {
    if (deleteInfo.roomId === roomId) {
      setMessages(prev => prev.map(msg => 
        msg.id === deleteInfo.messageId 
          ? { ...msg, text: 'This message was deleted', deleted: true }
          : msg
      ));
    }
  }, [roomId]);

  const handleUserOnlineStatus = useCallback((statusInfo) => {
    if (statusInfo.userId === other._id) {
      setIsOnline(statusInfo.isOnline);
      if (!statusInfo.isOnline) {
        setLastSeen(new Date(statusInfo.lastSeen));
      }
    }
  }, [other._id]);

  const handleSend = async () => {
    const safeText = inputText.trim();
    if (!safeText || sending) return;

    setSending(true);
    setInputText('');

    const tempId = Math.random().toString();
    const optimisticMsg = {
      id: tempId,
      text: safeText,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      message_type: 'text',
      temp: true
    };

    // Optimistic UI
    setMessages(prev => [optimisticMsg, ...prev]);

    try {
      // Send via socket
      sendMessage({
        room_id: roomId,
        text: safeText,
        tempId
      });

      // Also save to DB
      const savedMsg = await dmApi.sendMessage(roomId, safeText);
      if (savedMsg) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? mapToMessage(savedMsg) : msg
          )
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (text) => {
    setInputText(text);
    
    // Handle typing indicators
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      updateTypingStatus(roomId, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        updateTypingStatus(roomId, false);
      }
    }, 1000);
  };

  const handleAttachment = () => {
    launchImageLibrary(
      {
        mediaType: 'mixed',
        quality: 0.7,
        maxWidth: 1200,
        maxHeight: 1200,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          sendAttachment(asset);
        }
      }
    );
  };

  const sendAttachment = async (asset) => {
    try {
      setSending(true);
      const attachment = {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || 'attachment',
      };

      const result = await dmApi.sendMessage(
        roomId, 
        asset.fileName || 'Attachment', 
        asset.type?.startsWith('image/') ? 'image' : 'file',
        attachment
      );
      
      if (result) {
        const mapped = mapToMessage(result);
        setMessages(prev => [mapped, ...prev]);
      }
    } catch (error) {
      console.error('Failed to send attachment:', error);
      Alert.alert('Error', 'Failed to send attachment');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dmApi.deleteMessage(messageId);
              setMessages(prev => prev.map(msg => 
                msg.id === messageId 
                  ? { ...msg, text: 'This message was deleted', deleted: true }
                  : msg
              ));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  const mapToMessage = (msg) => {
    if (!msg) return null;
    
    return {
      id: msg._id || msg.id || Math.random().toString(),
      text: msg.text || '',
      sender_id: msg.sender_id,
      sender_name: msg.sender_name,
      sender_avatar: msg.sender_avatar,
      created_at: msg.created_at || new Date().toISOString(),
      message_type: msg.message_type || 'text',
      attachment_url: msg.attachment_url,
      attachment_name: msg.attachment_name,
      delivery_status: msg.delivery_status || 'sent',
      deleted: msg.deleted_at ? true : false,
      temp: msg.temp || false
    };
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender_id === user.id;
    const messageTime = new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Image 
            source={{ uri: item.sender_avatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {item.message_type === 'image' && item.attachment_url && (
            <Image 
              source={{ uri: `${API_URL}${item.attachment_url}` }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          
          {item.message_type === 'file' && item.attachment_url && (
            <View style={styles.fileContainer}>
              <IconFallback name="attach-file" size={20} color="#666" />
              <Text style={styles.fileName}>{item.attachment_name}</Text>
            </View>
          )}
          
          {item.text && (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownText : styles.otherText,
              item.deleted && styles.deletedText
            ]}>
              {item.text}
            </Text>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{messageTime}</Text>
            {isOwnMessage && (
              <IconFallback 
                name={item.delivery_status === 'read' ? 'done-all' : 'done'}
                size={16}
                color={item.delivery_status === 'read' ? '#4CAF50' : '#999'}
              />
            )}
          </View>
        </View>
        
        {isOwnMessage && (
          <TouchableOpacity 
            onPress={() => handleDeleteMessage(item.id)}
            style={styles.deleteButton}
          >
            <IconFallback name="more-vert" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!otherUserTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>{other.name} is typing...</Text>
      </View>
    );
  };

  const renderOnlineStatus = () => {
    return (
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusDot,
          { backgroundColor: isOnline ? '#4CAF50' : '#999' }
        ]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen.toLocaleTimeString()}` : 'Offline'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with online status */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconFallback name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{other.name}</Text>
          {renderOnlineStatus()}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Typing indicator */}
      {renderTypingIndicator()}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          onPress={handleAttachment}
          style={styles.attachButton}
        >
          <IconFallback name="attach-file" size={24} color="#007bff" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        
        <TouchableOpacity 
          onPress={handleSend}
          style={[styles.sendButton, { opacity: sending ? 0.5 : 1 }]}
          disabled={sending || !inputText.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconFallback name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInfo: {
    marginLeft: 16,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#007bff',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#000',
  },
  deletedText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    marginBottom: 4,
  },
  fileName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  typingContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007bff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ChatScreen;
