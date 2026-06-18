// src/App.jsx
import React, { useState } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { TasksPage } from './features/tasks/TasksPage';
import { CatalogPage } from './features/catalog/CatalogPage';
import { ReportPage } from './features/report/ReportPage';
import { CreateReportPage } from './features/report/CreateReportPage';
import './assets/style/minimal.css';

function App() {
  const [page, setPage] = useState({ type: 'list' });

  const goToCatalog = () => setPage({ type: 'catalog', prev: page });
  const goToReport = () => setPage({ type: 'report', prev: page });
  const goToCreateReport = () => setPage({ type: 'createReport', prev: page });
  const goToTasks = () => setPage({ type: 'list', prev: page });

  const goBack = () => {
    if (page.prev) {
      setPage(page.prev);
    } else {
      setPage({ type: 'list' });
    }
  };

  return (
    <MainLayout currentPage={page.type} onMenuClick={(mod) => mod === 'catalog' ? goToCatalog() : (mod === 'report' ? goToReport() : (mod === 'createReport' ? goToCreateReport() : goToTasks()))}>
      
      {page.type === 'catalog' && (
        <CatalogPage />
      )}

      {page.type === 'report' && (
        <ReportPage />
      )}

      {page.type === 'createReport' && (
        <CreateReportPage />
      )}
      
      {page.type === 'list' && (
        <TasksPage onTaskClick={goToTasks} />
      )}

    </MainLayout>
  );
}

export default App;