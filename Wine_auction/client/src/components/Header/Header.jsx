
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header({ onNavigate, isLoggedIn, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const navItems = [
    { name: 'Лоты', path: '/lots' },
    { name: 'Календарь', path: '/calendar' },
    { name: 'О компании', path: '/about' },
    { name: 'Контакты', path: '/contacts' },
    { name: 'Мой кабинет', path: '/cabinet' }
  ];

  const handleNavigation = (path) => {
    if (path === 'logout') {
      onNavigate('logout');
    } else {
      onNavigate(path);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="auction-header">
      <div className="header-top">
        <div className="header-container">
          <div className="logo-area">
            <img 
              src="/uploads/logo/logo.png" 
              alt="Винный аукцион" 
              className="logo"
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            />
          </div>

          <div className="title-area">
            <h1 className="auction-title">Фужер Судьбы</h1>
          </div>

          <div className="actions-area">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">🔍</button>
            </form>
            
            {isLoggedIn ? (
              <div className="user-menu">
                <span className="user-name">{user?.firstName || user?.email?.split('@')[0]}</span>
                <button onClick={() => handleNavigation('logout')} className="logout-btn">Выйти</button>
              </div>
            ) : (
              <button onClick={() => navigate('/login')} className="login-btn">Войти</button>
            )}
            
          </div>
        </div>
      </div>

      <div className="header-divider"></div>

      <div className="header-bottom">
        <div className="nav-container">
          {/* Основные кнопки навигации */}
          {navItems.map((item, index) => (
            <React.Fragment key={item.path}>
              <button
                onClick={() => handleNavigation(item.path)}
                className="nav-link"
              >
                {item.name}
              </button>
              {index < navItems.length - 1 && <span className="nav-separator">|</span>}
            </React.Fragment>
          ))}
          
          {/* Разделитель перед админ-панелью */}
          {isLoggedIn && user?.is_admin && (
            <>
              <span className="nav-separator">|</span>
              <button
                onClick={() => handleNavigation('/admin')}
                className="nav-link admin-link"
                style={{ background: '#ff9800', color: 'white', padding: '6px 16px', borderRadius: '6px' }}
              >
                👑 Админ-панель
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}