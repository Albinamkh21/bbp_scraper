import axios from 'axios';

const backendUri = import.meta.env.VITE_BACKEND_URI || 'http://localhost:800';

export const httpClient = axios.create({
  baseURL: `/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Интерцептор для добавления токена ко всем запросам
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор для обработки ошибок аутентификации
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или невалиден
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const publicClient = axios.create({
  baseURL: `/api`,
  headers: { 'Content-Type': 'application/json' },
});