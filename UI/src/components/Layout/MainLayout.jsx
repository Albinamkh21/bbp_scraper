// src/components/Layout/MainLayout.jsx
import React from 'react';

export function MainLayout({ children, currentPage, onMenuClick, user, onLogout }) {
  // Проверяем, активен ли раздел Треков (включая детализацию)
  const isTracksActive = ['list', 'track', 'person'].includes(currentPage);
  const isReportActive = currentPage === 'report';
  const isCreateTaskActive = currentPage === 'createTask';

  return (
    <div className="app-minimal">
      <aside className="sidebar">
        <div className="sidebar-title">BBP Parser</div>
        {user && (
          <div className="user-info">
            <div className="user-name">{user.email}</div>
            <button className="btn-logout" onClick={onLogout}>Выход</button>
          </div>
        )}
        <nav className="nav-menu">
          {/* Используем обычные кнопки вместо NavLink */}
          <button 
            onClick={() => onMenuClick('tracks')} 
            className={`nav-link-btn ${isTracksActive ? 'active' : ''}`}
          >
           📑  Спикок задач
          </button>
     
          <button 
            onClick={() => onMenuClick('report')} 
            className={`nav-link-btn ${isReportActive ? 'active' : ''}`}
          >
            📑 Отчёты
          </button>
          
          <button 
            onClick={() => onMenuClick('createTask')} 
            className={`nav-link-btn ${isCreateTaskActive ? 'active' : ''}`}
          >
            🧩 Создать задачу
          </button>
        </nav>
      </aside>
      
      <main className="content-area">
        {children}
      </main>
    </div>
  );
}