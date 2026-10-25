

import React, { useState, useEffect } from 'react';
import LotModal from "../../components/LotModal/LotModal";
import AddLotForm from '../../components/AddLotForm/AddLotForm';
import BidSectionMini from '../../components/BidSection/BidSectionMini';
import { getLots, createLot } from '../../services/api';
import { useLocation } from 'react-router-dom';
import './LotsPage.css';

export default function LotsPage({ onNavigate, token, user }) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [timers, setTimers] = useState({}); // Добавьте это состояние
  const location = useLocation();

  const isAdmin = user?.is_admin === true;

  useEffect(() => {
    loadLots();
  }, []);

  useEffect(() => {
  const params = new URLSearchParams(location.search);
  const filterParam = params.get('filter');
  if (filterParam === 'active') {
    setFilter('active');
  }
}, [location.search]);

  // Эффект для обновления таймеров
  useEffect(() => {
    const updateTimers = () => {
      const newTimers = {};
      lots.forEach(lot => {
        const now = new Date();
        const start = new Date(lot.start_time);
        const end = new Date(lot.end_time);
        
        if (now < start) {
          // Аукцион ещё не начался
          const diff = start - now;
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            newTimers[lot.id] = `Начинается через: ${days}д ${hours}ч`;
          } else if (hours > 0) {
            newTimers[lot.id] = `Начинается через: ${hours}ч ${minutes}м`;
          } else {
            newTimers[lot.id] = `Начинается через: ${minutes}м`;
          }
        } 
        else if (now >= start && now <= end) {
          // Аукцион активен
          const diff = end - now;
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          newTimers[lot.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        else {
          // Аукцион завершён
          newTimers[lot.id] = 'Завершён';
        }
      });
      setTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [lots]);

  const loadLots = async () => {
    try {
      const data = await getLots();
      setLots(data);
    } catch (err) {
      console.error('Ошибка загрузки лотов:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLotClick = (lot) => {
    setSelectedLot(lot);
    setIsModalOpen(true);
  };

  const handleUpdateLot = (updatedLot) => {
    setLots(prevLots => 
      prevLots.map(lot => lot.id === updatedLot.id ? updatedLot : lot)
    );
    setSelectedLot(updatedLot);
  };

  /*const handleAddLot = async (newLotData) => {           //Создает дублирование лота при добавлении
    try {
      const createdLot = await createLot(newLotData, token);
      setLots(prevLots => [createdLot, ...prevLots]);
      setShowAddForm(false);
    } catch (err) {
      console.error('Ошибка создания лота:', err);
      alert(err.message);
    }
  };*/
  const handleAddLot = (newLotData) => {
  
    setLots(prevLots => [newLotData, ...prevLots]);
    setShowAddForm(false);
  };

  const getLotStatus = (lot) => {
    const now = new Date();
    const start = new Date(lot.start_time);
    const end = new Date(lot.end_time);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'ended';
  };

  const filteredLots = lots.filter(lot => {
    if (filter === 'all') return true;
    return getLotStatus(lot) === filter;
  });

  const getStatusBadge = (lot) => {
    const status = getLotStatus(lot);
    switch (status) {
      case 'active':
        return <span className="status-badge active">🔴 В торгах</span>;
      case 'upcoming':
        return <span className="status-badge upcoming">⏳ Скоро</span>;
      case 'ended':
        return <span className="status-badge ended">✅ Завершён</span>;
      default:
        return null;
    }
  };

  const getWineTypeRussian = (type) => {
    const types = {
      'red': 'Красное',
      'white': 'Белое',
      'rose': 'Розовое',
      'sparkling': 'Игристое',
      'dessert': 'Десертное'
    };
    return types[type] || type;
  };

  // Функция для получения стиля таймера
  const getTimerStyle = (lot) => {
    const status = getLotStatus(lot);
    if (status === 'active') return 'timer-active';
    if (status === 'upcoming') return 'timer-upcoming';
    return 'timer-ended';
  };

  return (
    <div className="lots-page">
      {showAddForm ? (
        <AddLotForm 
          token={token} 
          onLotAdded={handleAddLot} 
          onCancel={() => setShowAddForm(false)} 
        />
      ) : (
        <>
          <div className="lots-page-header">
            <h1>🍷 Все лоты аукциона</h1>
            
            <div style={{ fontSize: '12px', color: '#999', marginRight: '10px' }}>
              {isAdmin ? '👑 Администратор' : '👤 Пользователь'}
            </div>
            
            {isAdmin && (
              <button 
                className="btn-add-lot" 
                onClick={() => setShowAddForm(true)}
              >
                + Добавить новый лот
              </button>
            )}
            
            <div className="filter-buttons">
              <button 
                className={filter === 'all' ? 'active' : ''} 
                onClick={() => setFilter('all')}
              >
                Все лоты
              </button>
              <button 
                className={filter === 'active' ? 'active' : ''} 
                onClick={() => setFilter('active')}
              >
                Активные
              </button>
              <button 
                className={filter === 'upcoming' ? 'active' : ''} 
                onClick={() => setFilter('upcoming')}
              >
                Скоро
              </button>
              <button 
                className={filter === 'ended' ? 'active' : ''} 
                onClick={() => setFilter('ended')}
              >
                Завершённые
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner">Загрузка лотов...</div>
          ) : filteredLots.length === 0 ? (
            <div className="empty-state">Нет лотов в выбранной категории</div>
          ) : (
            <div className="lots-grid">
              {filteredLots.map(lot => (
                <div 
                  key={lot.id} 
                  className="lot-card"
                  onClick={() => handleLotClick(lot)}
                >
                  <div className="lot-card-image">
                    {lot.image_url ? (
                      <img src={lot.image_url} alt={lot.title} />
                    ) : (
                      <div className="image-placeholder">🍷</div>
                    )}
                    {getStatusBadge(lot)}
                  </div>
                  <div className="lot-card-info">
                    <h3 className="lot-card-title">{lot.title}</h3>
                    
                    {/* ТАЙМЕР */}
                    <div className={`lot-card-timer ${getTimerStyle(lot)}`}>
                      <span className="timer-icon">
                        {getLotStatus(lot) === 'active' ? '⏱️' : 
                         getLotStatus(lot) === 'upcoming' ? '⏳' : '🏁'}
                      </span>
                      <span className="timer-value">{timers[lot.id] || 'Загрузка...'}</span>
                    </div>
                    
                    <div className="lot-card-price">
                      <span className="price-label">Текущая цена:</span>
                      <span className="price-value">{lot.current_price} ₽</span>
                    </div>
                    
                    <div className="lot-card-condition">
                      <span className="condition-label">📦 Состояние:</span>
                      <span className="condition-value">{lot.bottle_condition || '—'}</span>
                    </div>
                    
                    <div className="lot-card-type">
                      <span className="type-label">🍷 Тип:</span>
                      <span className="type-value">{getWineTypeRussian(lot.wine_type)}</span>
                    </div>

                    <div className="lot-card-actions">
                      <BidSectionMini 
                        lot={lot}
                        token={token}
                        userId={user?.id}
                        onBidPlaced={() => loadLots()}
                      />
                      <button className="view-details-btn" onClick={(e) => {
                        e.stopPropagation(); // Чтобы не открывался модальный окно при клике на кнопку
                        handleLotClick(lot);
                      }}>
                        Подробнее →
                      </button>
                    </div>
                </div>
              </div>
              ))}
            </div>
          )}

          <LotModal
            lot={selectedLot}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onUpdate={handleUpdateLot}
            token={token}
            isAdmin={isAdmin}
            userId={user?.id}
          />
        </>
      )}
    </div>
  );
}