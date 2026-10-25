

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FooterArticles.css';

const articles = [
  {
    id: 1,
    image: '/uploads/articles/article1.jpg',
    title: 'История создания вина'
  },
  {
    id: 2,
    image: '/uploads/articles/article2.jpg',
    title: 'Инвестиционный потенциал: какие вина дорожают быстрее всего?'
  },
  {
    id: 3,
    image: '/uploads/articles/article3.jpg',
    title: 'Красное вино: производство, выдержка и розлив'
  },
  {
    id: 4,
    image: '/uploads/articles/article4.jpg',
    title: 'Как производят белое вино'
  },
  {
    id: 5,
    image: '/uploads/articles/article5.jpg',
    title: 'Путиводитель по сортам винограда в Бордо'
  },
  {
    id: 6,
    image: '/uploads/articles/article6.jpg',
    title: 'Полезные свойства вин'
  }
];

export default function FooterArticles() {
  const navigate = useNavigate();

  const handleArticleClick = (articleId) => {
    navigate(`/article/${articleId}`);
  };

  return (
    <>
      {/* Блок статей */}
      <footer className="footer-articles">
        <div className="articles-container">
          <div className="articles-header">
            <h3>Статьи о вине</h3>
            <div className="header-decoration"></div>
          </div>
          
          <div className="articles-grid-two-rows">
            {articles.map((article) => (
              <div 
                key={article.id} 
                className="article-card"
                onClick={() => handleArticleClick(article.id)}
              >
                <div className="article-image-wrapper">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="article-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder-wine.jpg';
                    }}
                  />
                  <div className="article-overlay">
                    <span>Читать статью →</span>
                  </div>
                </div>
                <div className="article-info">
                  <h4 className="article-title">{article.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* ЧЕРНАЯ ЗАЛИВКА до Footer */}
      <div className="articles-black-section"></div>
    </>
  );
}