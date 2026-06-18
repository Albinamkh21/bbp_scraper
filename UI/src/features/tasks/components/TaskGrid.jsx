import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ElementsRenderer } from './renderers/ElementsRenderer';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export const TaskGrid = ({ fetchTasks, filters, onProductClick, onTaskClick, searchTrigger }) => {
  const gridApiRef = useRef(null);
  
  const lastFiltersRef = useRef(filters);
  useEffect(() => {
    lastFiltersRef.current = filters;
  }, [filters]);

 

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 80 },
    
    
    { field: 'marketplace', headerName: 'Маркетплейс', width: 150 }, 
    
    
    { field: 'searchType', headerName: 'Тип поиска', width: 120 },

   
    { 
      field: 'query', 
      headerName: 'Поисковый запрос', 
      flex: 2, 
      cellRenderer: (params) => {
        if (!params.data) return <span style={{ color: '#aaa' }}>Загрузка...</span>;
        return (
          <span
            className="task-title-link"
            style={{ color: '#1890ff', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => onTaskClick && onTaskClick(params.data.id)}
          >
            {params.value || '—'}
          </span>
        );
      },
    },
    
    
    { 
      field: 'status', 
      headerName: 'Статус', 
      width: 120,
      cellRenderer: (params) => {
        const statusColors = {
          'pending': '#faad14',
          'in_progress': '#1890ff',
          'completed': '#52c41a',
          'failed': '#ff4d4f',
          'paused': '#8c8c8c'
        };
        const status = params.value || 'unknown';
        return (
          <span style={{ 
            backgroundColor: statusColors[status] || '#d9d9d9', 
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {status}
          </span>
        );
      }
    },
    
    // 5. Исправлено:created_at -> createdAt (как в твоей БД)
    { 
      field: 'createdAt', 
      headerName: 'Дата создания', 
      width: 180,
      valueFormatter: p => p.value ? new Date(p.value).toLocaleString('ru-RU') : '—'
    }
  ], [onProductClick, onTaskClick]);

  const setupDatasource = useCallback((gridApi) => {
    const dataSource = {
      getRows: async (rowParams) => {
        const limit = rowParams.endRow - rowParams.startRow;
        const offset = rowParams.startRow;

        const result = await fetchTasks(lastFiltersRef.current, limit, offset);
        rowParams.successCallback(result.items, result.total);
      }
    };
    gridApi.setGridOption('datasource', dataSource);
  }, [fetchTasks]);

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
    setupDatasource(params.api);
  };

  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.paginationGoToFirstPage();
      setupDatasource(gridApiRef.current);
    }
  }, [searchTrigger, setupDatasource]);

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
      />
    </div>
  );
};
