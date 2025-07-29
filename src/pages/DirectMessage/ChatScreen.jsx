import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Chat, IMessage, IUser } from '@flyerhq/react-native-chat-ui';
import { launchImageLibrary } from 'react-native-image-picker';
import { getToken } from '../../utils/dbStore';
import { jwtDecode } from 'jwt-decode';
import dmApi from './dmApi';
import { initSocket } from './socket';

const ChatScreen = () => {
  const { roomId, other } = useRoute().params;
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
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

  // Setup socket.io for live chat
  useEffect(() => {
    let socket;
    (async () => {
      socket = await initSocket();
      socketRef.current = socket;
      console.log('[SOCKET] Connecting and joining room:', roomId);
      socket.emit('joinRoom', roomId);
      socket.on('newMessage', (msg) => {
        console.log('[SOCKET] newMessage received:', msg);
        if (msg.room_id === roomId) {
          setMessages((prev) => [mapToFlyerMessage(msg), ...prev]);
        }
      });
      socket.on('userTyping', (typingInfo) => {
        console.log('[SOCKET] userTyping received:', typingInfo);
        if (typingInfo.roomId === roomId && typingInfo.userId !== user?.id) {
          setIsTyping(typingInfo.isTyping);
        }
      });
    })();
    return () => {
      if (socket) {
        console.log('[SOCKET] Leaving room:', roomId);
        socket.emit('leaveRoom', roomId);
        socket.off('newMessage');
        socket.off('userTyping');
      }
    };
  }, [roomId, user?.id]);

  // Fetch initial messages
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rawMessages = await dmApi.getMessages(roomId);
        setMessages(
          rawMessages.map(mapToFlyerMessage).filter(Boolean).reverse()
        );
      } catch (e) {
        Alert.alert('Error', 'Could not load messages');
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId]);

  // Stable socket event handlers for live chat
  const handleSocketMessage = useCallback((msg) => {
    console.log('[SOCKET] newMessage received:', msg);
    if (msg.room_id === roomId) {
      setMessages(prev => [mapToFlyerMessage(msg), ...prev]);
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

  // Send message handler
  const handleSend = async (flyerMsg) => {
    try {
      // flyerMsg.text contains the message
      await dmApi.sendMessage(roomId, flyerMsg.text, 'text');
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

  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <Chat
      messages={messages}
      onSendPress={handleSend}
      user={user}
      onAttachmentPress={handleAttachment}
      isTyping={isTyping}
      onInputTextChanged={handleInputTextChanged}
    />
  );
};

export default ChatScreen;
