import { useState, useCallback } from 'react';
import { getTasks, getTaskProducts, getProductSellers } from '../api/tasks.api';

export const useTasks = () => {
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState([]);

  // Fetch tasks (main level)
  const fetchTasksData = useCallback(async (filters, limit, offset, sortModel = []) => {
    setLoading(true);
    try {
      const params = {};
      if (filters.query) params.query = filters.query;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await getTasks(params);

      let allItems = response.data || [];
      const total = allItems.length;

      // Client-side sort (backend returns all rows, we paginate locally)
      if (sortModel.length > 0) {
        const { colId, sort } = sortModel[0];
        allItems = [...allItems].sort((a, b) => {
          const aVal = a[colId];
          const bVal = b[colId];
          if (aVal == null) return sort === 'asc' ? -1 : 1;
          if (bVal == null) return sort === 'asc' ? 1 : -1;
          if (aVal < bVal) return sort === 'asc' ? -1 : 1;
          if (aVal > bVal) return sort === 'asc' ? 1 : -1;
          return 0;
        });
      }

      const paginatedItems = allItems.slice(offset, offset + limit);

      return { items: paginatedItems, total };
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
