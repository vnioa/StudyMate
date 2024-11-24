import APIClient from "./APIClient";

export const getFriends = () => APIClient.get('/api/users/friends');
export const addFriend = (friendData) => APIClient.post('/api/users/friends', friendData);
export const removeFriend = (friendId) => APIClient.delete(`/api/users/friends/${friendId}`);