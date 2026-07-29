import React, { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { TaskGrid } from './components/TaskGrid';
import { FiltersPanel } from './components/FiltersPanel';
import { TaskProductsPage } from './TaskProductsPage';
import { ProductSellersPage } from './ProductSellersPage';
import './tasks.css';

const STORAGE_KEY = 'tasks_filters';

const getInitialFilters = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return { name: '', status: '' };
    }
  }
  return { name: '', status: '' };
};

export const TracksPage = ({ onTaskClick }) => {
  const { loading, fetchTasksData } = useTasks();
  const [view, setView] = useState('tasks'); // 'tasks', 'products', 'sellers'
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState(getInitialFilters);
  const [searchTrigger, setSearchTrigger] = useState(0);

  const handleSearch = () => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      setSearchTrigger(prev => prev + 1);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
  };

  return (
    <div className="tracks-page">
      {view === 'tasks' && (
        <>
          <FiltersPanel
            filters={filters}
            onChange={handleFiltersChange}
            onSearch={handleSearch}
            loading={loading}
          />

          <div className="grid-wrapper">
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner" />
                <span className="loading-text">Загружаем задачи...</span>
              </div>
            )}
            
            <TaskGrid 
              fetchTasks={fetchTasksData} 
              filters={filters}
              searchTrigger={searchTrigger}
              onProductClick={(task) => {
                setSelectedTask(task);
                setView('products');
              }} 
              onTaskClick={onTaskClick} 
            />
          </div>
        </>
      )}

      {view === 'products' && selectedTask && (
        <TaskProductsPage
          taskId={selectedTask.id}
          onBack={() => setView('tasks')}
          onProductClick={(product) => {
            setSelectedProduct(product);
            setView('sellers');
          }}
        />
      )}

      {view === 'sellers' && selectedTask && selectedProduct && (
        <ProductSellersPage
          taskId={selectedTask.id}
          productId={selectedProduct.id}
          onBack={() => setView('products')}
        />
      )}
    </div>
  );
};