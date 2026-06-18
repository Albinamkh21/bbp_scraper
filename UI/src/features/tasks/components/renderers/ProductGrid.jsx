import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export const ProductGrid = ({ fetchProducts, onProductClick }) => {
  const gridApiRef = useRef(null);

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 70 },
    
    // 1. Мини-картинка товара прямо в таблице
    {
      field: 'imageUrl',
      headerName: 'Фото',
      width: 80,
      cellRenderer: (params) => {
        if (!params.value) return '—';
        return (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <img 
              src={params.value} 
              alt="product" 
              style={{ width: '35px', height: '35px', objectFit: 'contain', borderRadius: '4px' }} 
            />
          </div>
        );
      },
      sortable: false,
      filter: false
    },

    // 2. Артикул / SKU
    { field: 'sku', headerName: 'SKU / Артикул', width: 130 },

    // 3. Название товара (делаем кликабельным ссылкой для провала к продавцам)
    {
      field: 'title',
      headerName: 'Название товара',
      flex: 2,
      cellRenderer: (params) => {
        if (!params.data) return <span style={{ color: '#aaa' }}>Загрузка...</span>;
        return (
          <span
            className="product-title-link"
            style={{ color: '#52c41a', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
            onClick={() => onProductClick && onProductClick(params.data.id)}
          >
            {params.value || '—'}
          </span>
        );
      },
    },

    // 4. Рейтинг ( rating )
    { 
      field: 'rating', 
      headerName: 'Рейтинг', 
      width: 100,
      valueFormatter: p => p.value ? `⭐ ${Number(p.value).toFixed(1)}` : '—'
    },

    // 5. Количество отзывов ( reviewsCount )
    { 
      field: 'reviewsCount', 
      headerName: 'Отзывы', 
      width: 100,
      valueFormatter: p => p.value !== undefined ? `${p.value} шт.` : '—' 
    },

    // 6. Прямая ссылка на Kaspi/Маркетплейс
    {
      field: 'url',
      headerName: 'Ссылка',
      width: 140,
      cellRenderer: (params) => {
        if (!params.value) return '—';
        return (
          <a 
            href={params.value} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#1890ff', textDecoration: 'none' }}
          >
            В магазин ↗
          </a>
        );
      }
    }
  ], [onProductClick]);

  // Настройка бесконечного скролла (Infinite Row Model) для товаров
  const setupDatasource = useCallback((gridApi) => {
    const dataSource = {
      getRows: async (rowParams) => {
        const limit = rowParams.endRow - rowParams.startRow;
        const offset = rowParams.startRow;

        // Фильтры пустые, так как мы фильтруем на бэкенде по taskId через URL роута
        const result = await fetchProducts({}, limit, offset);
        rowParams.successCallback(result.items, result.total);
      }
    };
    gridApi.setGridOption('datasource', dataSource);
  }, [fetchProducts]);

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
    setupDatasource(params.api);
  };

  return (
    <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowModelType="infinite"
        pagination={true}
        paginationPageSize={100}
        cacheBlockSize={100}
        onGridReady={onGridReady}
        maxConcurrentDatasourceRequests={1}
        rowHeight={48} // Чуть увеличил высоту строки, чтобы картинке было просторно
      />
    </div>
  );
};