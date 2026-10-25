
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import FooterArticles from '../FooterArt/FooterArticles';

const Layout = ({ children, onNavigate, isLoggedIn, user }) => {
  return (
    <div className="layout">
      <Header 
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        user={user}
      />
      <main className="layout__main">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;