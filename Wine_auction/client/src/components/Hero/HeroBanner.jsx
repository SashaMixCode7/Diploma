import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HeroBanner.css';

export default function HeroBanner() {
  const navigate = useNavigate();

  const handleActiveLotsClick = () => {
    // Переход на страницу лотов с параметром фильтрации активных
    navigate('/lots?filter=active');
  };

  return (
    <div className="hero-banner">
      <div className="hero-image-container">
        <img 
          src="/uploads/main/main.jpg"
          alt="Винный аукцион" 
          className="hero-image"
        />
        <div className="hero-overlay">
          <div className="hero-content">
          </div>
          
          
          <button className="hero-active-lots-btn" onClick={handleActiveLotsClick}>
            <span className="btn-text">
              Активные<br />лоты
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}