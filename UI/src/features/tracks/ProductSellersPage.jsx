import React, { useEffect, useState } from 'react';
import { getProductSellers } from './api/tasks.api';
import './tasks.css';

export const ProductSellersPage = ({ productId, onBack, taskId }) => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (taskId && productId) {
      getProductSellers(taskId, productId, { limit: 1000, offset: 0 })
        .then(data => {
          setSellers(Array.isArray(data) ? data : data.items || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [taskId, productId]);

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-overlay" style={{ position: 'relative', height: '200px' }}>
          <div className="loading-spinner" />
          <span className="loading-text">Загружаем продавцов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <button className="btn-back" onClick={onBack}>← Назад к товарам</button>

      <section className="detail-section">
        <h2 className="detail-section__title">Продавцы товара</h2>
        {sellers && sellers.length > 0 ? (
          <table className="rights-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Рейтинг</th>
                <th>Количество отзывов</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller, idx) => (
                <tr key={seller.id || idx}>
                  <td>{seller.name || seller.title || '—'}</td>
                  <td>{seller.rating ? seller.rating.toFixed(2) : '—'}</td>
                  <td>{seller.reviews_count || seller.reviewCount || '—'}</td>
                  <td>
                    {seller.url ? (
                      <a href={seller.url} target="_blank" rel="noopener noreferrer">
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
          <p>Продавцы не найдены</p>
        )}
      </section>
    </div>
  );
};
