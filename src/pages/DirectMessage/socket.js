import {io} from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '@env';
import {getToken} from '../../utils/dbStore';

const SOCKET_URL = `${SERVER_URL}`;
let socket = null;
let eventListeners = {};

const createSocket = async () => {
  const token = await getToken();

  if (!token) {
    console.warn('No token found for socket auth.');
    return null;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: false,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    updateOnlineStatus(true);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const initSocket = async () => {
  if (socket && socket.connected) return socket;
  if (!socket) await createSocket();
  if (socket && !socket.connected) socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Enhanced messaging functions
export const sendMessage = (messageData) => {
  if (socket && socket.connected) {
    socket.emit('sendMessage', messageData);
  }
};

export const joinRoom = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('joinRoom', roomId);
  }
};

export const leaveRoom = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('leaveRoom', roomId);
  }
};

export const updateTypingStatus = (roomId, isTyping) => {
  if (socket && socket.connected) {
    socket.emit('typing', { roomId, isTyping });
  }
};

export const markMessagesAsRead = (roomId) => {
  if (socket && socket.connected) {
    socket.emit('markAsRead', roomId);
  }
};

export const deleteMessage = (messageId, roomId) => {
  if (socket && socket.connected) {
    socket.emit('deleteMessage', { messageId, roomId });
  }
};

export const updateOnlineStatus = (isOnline) => {
  if (socket && socket.connected) {
    socket.emit('updateOnlineStatus', isOnline);
  }
};

// Event listener management
export const onNewMessage = (callback) => {
  if (socket) {
    socket.on('newMessage', callback);
    eventListeners.newMessage = callback;
  }
};

export const onMessageConfirmed = (callback) => {
  if (socket) {
    socket.on('messageConfirmed', callback);
    eventListeners.messageConfirmed = callback;
  }
};

export const onMessageError = (callback) => {
  if (socket) {
    socket.on('messageError', callback);
    eventListeners.messageError = callback;
  }
};

export const onUserTyping = (callback) => {
  if (socket) {
    socket.on('userTyping', callback);
    eventListeners.userTyping = callback;
  }
};

export const onMessagesRead = (callback) => {
  if (socket) {
    socket.on('messagesRead', callback);
    eventListeners.messagesRead = callback;
  }
};

export const onMessageDeleted = (callback) => {
  if (socket) {
    socket.on('messageDeleted', callback);
    eventListeners.messageDeleted = callback;
  }
};

export const onUserOnlineStatus = (callback) => {
  if (socket) {
    socket.on('userOnlineStatus', callback);
    eventListeners.userOnlineStatus = callback;
  }
};

// Clean up event listeners
export const removeEventListeners = () => {
  if (socket) {
    Object.keys(eventListeners).forEach(event => {
      socket.off(event, eventListeners[event]);
    });
    eventListeners = {};
  }
};

// Socket status
export const isSocketConnected = () => {
  return socket && socket.connected;
};
