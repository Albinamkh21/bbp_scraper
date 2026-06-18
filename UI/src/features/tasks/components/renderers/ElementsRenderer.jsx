import React from 'react';

export const ElementsRenderer = (props) => {
  const items = props.value || [];
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {Array.isArray(items) && items.length > 0 ? (
        items.map((item, idx) => (
          <span 
            key={`${item.id || idx}`}
            style={{ color: '#1890ff', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => props.onProductClick && props.onProductClick(item)}
          >
            {item.name || item.title || 'Элемент'}
          </span>
        ))
      ) : (
        <span style={{ color: '#aaa' }}>Нет данных</span>
      )}
    </div>
  );
};
