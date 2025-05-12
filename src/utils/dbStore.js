import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem('userToken', token);
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('fcmToken');
    await AsyncStorage.removeItem('userRole');
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

export const storeUserRole = async (role) => {
  try {
    await AsyncStorage.setItem('userRole', role);
    return true;
  } catch (error) {
    console.error('Error storing user role:', error);
    return false;
  }
};

export const getUserRole = async () => {
  try {
    const role = await AsyncStorage.getItem('userRole');
    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

