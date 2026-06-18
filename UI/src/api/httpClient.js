import axios from 'axios';

const backendUri = import.meta.env.VITE_BACKEND_URI || 'http://localhost:800';

export const httpClient = axios.create({
  baseURL: `/api`,
  headers: { 'Content-Type': 'application/json' },
});