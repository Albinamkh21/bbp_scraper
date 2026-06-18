import React, { useEffect, useState } from 'react';
import { getProductSellers } from './api/tasks.api';
import { SellersGrid } from './components/SellersGrid'; 
import './tasks.css';

export const ProductSellersPage = ({ productId, onBack, taskId }) => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (taskId && productId) {
      getProductSellers(taskId, productId, { limit: 1000, offset: 0 })
        .then(res => {
          const rawData = res && res.data ? res.data : res;
          const cleanArray = Array.isArray(rawData) ? rawData : rawData?.items || [];
          setSellers(cleanArray);
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

  // Достаем данные о товаре и маркетплейсе из первого элемента массива (если он есть)
  const productInfo = sellers.length > 0 ? sellers[0]?.product : null;
  const productName = productInfo?.title || 'Неизвестный товар';
  const marketplaceName = productInfo?.marketplace?.name || 'Неизвестный маркетплейс';

  return (
    <div className="detail-page" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '15px' }}>
        <button className="btn-back" onClick={onBack}>← Назад к товарам</button>
      </div>

      <section className="detail-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
        
        {/* Информационный блок над таблицей */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#333' }}>
            {productName}
          </h2>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
            <span>Маркетплейс: <strong>{marketplaceName}</strong></span>
            <span>Найдено предложений: <strong>{sellers.length}</strong></span>
          </div>
        </div>
        
        {/* Сама таблица продавцов */}
        <div style={{ flex: 1, width: '100%' }}>
          <SellersGrid rowData={sellers} />
        </div>
      </section>
    </div>
  );
};