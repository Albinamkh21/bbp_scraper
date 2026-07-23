import React, { useState, useEffect } from 'react';
import { getProducts, getCategories } from '../api/report.api';

export const PRICE_FILTERS_DEFAULTS = {
  dateFrom: '',
  dateTo: '',
  productIds: [],   // [] = все товары
  categoryIds: [],  // [] = все категории
};

// Инпуты для отчёта PRICE_HISTORY.
// Если даты не указаны — берём весь период.
// Если товары/категории не выбраны — берём все.
export default function PriceFilters({ filters, onChange, disabled }) {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError]   = useState('');

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch(() => setLoadError('Не удалось загрузить список товаров/категорий'));
  }, []);

  const handleDate = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  const handleMultiSelect = (name) => (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    onChange({ ...filters, [name]: selected });
  };

  return (
    <>
      {loadError && (
        <div className="alert-message" style={{ borderLeftColor: '#dc2626', background: '#fef2f2', color: '#991b1b', marginBottom: 12 }}>
          {loadError}
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="dateFrom">Период с</label>
        <input
          id="dateFrom"
          name="dateFrom"
          type="date"
          className="form-control"
          value={filters.dateFrom}
          onChange={handleDate}
          disabled={disabled}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="dateTo">Период по</label>
        <input
          id="dateTo"
          name="dateTo"
          type="date"
          className="form-control"
          value={filters.dateTo}
          onChange={handleDate}
          disabled={disabled}
        />
      </div>

      <div className="form-group" style={{ alignItems: 'flex-start' }}>
        <label className="form-label" style={{ paddingTop: 6 }}>
          Товары&nbsp;<small style={{ color: '#888', fontWeight: 400 }}>(не выбрано = все)</small>
        </label>
        <select
          id="productIds"
          multiple
          className="form-control"
          value={filters.productIds}
          onChange={handleMultiSelect('productIds')}
          disabled={disabled || products.length === 0}
          style={{ minHeight: 130 }}
        >
          {products.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.title} ({p.sku})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ alignItems: 'flex-start' }}>
        <label className="form-label" style={{ paddingTop: 6 }}>
          Категории&nbsp;<small style={{ color: '#888', fontWeight: 400 }}>(не выбрано = все)</small>
        </label>
        <select
          id="categoryIds"
          multiple
          className="form-control"
          value={filters.categoryIds}
          onChange={handleMultiSelect('categoryIds')}
          disabled={disabled || categories.length === 0}
          style={{ minHeight: 110 }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

