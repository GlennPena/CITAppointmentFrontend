/*
  Handles authentication-related actions such as logout.
  Clears tokens, notifies backend, and redirects user to login screen.
*/

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';


export const handleLogout = async (navigation) => {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token');

    if (refreshToken) {
      await api.post('logout/', { refresh: refreshToken }).catch(e => 
        console.log("Backend logout failed or token already dead, proceeding with local logout.")
      );
    }

    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_role');
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
    
  } catch (error) {
    console.error("Error during logout:", error);
    navigation.navigate("Login");
  }
};