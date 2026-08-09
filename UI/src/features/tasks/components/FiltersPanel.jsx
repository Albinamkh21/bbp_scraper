import React, { useState } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'pending', label: 'Ожидает' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершена' },
  { value: 'failed', label: 'Ошибка' },
  { value: 'paused', label: 'Приостановлена' },
];

export const FiltersPanel = ({ filters, onChange, onSearch, loading }) => {
  const [collapsed, setCollapsed] = useState(false);

  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) onSearch();
  };

  const handleClear = () => {
    const clearedFilters = { query: '', status: '', dateFrom: '', dateTo: '' };
    onChange(clearedFilters);
    setTimeout(() => onSearch(), 0);
  };

  return (
    <div className={`filters-panel ${collapsed ? 'filters-panel--collapsed' : ''}`}>
      <div className="filters-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="filters-header__title">Фильтры задач</span>
        <span className={`filters-header__arrow ${collapsed ? 'filters-header__arrow--down' : 'filters-header__arrow--up'}`}>
          ▲
        </span>
      </div>

      <div className={`filters-body ${collapsed ? 'filters-body--hidden' : ''}`}>
        <div className="filters-row">
          <div className="filter-field">
            <label className="filter-field__label">Поисковый запрос</label>
            <input
              className={`filter-field__input ${loading ? 'filter-field__input--disabled' : ''}`}
              value={filters.query || ''}
              onChange={set('query')}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Текст запроса..."
            />
          </div>

          <div className="filter-field">
            <label className="filter-field__label">Статус</label>
            <select
              className={`filter-field__input ${loading ? 'filter-field__input--disabled' : ''}`}
              value={filters.status || ''}
              onChange={set('status')}
              disabled={loading}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label className="filter-field__label">Период с</label>
            <input
              type="date"
              className={`filter-field__input ${loading ? 'filter-field__input--disabled' : ''}`}
              value={filters.dateFrom || ''}
              onChange={set('dateFrom')}
              disabled={loading}
            />
          </div>

          <div className="filter-field">
            <label className="filter-field__label">Период по</label>
            <input
              type="date"
              className={`filter-field__input ${loading ? 'filter-field__input--disabled' : ''}`}
              value={filters.dateTo || ''}
              onChange={set('dateTo')}
              disabled={loading}
            />
          </div>
        </div>

        <div className="filters-row filters-buttons-row">
          <button
            className={`btn-search ${loading ? 'btn-search--loading' : ''}`}
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? 'Поиск...' : 'Найти'}
          </button>
          <button
            className={`btn-search ${loading ? 'btn-search--loading' : ''}`}
            onClick={handleClear}
            disabled={loading}
          >
            Очистить фильтры
          </button>
        </div>
      </div>
    </div>
  );
};
             