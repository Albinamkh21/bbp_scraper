import React, { useState } from 'react';
import { createTask as createTaskApi } from './api/tasks.api';
import { useTaskLogs } from '../../hooks/useTaskLogs';
import TaskLogsPanel from '../../components/TaskLogsPanel';

const MARKETPLACES = [
  { value: 'Kaspi', label: 'Kaspi' },
  { value: 'Ozon', label: 'Ozon' }
];

const SEARCH_TYPES = [
  { value: 'query', label: 'query' },
  { value: 'sku', label: 'sku' },
  { value: 'url', label: 'url' }
];

export function CreateTasksPage() {
  const [form, setForm] = useState({
    query: '',
    marketplace: 'Kaspi',
    searchType: 'query',
    maxItems: '12'
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);

  // Подключаемся к логам задачи
  const { logs, setLogs } = useTaskLogs(activeTaskId);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === 'maxItems' ? value.replace(/\D/g, '') : value
    }));
  };

  const validateForm = () => {
    if (!form.query.trim()) {
      setMessage('Введите запрос для поиска');
      return false;
    }

    if (!form.marketplace) {
      setMessage('Выберите маркетплейс');
      return false;
    }

    if (!form.searchType) {
      setMessage('Выберите тип поиска');
      return false;
    }

    const maxItems = Number(form.maxItems || 0);
    if (!Number.isInteger(maxItems) || maxItems <= 0) {
      setMessage('Введите корректное число для maxItems');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setMessage('');
    setLogs([]); // Очищаем старые логи

    try {
      const payload = {
        query: form.query.trim(),
        marketplace: form.marketplace,
        maxItems: Number(form.maxItems || 12),
        searchType: form.searchType
      };

      const result = await createTaskApi(payload);
      setMessage(`Задача отправлена успешно, taskId: ${result.taskId}`);
      setActiveTaskId(result.taskId); // Устанавливаем активный taskId для логов
      setForm({ query: '', marketplace: 'Kaspi', searchType: 'query', maxItems: '12' });
    } catch (error) {
      console.error(error);
      setMessage(error?.response?.data?.error || error?.message || 'Ошибка при отправке задачи');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">Создание новой задачи</h2>

      <form onSubmit={handleSubmit} className="action-section">
        <div className="form-group">
          <label className="form-label" htmlFor="query">Запрос</label>
          <input
            id="query"
            name="query"
            type="text"
            value={form.query}
            onChange={handleChange}
            className="form-control"
            placeholder="Введите поисковый запрос"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="marketplace">Маркетплейс</label>
          <select
            id="marketplace"
            name="marketplace"
            value={form.marketplace}
            onChange={handleChange}
            className="form-control"
            required
          >
            {MARKETPLACES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="searchType">Тип поиска</label>
          <select
            id="searchType"
            name="searchType"
            value={form.searchType}
            onChange={handleChange}
            className="form-control"
            required
          >
            {SEARCH_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="maxItems">maxItems</label>
          <input
            id="maxItems"
            name="maxItems"
            type="number"
            min="1"
            value={form.maxItems}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Отправка...' : 'Создать задачу'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`alert-message ${message.toLowerCase().includes('ошибка') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Панель логов в реальном времени */}
      <TaskLogsPanel
        activeTaskId={activeTaskId}
        logs={logs}
        onClose={() => {
          setActiveTaskId(null);
          setLogs([]);
        }}
        height={300}
      />
    </div>
  );
}

export default CreateTasksPage;
