/*
  Handles all HTTP requests to the backend.
  Automatically attaches JWT access token from AsyncStorage to every request.
*/

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "421692598259-bifnnf8faeoau6ck5idf515slfakg0pv.apps.googleusercontent.com";

let rawApiUrl = process.env.EXPO_PUBLIC_API_URL || "https://appointment.ua-cit.com/api/";
if (typeof window !== 'undefined' && window.location && window.location.origin && !process.env.EXPO_PUBLIC_API_URL) {
  rawApiUrl = `${window.location.origin}/api/`;
}

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