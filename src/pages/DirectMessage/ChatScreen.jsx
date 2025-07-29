import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ActivityIndicator, Alert, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Chat, IMessage, IUser } from '@flyerhq/react-native-chat-ui';
import { launchImageLibrary } from 'react-native-image-picker';
import { getToken } from '../../utils/dbStore';
import { jwtDecode } from 'jwt-decode';
import dmApi from './dmApi';
import { initSocket } from './socket';
import { API_URL } from '@env';

// Avatar Component for empty state
const Avatar = ({ uri, name, size = 80 }) => {
  const [imageError, setImageError] = useState(false);

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
        <Image
          source={{ uri: avatarUri }}
          style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.avatarInitials, { fontSize: size * 0.4 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
    </View>
  );
};

// Empty State Component
const EmptyState = ({ other, onStartConversation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.emptyStateContainer, { opacity: fadeAnim }]}>
      <Avatar uri={other?.avatar} name={other?.name} size={100} />
      <Text style={styles.emptyStateTitle}>Start a conversation with {other?.name}</Text>
      <Text style={styles.emptyStateSubtitle}>
        Say hello and introduce yourself to get the conversation started!
      </Text>
      <TouchableOpacity style={styles.startChatButton} onPress={onStartConversation}>
        <Text style={styles.startChatButtonText}>👋 Say Hello</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Enhanced Loading Component
const LoadingState = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007bff" />
    <Text style={styles.loadingText}>Loading messages...</Text>
  </View>
);

const ChatScreen = () => {
  const { roomId, other } = useRoute().params;
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialMessages, setHasInitialMessages] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Fetch user info from token
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const decoded = jwtDecode(token);
          setUser({ id: decoded.userId, firstName: decoded.name || 'You' });
        }
      } catch (error) {
        console.error('User decode error', error);
      }
    })();
  }, []);

  // Fetch initial messages
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rawMessages = await dmApi.getMessages(roomId);
        const processedMessages = rawMessages.map(mapToFlyerMessage).filter(Boolean).reverse();
        setMessages(processedMessages);
        setHasInitialMessages(processedMessages.length > 0);
      } catch (e) {
        console.error('Error loading messages:', e);
        setError('Failed to load messages. Please try again.');
        setHasInitialMessages(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId]);

  // Stable socket event handlers for live chat
  const handleSocketMessage = useCallback((msg) => {
    console.log('[SOCKET] newMessage received:', msg);
    if (msg.room_id === roomId) {
      const newMessage = mapToFlyerMessage(msg);
      if (newMessage) {
        setMessages(prev => [newMessage, ...prev]);
        setHasInitialMessages(true);
      }
    }
  }, [roomId]);

  const handleTyping = useCallback((typingInfo) => {
    console.log('[SOCKET] userTyping received:', typingInfo);
    if (typingInfo.roomId === roomId && typingInfo.userId !== user?.id) {
      setIsTyping(typingInfo.isTyping);
    }
  }, [roomId, user?.id]);

  // Setup socket.io for live chat
  useEffect(() => {
    let socket;
    (async () => {
      socket = await initSocket();
      socketRef.current = socket;
      console.log('[SOCKET] Connecting and joining room:', roomId);
      socket.emit('joinRoom', roomId);
      console.log("joinRoom" + roomId)
      socket.on('newMessage', handleSocketMessage);
      socket.on('userTyping', handleTyping);
    })();
    return () => {
      if (socket) {
        console.log('[SOCKET] Leaving room:', roomId);
        socket.emit('leaveRoom', roomId);
        socket.off('newMessage', handleSocketMessage);
        socket.off('userTyping', handleTyping);
      }
    };
  }, [roomId, user?.id, handleSocketMessage, handleTyping]);

  // Map backend message to Flyer Chat message
  const mapToFlyerMessage = (msg) => {
    if (!msg) return null;
    const flyerMsg = {
      id: msg._id || msg.id || Math.random().toString(),
      author: {
        id: msg.sender_id,
        firstName: msg.sender_name || '',
        avatar: msg.sender_avatar || undefined,
      },
      createdAt: new Date(msg.created_at || Date.now()),
      status: msg.delivery_status === 'read' ? 'seen' : 'sent',
      type: msg.message_type === 'image' ? 'image' : msg.message_type === 'file' ? 'file' : 'text',
      text: msg.text || '',
    };
    if (msg.attachment_url) {
      flyerMsg.attachments = [
        {
          name: msg.attachment_name,
          url: msg.attachment_url,
          type: msg.message_type,
        },
      ];
    }
    return flyerMsg;
  };

  // Start conversation with a greeting
  const startConversation = async () => {
    const greetingMessage = `Hello ${other?.name}! 👋`;
    try {
      await dmApi.sendMessage(roomId, greetingMessage, 'text');
      setHasInitialMessages(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to send greeting message');
    }
  };

  // Send message handler
  const handleSend = async (flyerMsg) => {
    try {
      // flyerMsg.text contains the message
      await dmApi.sendMessage(roomId, flyerMsg.text, 'text');
      setHasInitialMessages(true);
      // The backend/socket will emit the message, so no need to optimistically update
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Send image/file attachment
  const handleAttachment = () => {
    launchImageLibrary(
      { mediaType: 'mixed', quality: 0.7, maxWidth: 1200, maxHeight: 1200 },
      async (response) => {
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          try {
            await dmApi.sendMessage(
              roomId,
              asset.fileName || 'Attachment',
              asset.type?.startsWith('image/') ? 'image' : 'file',
              {
                uri: asset.uri,
                type: asset.type,
                name: asset.fileName || 'attachment',
              }
            );
            setHasInitialMessages(true);
          } catch (e) {
            Alert.alert('Error', 'Failed to send attachment');
          }
        }
      }
    );
  };

  // Typing indicator
  const handleInputTextChanged = (text) => {
    if (socketRef.current && user) {
      socketRef.current.emit('typing', { roomId, userId: user.id, isTyping: !!text });
    }
  };

  // Show loading state
  if (loading || !user) {
    return <LoadingState />;
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => {
            setError(null);
            setLoading(true);
            // Trigger refetch by updating the dependency
            const refetch = async () => {
              try {
                const rawMessages = await dmApi.getMessages(roomId);
                const processedMessages = rawMessages.map(mapToFlyerMessage).filter(Boolean).reverse();
                setMessages(processedMessages);
                setHasInitialMessages(processedMessages.length > 0);
              } catch (e) {
                setError('Failed to load messages. Please try again.');
              } finally {
                setLoading(false);
              }
            };
            refetch();
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.chatContainer}>
      {/* Empty State for new conversations */}
      {!hasInitialMessages && messages.length === 0 && (
        <EmptyState other={other} onStartConversation={startConversation} />
      )}
      
      {/* Chat Interface */}
      <Chat
        messages={messages}
        onSendPress={handleSend}
        user={user}
        onAttachmentPress={handleAttachment}
        isTyping={isTyping}
        onInputTextChanged={handleInputTextChanged}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Main Container
  chatContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Avatar Styles
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#007bff',
  },
  avatarInitials: {
    color: '#007bff',
    fontWeight: '700',
  },

  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f8f9fa',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  startChatButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  startChatButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Loading State Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },

  // Error State Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ChatScreen;
