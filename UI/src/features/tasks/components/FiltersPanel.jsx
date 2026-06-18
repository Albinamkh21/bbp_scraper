import React, { useState } from 'react';

export const FiltersPanel = ({ filters, onChange, onSearch, loading }) => {
  const [collapsed, setCollapsed] = useState(false);

  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) onSearch();
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
            <label className="filter-field__label">Название задачи</label>
            <input
              className={`filter-field__input ${loading ? 'filter-field__input--disabled' : ''}`}
              value={filters.name || ''}
              onChange={set('name')}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Название..."
            />
          </div>

          <div className="filter-field">
            <label className="filter-field__label">Статус</label>
            <input
              className={`filter-field__input ${loading ? 'filter-field__input--disabled' : ''}`}
              value={filters.status || ''}
              onChange={set('status')}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Статус..."
            />
          </div>
        </div>

        <div className="filters-row">
          <button
            className={`btn-search ${loading ? 'btn-search--loading' : ''}`}
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? 'Поиск...' : 'Найти'}
          </button>
        </div>
      </div>
    </div>
  );
};
             