import { httpClient } from '../httpClient';

export const authAPI = {
  register: (data) => httpClient.post('/auth/register', data),
  login: (data) => httpClient.post('/auth/login', data),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    delete httpClient.defaults.headers.common['Authorization'];
  }
};
