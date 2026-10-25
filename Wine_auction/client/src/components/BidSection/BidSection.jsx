import React, { useState, useEffect } from 'react';
import { placeBid, setMaxBid } from '../../services/api';
import './BidSection.css';

export default function BidSection({ 
  lot, 
  token, 
  userId, 
  onBidPlaced,
  onMaxBidSet,
  showMaxBid = true,
  showCustomBid = true 
}) {
  const [customAmount, setCustomAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userMaxBid, setUserMaxBid] = useState(null);
  const [timeLeftToRespond, setTimeLeftToRespond] = useState(null);
  const [outbidNotification, setOutbidNotification] = useState(null);

  // Загрузка максимальной ставки пользователя
  useEffect(() => {
    const fetchUserMaxBid = async () => {
      if (!token || !userId) return;
      try {
        const response = await fetch(`/api/lots/${lot.id}/my-max-bid`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setUserMaxBid(data.max_bid);
      } catch (err) {
        console.error('Ошибка загрузки макс. ставки:', err);
      }
    };
    
    fetchUserMaxBid();
  }, [lot.id, token, userId]);

  //const minBid = lot.current_price + lot.min_step;
  const minBid = Number(lot.current_price) + Number(lot.min_step);
  const isLeader = lot.current_winner_id === userId;
  const isActive = () => {
    const now = new Date();
    const start = new Date(lot.start_time);
    const end = new Date(lot.end_time);
    return now >= start && now <= end;
  };

  // Обработка уведомления о перебитии ставки
  useEffect(() => {
    if (!lot.current_winner_id || lot.current_winner_id === userId) {
      setOutbidNotification(null);
      setTimeLeftToRespond(null);
      return;
    }

    // Если пользователь был лидером и его перебили
    if (!isLeader && userMaxBid && userMaxBid < lot.current_price) {
      setOutbidNotification({
        message: 'Вас перебили!',
        currentBid: lot.current_price,
        //minNextBid: lot.current_price + lot.min_step
        minNextBid: Number(lot.current_price) + Number(lot.min_step)
      });
      
      setTimeLeftToRespond(30);
      const timer = setInterval(() => {
        setTimeLeftToRespond(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setOutbidNotification(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [lot.current_winner_id, lot.current_price, userId, isLeader, userMaxBid, lot.min_step]);

  const handlePlaceBid = async (amount) => {
    if (!isActive()) {
      setError('Аукцион неактивен');
      return;
    }

    if (amount < minBid) {
      setError(`Минимальная ставка: ${minBid} ₽`);
      return;
    }

    setIsLoading(true);
    setError('');
    setOutbidNotification(null);
    
    try {
      const result = await placeBid(lot.id, amount, token);
      if (result.error) throw new Error(result.error);
      
      // Уведомляем родителя об успешной ставке
      onBidPlaced?.(result);
      
      // Очищаем поля
      setCustomAmount('');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetMaxBid = async () => {
    if (!maxBidAmount || parseFloat(maxBidAmount) < minBid) {
      setError(`Максимальная ставка должна быть не меньше ${minBid} ₽`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bids/set-max-bid/${lot.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ max_amount: parseFloat(maxBidAmount) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка установки максимума');
      }

      setUserMaxBid(data.max_bid);
      setMaxBidAmount('');
      onMaxBidSet?.(data.max_bid);
      alert('✅ Максимальная ставка установлена! Система будет делать ставки за вас.');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Рендер уведомления о перебитии
  const renderOutbidNotification = () => {
    if (!outbidNotification) return null;
    
    return (
      <div className="outbid-notification">
        <div className="outbid-title">⚠️ {outbidNotification.message}</div>
        <div>Текущая ставка: <strong>{Number(outbidNotification.currentBid).toFixed(2)} ₽</strong></div>
        {timeLeftToRespond !== null && (
          <div className="response-timer">
            ⏱️ Ответьте за {timeLeftToRespond} сек.
          </div>
        )}
        <button 
          onClick={() => handlePlaceBid(outbidNotification.minNextBid)}
          className="btn-response"
        >
          💰 Ответить ({Number(outbidNotification.minNextBid).toFixed(2)} ₽)
        </button>
      </div>
    );
  };

  if (!isActive()) {
    return (
      <div className="bid-section inactive">
        <p>⏳ Аукцион {new Date() < new Date(lot.start_time) ? 'ещё не начался' : 'уже завершён'}</p>
      </div>
    );
  }

  return (
    <div className="bid-section">
      <div className="current-info">
        <div className="current-price">
          <span> Текущая ставка:</span>
          <strong>{lot.current_price} ₽</strong>
        </div>
        {isLeader && <div className="leader-badge">👑 Вы лидер!</div>}
        {userMaxBid && (
          <div className="max-bid-info">
            🤖 Ваш максимум: <strong>{userMaxBid} ₽</strong>
          </div>
        )}
      </div>

      {renderOutbidNotification()}

      {!outbidNotification && (
        <>
          <div className="bid-controls">
            <button 
              onClick={() => handlePlaceBid(minBid)}
              disabled={isLoading}
              className="btn-bid-primary"
            >
              {isLoading ? '⏳...' : `💰 Ставка ${minBid.toFixed(2)} ₽`}
            </button>

            {showCustomBid && (
              <div className="custom-bid">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Своя сумма"
                  step={lot.min_step}
                  min={minBid}
                  disabled={isLoading}
                />
                <button 
                  onClick={() => handlePlaceBid(parseFloat(customAmount))}
                  disabled={isLoading || !customAmount || parseFloat(customAmount) < minBid}
                  title="Сделать ставку"
                >
                  📈
                </button>
              </div>
            )}
          </div>

          {showMaxBid && (
            <div className="max-bid-control">
              <div className="max-bid-label">🤖 Автоматические ставки:</div>
              <div className="max-bid-input-group">
                <input
                  type="number"
                  value={maxBidAmount}
                  onChange={(e) => setMaxBidAmount(e.target.value)}
                  placeholder={`Максимум (мин. ${minBid} ₽)`}
                  step={lot.min_step}
                  min={minBid}
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSetMaxBid}
                  disabled={isLoading || !maxBidAmount}
                  className="btn-max-bid"
                >
                  Установить
                </button>
              </div>
              <div className="max-bid-hint">
                Система будет автоматически поднимать вашу ставку до указанного лимита
              </div>
            </div>
          )}
        </>
      )}

      {error && <div className="error-message">❌ {error}</div>}
    </div>
  );
}