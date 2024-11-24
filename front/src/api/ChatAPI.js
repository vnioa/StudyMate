import APIClient from "./APIClient";

export const getChatRooms = () => APIClient.get('/api/chat/rooms');
export const createChatRoom = () => APIClient.post('/api/chat/rooms', data);
export const sendMessage = (roomId, message) => APIClient.post(`/api/chat/rooms/${roomId}/messages`, message);
export const getMessages = roomId => APIClient.get(`/api/chat/rooms/${roomId}/messages`);
export const updateChatSettings = (room, settings) => APIClient.patch(`/api/chat/rooms/${roomId}/settings`, settings);