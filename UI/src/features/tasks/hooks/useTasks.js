import { useState, useCallback } from 'react';
import { getTasks, getTaskProducts, getProductSellers } from '../api/tasks.api';

export const useTasks = () => {
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState([]);

  // Fetch tasks (main level)
  const fetchTasksData = useCallback(async (filters, limit, offset) => {
    setLoading(true);
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== '') params[key] = filters[key];
      });

      const response = await getTasks(params); 
      
      const totalHeader = response.headers?.['x-total-count'];
      const allItems = response.data || [];
      const total = totalHeader ? parseInt(totalHeader, 10) : allItems.length;

      const paginatedItems = allItems.slice(offset, offset + limit);

      return {
        items: paginatedItems,
        total: total
      };
    } catch (err) {
      console.error("Ошибка загрузки задач:", err);
      return { items: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products for a task
  const fetchProductsData = useCallback(async (taskId, limit, offset) => {
    try {
      const params = {};
      const data = await getTaskProducts(taskId, params);
      
      const allItems = Array.isArray(data) ? data : data.items || [];
      const total = allItems.length;
      const paginatedItems = allItems.slice(offset, offset + limit);

      return {
        items: paginatedItems,
        total: total
      };
    } catch (err) {
      console.error("Ошибка загрузки товаров:", err);
      return { items: [], total: 0 };
    }
  }, []);

  // Fetch sellers for a product
  const fetchSellersData = useCallback(async (taskId, productId, limit, offset) => {
    try {
      const params = {};
      const data = await getProductSellers(taskId, productId, params);
      
      const allItems = Array.isArray(data) ? data : data.items || [];
      const total = allItems.length;
      const paginatedItems = allItems.slice(offset, offset + limit);

      return {
        items: paginatedItems,
        total: total
      };
    } catch (err) {
      console.error("Ошибка загрузки продавцов:", err);
      return { items: [], total: 0 };
    }
  }, []);

  return { 
    loading, 
    labels, 
    fetchTasksData,
    fetchProductsData,
    fetchSellersData
  };
};
