import axios from 'axios';
import { API_URL } from '@env';
import { getToken } from '../../utils/dbStore';

const BASE_URL = `${API_URL}/dm`;

const getAuthHeaders = async () => {
  const token = await getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ------------------- API METHODS -------------------

const startChat = async (otherUserId) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${BASE_URL}/rooms/create`, { otherUserId }, headers);
  return res.data;
};

const getRooms = async () => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${BASE_URL}/rooms`, headers);
  return res.data;
};

const getRoomDetails = async (roomId) => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${BASE_URL}/rooms/${roomId}`, headers);
  return res.data;
};

const archiveRoom = async (roomId) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${BASE_URL}/rooms/${roomId}/archive`, {}, headers);
  return res.data;
};

const muteRoom = async (roomId) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${BASE_URL}/rooms/${roomId}/mute`, {}, headers);
  return res.data;
};

const getMessages = async (roomId, limit = 30) => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${BASE_URL}/rooms/${roomId}/messages?limit=${limit}`, headers);
  return res.data;
};

const sendMessage = async (roomId, text, messageType = 'text', attachment = null, replyTo = null) => {
  const headers = await getAuthHeaders();
  const body = { text, message_type: messageType, reply_to: replyTo };

  if (attachment) {
    const formData = new FormData();
    formData.append('attachment', {
      uri: attachment.uri,
      type: attachment.type,
      name: attachment.name,
    });
    Object.keys(body).forEach(key => {
      formData.append(key, body[key]);
    });
    return await axios.post(`${BASE_URL}/rooms/${roomId}/messages/attachment`, formData, headers);
  }

  return await axios.post(`${BASE_URL}/rooms/${roomId}/messages`, body, headers);
};

const markAsRead = async (roomId) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${BASE_URL}/rooms/${roomId}/read`, {}, headers);
  return res.data;
};

const getMessageStatus = async (messageId) => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${BASE_URL}/messages/${messageId}/status`, headers);
  return res.data;
};

const deleteMessage = async (messageId) => {
  const headers = await getAuthHeaders();
  const res = await axios.delete(`${BASE_URL}/messages/${messageId}`, headers);
  return res.data;
};

const getSocietyUsers = async (societyId) => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${BASE_URL}/society/${societyId}/users`, headers);
  return res.data;
};

// ------------------- EXPORTS -------------------

export default {
  getRooms,
  startChat,
  getRoomDetails,
  archiveRoom,
  muteRoom,
  getMessages,
  sendMessage,
  markAsRead,
  getMessageStatus,
  deleteMessage,
  getSocietyUsers,
};
