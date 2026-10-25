import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';

export default function SearchPage({ lots, onNavigate, isLoggedIn, user }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (query && lots.length > 0) {
      const results = lots.filter(lot => 
        lot.title.toLowerCase().includes(query.toLowerCase()) ||
        lot.description?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
    }
  }, [query, lots]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout onNavigate={onNavigate} isLoggedIn={isLoggedIn} user={user}>
      <div className="main-content" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <button onClick={handleBack} style={{ marginBottom: '20px', cursor: 'pointer', padding: '8px 16px' }}>
          ← Назад
        </button>
        
        <h2>Результаты поиска: "{query}"</h2>
        
        {searchResults.length === 0 ? (
          <p>Ничего не найдено</p>
        ) : (
          <div className="lots-grid">
            {searchResults.map(lot => (
              <div 
                key={lot.id} 
                onClick={() => navigate(`/lot/${lot.id}`)}
                className="lot-card"
              >
                <div className="lot-image">
                  {lot.image_url ? (
                    <img src={lot.image_url} alt={lot.title} />
                  ) : (
                    <div className="lot-image-placeholder">🍷</div>
                  )}
                </div>
                <div className="lot-info">
                  <h3 className="lot-title">{lot.title}</h3>
                  <p className="lot-description">{lot.description?.substring(0, 80)}...</p>
                  <div className="lot-details">
                    <span className="lot-price">{lot.current_price}₽</span>
                    <span className="lot-step">Шаг: {lot.min_step}₽</span>
                  </div>
                  <div className="lot-end">
                    ⏰ {new Date(lot.end_time).toLocaleString('ru')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}