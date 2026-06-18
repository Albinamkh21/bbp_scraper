import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export const SellersGrid = ({ rowData }) => {
  const columnDefs = useMemo(() => [
    { 
      // 1. Название продавца
      headerName: 'Название продавца', 
      flex: 2, 
      minWidth: 200,
      sortable: true,
      filter: true,
      valueGetter: params => params.data?.seller?.name || params.data?.name || '—',
      cellRenderer: p => p.value !== '—' ? <strong>{p.value}</strong> : '—'
    },
    { 
      // 2. Цена
      field: 'price', 
      headerName: 'Цена', 
      width: 130,
      sortable: true,
      valueFormatter: p => p.value ? `${Number(p.value).toLocaleString('ru-RU')} ₸` : '—',
      cellStyle: { fontWeight: 'bold', color: '#3f8600' }
    },
    { 
      // 3. Рейтинг
      headerName: 'Рейтинг', 
      width: 110,
      sortable: true,
      valueGetter: params => params.data?.seller?.rating || params.data?.rating || null,
      valueFormatter: p => p.value ? `⭐ ${Number(p.value).toFixed(1)}` : '—'
    },
    { 
      // 4. Количество отзывов
      headerName: 'Количество отзывов', 
      width: 180,
      sortable: true,
      valueGetter: params => params.data?.seller?.reviewsCount ?? params.data?.reviewsCount ?? null,
      valueFormatter: p => p.value !== null && p.value !== undefined 
        ? `${p.value.toLocaleString('ru-RU')} шт.` 
        : '—'
    },
    { 
      // 5. Телефон
      headerName: 'Телефон', 
      width: 150,
      sortable: true,
      filter: true,
      valueGetter: params => params.data?.seller?.phone || params.data?.phone || '—',
      cellRenderer: p => p.value && p.value !== 'not_found' ? p.value : <span style={{ color: '#aaa' }}>не найден</span>
    },
    { 
      // 6. Ссылка на магазин
      headerName: 'Ссылка на магазин', 
      width: 160,
      sortable: false,
      filter: false,
      valueGetter: params => params.data?.seller?.url || params.data?.url || null,
      cellRenderer: (params) => {
        if (!params.value) return '—';
        return (
          <a 
            href={params.value} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#1890ff', textDecoration: 'none', fontWeight: '500' }}
          >
            В магазин ↗
          </a>
        );
      }
    }
  ], []);

  return (
    <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={rowData}
        pagination={true}
        paginationPageSize={20}
        rowHeight={45}
        ensureDomOrder={true}
        enableCellTextSelection={true}
      />
    </div>
  );
};