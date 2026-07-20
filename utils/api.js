/*
  Handles all HTTP requests to the backend.
  Automatically attaches JWT access token from AsyncStorage to every request.
*/

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "421692598259-bifnnf8faeoau6ck5idf515slfakg0pv.apps.googleusercontent.com";

let rawApiUrl = process.env.EXPO_PUBLIC_API_URL || "https://citappointmentbackend.onrender.com/api/";
// Remove accidental -6obi if present in env variable
rawApiUrl = rawApiUrl.replace("-6obi.onrender.com", ".onrender.com");

if (!rawApiUrl.endsWith('/api/') && !rawApiUrl.endsWith('/api')) {
  rawApiUrl = rawApiUrl.replace(/\/$/, '') + '/api/';
} else if (!rawApiUrl.endsWith('/')) {
  rawApiUrl += '/';
}

const API_URL = rawApiUrl;

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