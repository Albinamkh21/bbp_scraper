import React from 'react';

export const SELLER_FILTERS_DEFAULTS = {
  marketplace: '',
  sellerId: '',
};

const MARKETPLACE_OPTIONS = [
  { value: '', label: 'Все маркетплейсы' },
  { value: 'Kaspi', label: 'Kaspi' },
  { value: 'Ozon', label: 'Ozon' },
];

// Инпуты для отчёта SELLER_LIST: маркетплейс и ID продавца.
export default function SellerFilters({ filters, onChange, disabled }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="marketplace">Маркетплейс</label>
        <select
          id="marketplace"
          name="marketplace"
          className="form-control"
          value={filters.marketplace}
          onChange={handleChange}
          disabled={disabled}
        >
          {MARKETPLACE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="sellerId">ID продавца</label>
        <input
          id="sellerId"
          name="sellerId"
          type="text"
          className="form-control"
          placeholder="Например: 30366938"
          value={filters.sellerId}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    </>
  );
}
