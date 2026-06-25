// src/App.jsx
import React, { useState, useEffect } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { TasksPage } from './features/tasks/TasksPage';
import { CatalogPage } from './features/catalog/CatalogPage';
import { ReportPage } from './features/report/ReportPage';
import { CreateReportPage } from './features/report/CreateReportPage';
import { AuthPage } from './features/auth/AuthPage';
import { ForgotPassword } from './features/auth/ForgotPassword';
import { ResetPassword } from './features/auth/ResetPassword';
// === ИМПОРТИРУЕМ КОМПОНЕНТ ВЕРИФИКАЦИИ (проверь путь к файлу!) ===
import { VerifyEmail } from './features/auth/VerifyEmail'; 
import { httpClient } from './api/httpClient';
import './assets/style/minimal.css';

function App() {
  // === ИНИЦИАЛИЗАЦИЯ: Если в URL есть токен, сразу открываем верификацию ===
  const [page, setPage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('token')) {
      return { type: 'verify', token: params.get('token') };
    }
    if (params.has('resetToken')) {
      return { type: 'reset', token: params.get('resetToken') };
    }
    return { type: 'list' };
  });

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Проверяем аутентификацию при загрузке
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setPage({ type: 'list' });
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    delete httpClient.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setPage({ type: 'list' });
  };

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

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Загрузка...</div>;
  }

  // ===================================================================
  // ЭТАП СДЕЛАЛИ ПУБЛИЧНЫМ: Если тип страницы verify, рендерим её В ОБХОД авторизации
  // ===================================================================
  if (page.type === 'verify') {
    return (
      <VerifyEmail 
        token={page.token} 
        onComplete={() => setPage({ type: 'list' })} 
      />
    );
  }

  if (page.type === 'reset') {
    return (
      <ResetPassword 
        token={page.token} 
        onComplete={() => setPage({ type: 'list' })} 
      />
    );
  }

  if (page.type === 'forgot') {
    return <ForgotPassword onBack={() => setPage({ type: 'list' })} />;
  }

  // Закрытая зона: сюда не пустит без логина (но верификация теперь выше, так что ей всё равно)
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} onShowForgot={() => setPage({ type: 'forgot' })} />;
  }

  return (
    <MainLayout 
      currentPage={page.type} 
      onMenuClick={(mod) => mod === 'catalog' ? goToCatalog() : (mod === 'report' ? goToReport() : (mod === 'createReport' ? goToCreateReport() : goToTasks()))}
      user={user}
      onLogout={handleLogout}
    >
      
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