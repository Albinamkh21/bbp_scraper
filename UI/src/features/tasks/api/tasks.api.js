import { httpClient } from '../../../api/httpClient';

// Get list of tasks
export const getTasks = async (params) => {
  const response = await httpClient.get('/history/tasks', { params });

  console.log("ПОЛНЫЙ URL ЗАПРОСА:", response.request.responseURL);
  console.log("getTasks response:", response.data);
  return response;
};

export const createTask = async (payload) => {
  const { data } = await httpClient.post('/tasks', payload);
  return data;
};

// Get products for a specific task
export const getTaskProducts = async (taskId, params) => {
  const { data } = await httpClient.get(`/history/tasks/${taskId}/products`, { params });
  return data;
};

// Get sellers for a specific product
export const getProductSellers = async (taskId, productId, params) => {
  const { data } = await httpClient.get(`/history/tasks/${taskId}/products/${productId}/sellers`, { params });
  return data;
};
