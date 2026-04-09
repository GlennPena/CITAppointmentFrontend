/*
  Handles all HTTP requests to the backend.
  Automatically attaches JWT access token from AsyncStorage to every request.
*/

import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const API_URL = `http://${LOCAL_HOST}:8000/api/`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;