import React, { useState } from 'react';
import { placeBid } from '../../services/api';
import './BidSectionMini.css';

export default function BidSectionMini({ lot, token, userId, onBidPlaced }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isActive = () => {
    const now = new Date();
    const start = new Date(lot.start_time);
    const end = new Date(lot.end_time);
    return now >= start && now <= end;
  };

  //const minBid = lot.current_price + lot.min_step;
  const minBid = Number(lot.current_price) + Number(lot.min_step);
  const isLeader = lot.current_winner_id === userId;

  const handleQuickBid = async () => {
    if (!isActive()) {
      setError('Аукцион неактивен');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await placeBid(lot.id, minBid, token);
      if (result.error) throw new Error(result.error);
      onBidPlaced?.(result);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isActive()) {
    return (
      <div className="bid-mini inactive">
        <span className="bid-mini-status">
          {new Date() < new Date(lot.start_time) ? '⏳ Скоро' : '🏁 Завершён'}
        </span>
      </div>
    );
  }

  return (
    <div className="bid-mini">
      {isLeader && <span className="leader-icon">👑</span>}
      <button 
        onClick={handleQuickBid}
        disabled={isLoading}
        className="btn-bid-quick"
        title={`Минимальная ставка: ${minBid} ₽`}
      >
        {isLoading ? '⏳' : `💰 ${minBid} ₽`}
      </button>
      {error && <div className="bid-mini-error">{error}</div>}
    </div>
  );
}