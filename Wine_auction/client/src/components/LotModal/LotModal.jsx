import React, { useState, useEffect } from 'react';
import EditLotForm from './EditLotForm';
import BidSection from '../BidSection/BidSection';
import './LotModal.css';

export default function LotModal({ lot, isOpen, onClose, onUpdate, token, isAdmin, userId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState('active');

  // Таймер до окончания аукциона
  useEffect(() => {
    if (!lot || !isOpen) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(lot.end_time);
      const start = new Date(lot.start_time);
      const diff = end - now;

      if (now < start) {
        setAuctionStatus('waiting');
        const waitDiff = start - now;
        const hours = Math.floor(waitDiff / 3600000);
        const minutes = Math.floor((waitDiff % 3600000) / 60000);
        const seconds = Math.floor((waitDiff % 60000) / 1000);
        setTimeLeft(`Начинается через: ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else if (diff <= 0) {
        setAuctionStatus('ended');
        setTimeLeft('Аукцион завершён');
      } else {
        setAuctionStatus('active');
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lot, isOpen]);

  const handleUpdate = (updatedLot) => {
    onUpdate(updatedLot);
    setIsEditing(false);
  };

  if (!isOpen || !lot) return null;

 return (
    <div className="lot-modal-overlay" onClick={onClose}>
      <div className="lot-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="lot-modal-close" onClick={onClose}>×</button>
        
        {!isEditing ? (
          // Режим просмотра
          <div className="lot-modal-view">
            <div className="lot-modal-header">
              {lot.image_url ? (
                <img src={lot.image_url} alt={lot.title} className="lot-modal-image" />
              ) : (
                <div className="lot-modal-image-placeholder">🍷</div>
              )}
              
              <div className="lot-modal-info">
                <h2 className="lot-modal-title">{lot.title}</h2>
                <div className="lot-modal-price">
                  <span className="price-label">Текущая цена:</span>
                  <span className="price-value">{lot.current_price} ₽</span>
                </div>
                <div className="lot-modal-timer">
                  <span className="timer-label">⏱️ {auctionStatus === 'waiting' ? 'Старт' : auctionStatus === 'active' ? 'До окончания' : 'Финиш'}:</span>
                  <span className={`timer-value ${auctionStatus === 'active' ? 'active' : ''}`}>{timeLeft}</span>
                </div>
              </div>
            </div>

            <div className="lot-modal-body">
              <p className="lot-modal-description">{lot.description}</p>
              
              <div className="lot-modal-details">
                <h3>🍷 Характеристики вина</h3>
                <div className="wine-details-grid">
                  {lot.vintage && (
                    <div className="wine-detail-item">
                      <strong>📅 Винтаж:</strong> <span>{lot.vintage}</span>
                    </div>
                  )}
                  {lot.wine_type && (
                    <div className="wine-detail-item">
                      <strong>🍾 Тип:</strong> <span>
                        {lot.wine_type === 'red' ? 'Красное' :
                          lot.wine_type === 'white' ? 'Белое' :
                            lot.wine_type === 'rose' ? 'Розовое' :
                              lot.wine_type === 'sparkling' ? 'Игристое' : 'Десертное'}
                      </span>
                    </div>
                  )}
                  {lot.sweetness && (
                    <div className="wine-detail-item">
                      <strong>🍬 Сладость:</strong> <span>
                        {lot.sweetness === 'dry' ? 'Сухое' :
                          lot.sweetness === 'semi-dry' ? 'Полусухое' :
                            lot.sweetness === 'semi-sweet' ? 'Полусладкое' : 'Сладкое'}
                      </span>
                    </div>
                  )}
                  {lot.volume && (
                    <div className="wine-detail-item">
                      <strong>📏 Объём:</strong> <span>{lot.volume} л</span>
                    </div>
                  )}
                  {lot.alcohol && (
                    <div className="wine-detail-item">
                      <strong>🍸 Крепость:</strong> <span>{lot.alcohol}%</span>
                    </div>
                  )}
                  {lot.country && (
                    <div className="wine-detail-item">
                      <strong>🌍 Страна:</strong> <span>{lot.country}</span>
                    </div>
                  )}
                  {lot.region && (
                    <div className="wine-detail-item">
                      <strong>📍 Регион:</strong> <span>{lot.region}</span>
                    </div>
                  )}
                  {lot.appellation && (
                    <div className="wine-detail-item">
                      <strong>🏷️ Апелласьон:</strong> <span>{lot.appellation}</span>
                    </div>
                  )}
                  {lot.producer && (
                    <div className="wine-detail-item">
                      <strong>🏭 Производитель:</strong> <span>{lot.producer}</span>
                    </div>
                  )}
                  {lot.grape_variety && (
                    <div className="wine-detail-item">
                      <strong>🍇 Сорт винограда:</strong> <span>{lot.grape_variety}</span>
                    </div>
                  )}
                  {lot.bottle_condition && (
                    <div className="wine-detail-item">
                      <strong>📦 Состояние:</strong> <span>{lot.bottle_condition}</span>
                    </div>
                  )}
                </div>

                <h3 style={{ marginTop: '20px' }}>📋 Информация о лоте</h3>
                <div className="details-grid">
                  <div><strong>Стартовая цена:</strong> {lot.start_price} ₽</div>
                  <div><strong>Шаг ставки:</strong> {lot.min_step} ₽</div>
                  <div><strong>Текущая цена:</strong> {lot.current_price} ₽</div>
                  <div><strong>Начало:</strong> {new Date(lot.start_time).toLocaleString('ru')}</div>
                  <div><strong>Завершение:</strong> {new Date(lot.end_time).toLocaleString('ru')}</div>
                  {lot.current_winner_id && (
                    <div><strong>Текущий лидер:</strong> ID: {lot.current_winner_id}</div>
                  )}
                </div>
              </div>

              {auctionStatus === 'active' && (
                <div className="lot-modal-bid-section">
                  <h3>💎 Сделать ставку</h3>
                  <BidSection 
                    lot={lot}
                    token={token}
                    userId={userId}
                    onBidPlaced={(result) => {
                      onUpdate(result.lot);
                    }}
                    onMaxBidSet={(maxBid) => {
                      console.log('Максимум установлен:', maxBid);
                    }}
                    showMaxBid={true}
                    showCustomBid={true}
                  />
                </div>
              )}
            </div>
            
            <div className="lot-modal-footer">
              {isAdmin && (
                <button 
                  className="btn-edit" 
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Редактировать лот
                </button>
              )}
              <button className="btn-close" onClick={onClose}>
                Закрыть
              </button>
            </div>
          </div>
        ) : (
          // Режим редактирования
          <EditLotForm 
            lot={lot} 
            token={token} 
            onUpdate={handleUpdate} 
            onCancel={() => setIsEditing(false)} 
          />
        )}
      </div>
    </div>
  );
}