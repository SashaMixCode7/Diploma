

import React, { useState, useEffect } from 'react';
import EditLotForm from '../../components/LotModal/EditLotForm';
import './AdminPanel.css';

export default function AdminPanel({ token, user, onNavigate }) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLot, setEditingLot] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState('');

  if (!user?.is_admin) {
    return (
      <div className="admin-error">
        <h2>Доступ запрещён</h2>
        <p>Эта страница доступна только администраторам.</p>
        <button onClick={() => onNavigate('/')}>Вернуться на главную</button>
      </div>
    );
  }

  useEffect(() => {
    loadLots();
  }, []);

  const loadLots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/lots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      
      const data = await response.json();
      setLots(data);
    } catch (err) {
      console.error('❌ Ошибка загрузки лотов:', err);
      alert('Ошибка загрузки лотов');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLot = async (lotId) => {
    if (!confirm('Вы уверены, что хотите удалить этот лот?')) return;
    
    try {
      const response = await fetch(`/api/admin/lots/${lotId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadLots(); // Перезагружаем список
        setMessage('Лот успешно удалён');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Ошибка при удалении');
      }
    } catch (err) {
      console.error('❌ Ошибка удаления:', err);
      alert('Ошибка при удалении лота');
    }
  };

  // ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ
  const handleCreateLot = async (newLotData) => {
    console.log('🔄 Создание лота:', newLotData);
    
    try {
      const response = await fetch('/api/admin/lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newLotData)
      });
      
      if (response.ok) {
        const createdLot = await response.json();
        console.log('✅ Лот создан:', createdLot);
        
        loadLots(); // Перезагружаем список
        setShowCreateForm(false);
        setMessage('Лот успешно создан');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при создании');
      }
    } catch (err) {
      console.error('❌ Ошибка создания:', err);
      alert('Ошибка при создании лота: ' + err.message);
    }
  };

  // ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ - БЕЗ ДОПОЛНИТЕЛЬНОГО PUT
  const handleUpdateLot = (updatedLot) => {
    console.log('🔄 Лот обновлен через EditLotForm:', updatedLot);
    
    // Просто перезагружаем список
    loadLots();
    setEditingLot(null);
    setMessage('Лот успешно обновлён');
    setTimeout(() => setMessage(''), 3000);
  };

  const getStatusBadge = (lot) => {
    const now = new Date();
    const start = new Date(lot.start_time);
    const end = new Date(lot.end_time);
    
    if (now < start) return <span className="status-badge upcoming">Скоро</span>;
    if (now >= start && now <= end) return <span className="status-badge active">Активен</span>;
    return <span className="status-badge ended">Завершён</span>;
  };

  if (editingLot) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <button onClick={() => setEditingLot(null)} className="back-btn">
            ← Назад к списку
          </button>
          <h2>Редактирование лота: {editingLot.title}</h2>
        </div>
        <EditLotForm 
          lot={editingLot}
          token={token}
          onUpdate={handleUpdateLot}
          onCancel={() => setEditingLot(null)}
        />
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>👑 Админ-панель: Управление лотами</h1>
        <button 
          className="create-lot-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + Создать новый лот
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Создание нового лота</h2>
            <EditLotForm 
              lot={{
                title: '', description: '', bottle_condition: '', 
                start_price: 0, min_step: 0,
                start_time: new Date().toISOString().slice(0, 16),
                end_time: new Date(Date.now() + 7*24*60*60000).toISOString().slice(0, 16),
                image_url: ''
              }}
              token={token}
              onUpdate={handleCreateLot}
              onCancel={() => setShowCreateForm(false)}
              isCreating={true}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Загрузка лотов...</div>
      ) : (
        <div className="admin-lots-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Изображение</th>
                <th>Название</th>
                <th>Текущая цена</th>
                <th>Статус</th>
                <th>Начало</th>
                <th>Окончание</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {lots.map(lot => (
                <tr key={lot.id}>
                  <td>{lot.id}</td>
                  <td>
                    {lot.image_url ? 
                      <img src={lot.image_url} alt={lot.title} className="admin-thumb" /> :
                      <div className="admin-thumb-placeholder">🍷</div>
                    }
                  </td>
                  <td className="lot-title-cell">{lot.title}</td>
                  <td className="price-cell">{lot.current_price} ₽</td>
                  <td>{getStatusBadge(lot)}</td>
                  <td>{new Date(lot.start_time).toLocaleDateString()}</td>
                  <td>{new Date(lot.end_time).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button 
                      className="edit-btn"
                      onClick={() => setEditingLot(lot)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteLot(lot.id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-stats">
        <h3>Статистика:</h3>
        <p>Всего лотов: {lots.length}</p>
        <p>Активных: {lots.filter(l => {
          const now = new Date();
          return new Date(l.start_time) <= now && new Date(l.end_time) >= now;
        }).length}</p>
        <p>Завершённых: {lots.filter(l => new Date(l.end_time) < new Date()).length}</p>
      </div>
    </div>
  );
}

