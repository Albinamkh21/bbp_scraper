import { httpClient, publicClient } from './httpClient';

export const authAPI = {
  register: (data) => publicClient.post('/auth/register', data),
  login: (data) => publicClient.post('/auth/login', data),
  forgotPassword: (email) => publicClient.post('/auth/forgot-password', { email }),
  resetPassword: (data) => publicClient.post('/auth/reset-password', data),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    delete httpClient.defaults.headers.common['Authorization'];
  }
};
