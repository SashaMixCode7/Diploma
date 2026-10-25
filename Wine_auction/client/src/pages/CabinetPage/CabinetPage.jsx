import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//import Layout from '../../components/Layout/Layout';
import { 
  getUserProfile,
  getBalance,
  getUserWonLots,
  getUserActiveBids,
  getUserBidHistory,
  getUserTransactions,
  updateUserProfile,
  handleApiError
} from '../../services/api';
import './CabinetPage.css';

export default function CabinetPage({ token, userId, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [userInfo, setUserInfo] = useState(null);
  const [balance, setBalance] = useState(0);
  const [activeBids, setActiveBids] = useState([]);
  const [wonLots, setWonLots] = useState([]);
  const [bidHistory, setBidHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadAllData();
  }, [token]);

  const loadAllData = async () => {
    setIsLoading(true);
    setError('');
    try {
      await Promise.all([
        loadUserProfile(),
        loadBalance(),
        loadActiveBids(),
        loadWonLots(),
        loadBidHistory(),
        loadTransactions()
      ]);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const data = await getUserProfile(token);
      // Адаптация полей под возможные варианты ответа от сервераа
      setUserInfo({
        first_name: data.first_name || data.firstName || '',
        last_name: data.last_name || data.lastName || '',
        email: data.email || '',
        phone: data.phone || data.phone_number || '',
        delivery_address: data.delivery_address || data.address || '',
        birth_date: data.birth_date || data.birthday || ''
      });
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
      setError(handleApiError(err));
    }
  };

  const loadBalance = async () => {
    try {
      const data = await getBalance(token);
      setBalance(data.balance || 0);
    } catch (err) {
      console.error('Ошибка загрузки баланса:', err);
      setError(handleApiError(err));
    }
  };

  const loadActiveBids = async () => {
    try {
      const data = await getUserActiveBids(token);
      setActiveBids(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки активных ставок:', err);
      setActiveBids([]);
    }
  };

  const loadWonLots = async () => {
    try {
      const data = await getUserWonLots(token);
      console.log('🏆 Выигранные лоты:', data); // Для отладки
      setWonLots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки выигранных лотов:', err);
      setWonLots([]);
    }
  };
  
 

  const loadBidHistory = async () => {
    try {
      const data = await getUserBidHistory(token);
      setBidHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки истории ставок:', err);
      setBidHistory([]);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await getUserTransactions(token);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки транзакций:', err);
      setTransactions([]);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!depositAmount || isNaN(amount) || amount < 10) {
      setError('Введите корректную сумму (мин. 10 ₽)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/balance/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Ошибка пополнения');

      setBalance(data.newBalance || data.balance);
      setDepositAmount('');
      alert(`✅ Баланс успешно пополнен на ${amount} ₽`);
      await loadTransactions(); // Обновляем историю
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const data = await updateUserProfile(userInfo, token);
      setUserInfo(data);
      setEditMode(false);
      alert('✅ Профиль успешно обновлён');
      
      // Перезагружаем данные
      await loadUserProfile();
      
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    navigate('/login');
  };

  if (isLoading && !userInfo) {
    return <div className="loading">Загрузка данных...</div>;
  }

  return (
    <div className="cabinet-page">
      <div className="cabinet-header">
        <div className="header-left">
          <h1>Мой кабинет</h1>
          <button onClick={handleLogout} className="logout-btn">🚪 Выйти</button>
        </div>
        <div className="balance-card">
          <span className="balance-label">💰 Баланс:</span>
          <span className="balance-amount">{balance.toFixed(2)} ₽</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="cabinet-tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          👤 Профиль
        </button>
        <button 
          className={activeTab === 'active' ? 'active' : ''} 
          onClick={() => setActiveTab('active')}
        >
          🎯 Активные ставки ({activeBids.length})
        </button>
        <button 
          className={activeTab === 'won' ? 'active' : ''} 
          onClick={() => setActiveTab('won')}
        >
          🏆 Выигранные ({wonLots.length})
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          📜 История ставок
        </button>
        <button 
          className={activeTab === 'transactions' ? 'active' : ''} 
          onClick={() => setActiveTab('transactions')}
        >
          💳 Транзакции
        </button>
      </div>

      <div className="cabinet-content">
      
        {activeTab === 'profile' && userInfo && (
          <div className="profile-tab">
            {!editMode ? (
              <div className="profile-view">
                <div className="profile-field">
                  <label>Имя:</label>
                  <p>{userInfo.first_name} {userInfo.last_name}</p>
                </div>
                <div className="profile-field">
                  <label>Email:</label>
                  <p>{userInfo.email}</p>
                </div>
                <div className="profile-field">
                  <label>Телефон:</label>
                  <p>{userInfo.phone || 'Не указан'}</p>
                </div>
                <div className="profile-field">
                  <label>Адрес доставки:</label>
                  <p>{userInfo.delivery_address || 'Не указан'}</p>
                </div>
                {userInfo.birth_date && (
                  <div className="profile-field">
                    <label>Дата рождения:</label>
                    <p>{new Date(userInfo.birth_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                )}
                <button onClick={() => setEditMode(true)} className="edit-btn">
                  ✏️ Редактировать
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="profile-edit">
                <div className="form-group">
                  <label>Имя:</label>
                  <input
                    type="text"
                    value={userInfo.first_name || ''}
                    onChange={(e) => setUserInfo({...userInfo, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Фамилия:</label>
                  <input
                    type="text"
                    value={userInfo.last_name || ''}
                    onChange={(e) => setUserInfo({...userInfo, last_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Телефон:</label>
                  <input
                    type="tel"
                    value={userInfo.phone || ''}
                    onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
                    placeholder="+7 (XXX) XXX-XX-XX"
                  />
                </div>
                <div className="form-group">
                  <label>Адрес доставки:</label>
                  <textarea
                    value={userInfo.delivery_address || ''}
                    onChange={(e) => setUserInfo({...userInfo, delivery_address: e.target.value})}
                    rows="3"
                    placeholder="Город, улица, дом, квартира"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={isLoading}>
                    {isLoading ? '⏳ Сохранение...' : '💾 Сохранить'}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)}>
                    ❌ Отмена
                  </button>
                </div>
              </form>
            )}

            /* Секция пополнения баланса */
            <div className="deposit-section">
              <h3>💳 Пополнение баланса</h3>
              <div className="deposit-controls">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Сумма в ₽"
                  step="500"
                  min="1000"
                />
                <button onClick={handleDeposit} disabled={isLoading}>
                  {isLoading ? '⏳ Обработка...' : '💰 Пополнить'}
                </button>
              </div>
              <p className="deposit-hint">Минимальная сумма пополнения: 1000 ₽</p>
            </div>
          </div>
        )}

        
        {activeTab === 'active' && (
          <div className="active-bids-tab">
            <h2>Активные ставки</h2>
            {activeBids.length === 0 ? (
              <p className="empty">У вас нет активных ставок</p>
            ) : (
              <div className="bids-grid">
                {activeBids.map((bid, index) => (
                  <div key={bid.id || index} className="bid-card">
                    <h3>{bid.lot_title || bid.title || `Лот #${bid.lot_id}`}</h3>
                    <div className="bid-info">
                      <span> Ваша ставка:</span>
                      <strong>{bid.amount || bid.bid_amount} ₽</strong>
                    </div>
                    {bid.is_leader && (
                      <div className="leader-badge">👑 Вы лидер!</div>
                    )}
                    {bid.max_bid && (
                      <div className="max-bid-info">
                        🤖 Максимум: {bid.max_bid} ₽
                      </div>
                    )}
                    <button onClick={() => navigate(`/lot/${bid.lot_id}`)}>
                      Перейти к лоту →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        
        {activeTab === 'won' && (
          <div className="won-lots-tab">
            <h2>Выигранные лоты</h2>
            {wonLots.length === 0 ? (
              <p className="empty">Пока нет выигранных лотов</p>
            ) : (
              <div className="won-lots-grid">
                {wonLots.map((lot, index) => (
                  <div key={lot.id || index} className="won-lot-card">
                    <div className="lot-image">
                      {lot.image_url ? (
                        <img src={lot.image_url} alt={lot.title} />
                      ) : (
                        <div className="placeholder">🍷</div>
                      )}
                    </div>
                    <div className="lot-details">
                      <h3>{lot.title || lot.lot_title}</h3>
                      <p className="price">💰 {lot.current_price || lot.final_price} ₽</p>
                      <button 
                        className="pay-btn"
                        onClick={() => alert('Функция оплаты в разработке')}
                      >
                        💳 Оплатить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        
        {activeTab === 'history' && (
          <div className="history-tab">
            <h2>История ставок</h2>
            {bidHistory.length === 0 ? (
              <p className="empty">Нет ставок</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Лот</th>
                    <th>Ставка</th>
                    <th>Дата</th>
                    <th>Результат</th>
                  </tr>
                </thead>
                <tbody>
                  {bidHistory.map((bid, index) => (
                    <tr key={bid.id || index}>
                      <td>
                        <a href={`/lot/${bid.lot_id}`}>
                          {bid.lot_title || bid.title || `Лот #${bid.lot_id}`}
                        </a>
                      </td>
                      <td><strong>{bid.amount || bid.bid_amount} ₽</strong></td>
                      <td>{new Date(bid.created_at || bid.date).toLocaleString('ru-RU')}</td>
                      <td>
                        {bid.is_winner ? 
                          <span className="win">🏆 Победа</span> : 
                          <span className="loss">❌ Проигрыш</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        
        {activeTab === 'transactions' && (
          <div className="transactions-tab">
            <h2>История операций</h2>
            {transactions.length === 0 ? (
              <p className="empty">Нет операций</p>
            ) : (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Тип</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans, index) => (
                    <tr key={trans.id || index}>
                      <td>{new Date(trans.created_at || trans.date).toLocaleString('ru-RU')}</td>
                      <td>
                        {trans.type === 'deposit' ? '💳 Пополнение' : 
                         trans.type === 'payment' ? '🏆 Оплата лота' :
                         trans.type === 'refund' ? '↩️ Возврат' : '📝 Другое'}
                      </td>
                      <td className={trans.type === 'deposit' ? 'positive' : 'negative'}>
                        {trans.type === 'deposit' ? '+' : '-'}{Math.abs(trans.amount)} ₽
                      </td>
                      <td>
                        {trans.status === 'completed' ? '✅ Выполнено' :
                         trans.status === 'pending' ? '⏳ Ожидание' : '❌ Отказ'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}