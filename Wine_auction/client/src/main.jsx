

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { getLots } from './services/api';
import LotDetailPage from './pages/LotDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './components/Profile/ProfilePage';
import Header from './components/Header/Header';
import HeroBanner from './components/Hero/HeroBanner';
import FooterArticles from "./components/FooterArt/FooterArticles";
import Footer from './components/Footer/Footer';
import AboutPage from './pages/AboutPage/AboutPage';
import ContactsPage from './pages/ContactsPage/ContactsPage';
import CalendarPage from './pages/CalendarPage/CalendarPage';
import ArticlePage from './pages/ArticlePage/ArticlePage';
import SearchPage from './pages/SearchPage/SearchPage';
import CabinetPage from './pages/CabinetPage/CabinetPage';
import LotsPage from './pages/LotsPage/LotsPage';
import AdminPanel from './pages/AdminPanel/AdminPanel';
import Layout from "./components/Layout/Layout";     //?
import './global.css';

// Компонент для главной страницы с лотами
function HomePage({ lots, loading, onLotSelect }) {
  return (
    <>
     
      <HeroBanner />
      <main className="main-content">
        
      </main>
      <FooterArticles /> 
    </>
  );
}

// Основной компонент приложения с роутингом
function AppContent() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadLots();
  }, []);

  const loadLots = () => {
    setLoading(true);
    getLots()
      .then(data => { setLots(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const handleNavigate = (path, state = null) => {
    if (path === 'logout') {
      handleLogout();
      return;
    }
    navigate(path, { state });
  };

  // Обёртка для Header с передачей navigate
  /*const HeaderWithNavigate = () => (
    <Header 
      onNavigate={handleNavigate}
      isLoggedIn={!!token}
      user={user}
    />
  );*/

return (
    <Routes>
      {/* Главная страница - обёрнута в Layout, который добавляет Header, FooterArticles и Footer */}
      <Route 
        path="/" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <HomePage 
              lots={lots} 
              loading={loading} 
              onLotSelect={(lotId) => navigate(`/lot/${lotId}`)}
            />
          </Layout>
        } 
      />
      
      <Route 
        path="/search" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <SearchPage 
              lots={lots}
              onLotSelect={(lotId) => navigate(`/lot/${lotId}`)}
              onNavigate={handleNavigate}
            />
          </Layout>
        } 
      />
      
      <Route 
        path="/lot/:id" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <LotDetailPage 
              token={token} 
              userName={user?.firstName}
              userId={user?.id}
              onNavigate={handleNavigate}
            />
          </Layout>
        } 
      />
      
      <Route 
        path="/article/:id" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <ArticlePage 
              onNavigate={handleNavigate}
              isLoggedIn={!!token}
              user={user}
            />
          </Layout>
        } 
      />
      
      {/* Страницы без Layout (отдельные, без хедера и футера) */}
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
      
      <Route 
        path="/profile" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <ProfilePage 
              user={user} 
              token={token} 
              onNavigate={handleNavigate}
            />
          </Layout>
        } 
      />
      {/* ========== НОВЫЙ ЛИЧНЫЙ КАБИНЕТ (ПОЛНЫЙ) ========== */}
      <Route 
        path="/cabinet" 
        element={
          token ? (
            <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
              <CabinetPage 
                token={token} 
                userId={user?.id} 
                user={user}
                onLogout={handleLogout}
                onNavigate={handleNavigate}
              />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      
      <Route 
        path="/about" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <AboutPage onNavigate={handleNavigate} />
          </Layout>
        } 
      />
      
      <Route 
        path="/contacts" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <ContactsPage onNavigate={handleNavigate} />
          </Layout>
        } 
      />
      <Route 
        path="/lots" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <LotsPage 
              onNavigate={handleNavigate} 
              token={token} 
              user={user}
            />
          </Layout>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <AdminPanel 
              token={token} 
              user={user}
              onNavigate={handleNavigate}
            />
          </Layout>
        } 
      />
      <Route 
        path="/calendar" 
        element={
          <Layout onNavigate={handleNavigate} isLoggedIn={!!token} user={user}>
            <CalendarPage onNavigate={handleNavigate} token={token} user={user} />
          </Layout>
        } 
      />
    </Routes>
  );
}

// Главный компонент
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);