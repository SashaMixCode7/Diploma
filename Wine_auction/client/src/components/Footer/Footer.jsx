import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="main-footer" itemScope itemType="https://schema.org/WPFooter">
      <div className="footer-container">
        {/* Текст о компании по центру с микроразметкой */}
        <div className="footer-about" itemScope itemType="https://schema.org/Organization">
          <meta itemProp="name" content="Винный аукцион - Название компании" />
          <meta itemProp="description" content="Ведущая платформа для торговли коллекционными винами. Присоединяйтесь к нашему винному аукциону." />
          <p className="company-tagline" itemProp="slogan">
            🍇 «Фужер Судьбы» — винный аукцион редких и коллекционных вин
          </p>
        </div>

        {/* Ссылки на социальные сети справа */}
        <div className="footer-socials" itemScope itemType="https://schema.org/Organization">
          <link itemProp="url" href="https://ваш-сайт.ru" />
          <a href="#" className="social-link" aria-label="Telegram (заглушка)" rel="noopener noreferrer">
            <i className="fab fa-telegram-plane"></i>
          </a>
          <a href="#" className="social-link" aria-label="VK (заглушка)" rel="noopener noreferrer">
            <i className="fab fa-vk"></i>
          </a>
          <a href="#" className="social-link" aria-label="YouTube (заглушка)" rel="noopener noreferrer">
            <i className="fab fa-youtube"></i>
          </a>
        </div>
      </div>
    </footer>
  );
}