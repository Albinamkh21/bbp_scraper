import React from 'react';

export const PRODUCT_FILTERS_DEFAULTS = {
  category: '',
  status: 'all',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'archived', label: 'Архивные' },
];

// Инпуты для отчёта PRODUCT_SHORT: выбор категории и статуса товара.
export default function ProductFilters({ filters, onChange, disabled }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="category">Категория</label>
        <input
          id="category"
          name="category"
          type="text"
          className="form-control"
          placeholder="Например: Смартфоны"
          value={filters.category}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="status">Статус</label>
        <select
          id="status"
          name="status"
          className="form-control"
          value={filters.status}
          onChange={handleChange}
          disabled={disabled}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </>
  );
}
