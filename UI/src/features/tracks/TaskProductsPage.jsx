import React, { useEffect, useState } from 'react';
import { getTaskProducts } from './api/tasks.api';
import './tasks.css';

export const TaskProductsPage = ({ taskId, onBack, onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTaskProducts(taskId, { limit: 1000, offset: 0 })
      .then(data => {
        setProducts(Array.isArray(data) ? data : data.items || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-overlay" style={{ position: 'relative', height: '200px' }}>
          <div className="loading-spinner" />
          <span className="loading-text">Загружаем товары...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <button className="btn-back" onClick={onBack}>← Назад к списку задач</button>

      <section className="detail-section">
        <h2 className="detail-section__title">Товары для задачи</h2>
        {products && products.length > 0 ? (
          <table className="rights-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Цена</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={{ cursor: 'pointer' }} onClick={() => onProductClick(product)}>
                  <td>{product.id}</td>
                  <td>{product.name || product.title || '—'}</td>
                  <td>{product.price ? `${product.price} тг` : '—'}</td>
                  <td>
                    {product.url ? (
                      <a href={product.url} target="_blank" rel="noopener noreferrer">
                        Ссылка
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Товары не найдены</p>
        )}
      </section>
    </div>
  );
};
