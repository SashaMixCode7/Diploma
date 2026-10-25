
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BidSection from '../components/BidSection/BidSection'; // ← Импортируем компонент
import { getLot } from '../services/api';

export default function LotDetailPage({ token, userName, userId, onNavigate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [lotData, setLotData] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState('waiting');
  const [recentBids, setRecentBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка лота
  useEffect(() => {
    const fetchLot = async () => {
      try {
        const data = await getLot(id, token);
        setLotData(data);
        setIsLoading(false);
      } catch (err) {
        setError('Лот не найден');
        setIsLoading(false);
      }
    };
    
    if (id) fetchLot();
  }, [id, token]);

  // Определение статуса
  useEffect(() => {
    if (!lotData) return;
    const now = new Date();
    const start = new Date(lotData.start_time);
    const end = new Date(lotData.end_time);

    if (now < start) setAuctionStatus('waiting');
    else if (now >= start && now <= end) setAuctionStatus('active');
    else setAuctionStatus('ended');
  }, [lotData]);

  // Загрузка последних ставок
  useEffect(() => {
    if (!lotData) return;
    
    const fetchRecentBids = async () => {
      try {
        const response = await fetch(`/api/lots/${lotData.id}/recent-bids`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setRecentBids(data.slice(0, 5));
      } catch (err) {
        console.error('Ошибка загрузки ставок:', err);
      }
    };
    
    fetchRecentBids();
  }, [lotData, token]);

  const handleBidPlaced = (result) => {
    setLotData(result.lot);
    // Можно добавить уведомление
  };

  const handleMaxBidSet = (maxBid) => {
    console.log('Максимальная ставка установлена:', maxBid);
  };

  if (isLoading) {
    return (
      <div className="container">
        <button onClick={() => navigate(-1)}>← Назад</button>
        <p>Загрузка лота...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <button onClick={() => navigate(-1)}>← Назад</button>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="lot-detail-page">
      

      <div className="lot-detail-content">
        <div className="lot-image">
          {lotData.image_url ? (
            <img src={lotData.image_url} alt={lotData.title} />
          ) : (
            <div className="image-placeholder">🍷</div>
          )}
        </div>

        <div className="lot-info">
          <h1>{lotData.title}</h1>
          <p className="description">{lotData.description}</p>
          
          <div className="details-grid">
            {/* Характеристики вина */}
            {lotData.vintage && <div>📅 Винтаж: {lotData.vintage}</div>}
            {lotData.region && <div>📍 Регион: {lotData.region}</div>}
            {lotData.country && <div>🌍 Страна: {lotData.country}</div>}
            {lotData.wine_type && <div>🍾 Тип: {lotData.wine_type}</div>}
            {lotData.volume && <div>📏 Объём: {lotData.volume} л</div>}
            {lotData.alcohol && <div>🍸 Крепость: {lotData.alcohol}%</div>}
            {lotData.bottle_condition && <div>📦 Состояние: {lotData.bottle_condition}</div>}
          </div>

          {/* Используем компонент BidSection */}
          {auctionStatus === 'active' && (
            <BidSection
              lot={lotData}
              token={token}
              userId={userId}
              onBidPlaced={handleBidPlaced}
              onMaxBidSet={handleMaxBidSet}
              showMaxBid={true}
              showCustomBid={true}
            />
          )}

          {auctionStatus === 'waiting' && (
            <div className="waiting-message">
              ⏳ Аукцион начнётся {new Date(lotData.start_time).toLocaleString('ru')}
            </div>
          )}

          {auctionStatus === 'ended' && (
            <div className="ended-message">
              {lotData.current_winner_id === userId ? (
                <div className="winner-message">🏆 Поздравляем! Вы выиграли лот!</div>
              ) : (
                <div className="ended-message">✅ Аукцион завершён</div>
              )}
            </div>
          )}

          {/* Последние ставки */}
          {recentBids.length > 0 && (
            <div className="recent-bids">
              <h3>📋 Последние ставки</h3>
              {recentBids.map((bid, idx) => (
                <div key={idx} className="bid-item">
                  <span>{bid.user_name}</span>
                  <strong>{bid.amount} ₽</strong>
                  <span className="time">{new Date(bid.created_at).toLocaleTimeString('ru')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}