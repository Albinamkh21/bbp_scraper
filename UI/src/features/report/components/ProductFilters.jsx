import React from 'react';

export const PRODUCT_FILTERS_DEFAULTS = {
  title: '',
};

// Инпуты для отчёта PRODUCT_SHORT: поиск по названию товара (подстрока).
export default function ProductFilters({ filters, onChange, disabled }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="title">Название товара</label>
        <input
          id="title"
          name="title"
          type="text"
          className="form-control"
          placeholder="Например: iPhone 15"
          value={filters.title}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    </>
  );
}


