import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client'; // WebSocket

export default function BiddingTimer({ lotId, initialEndTime }) {
  const [endTime, setEndTime] = useState(initialEndTime);
  const [timeLeft, setTimeLeft] = useState('');
  const [timeChanged, setTimeChanged] = useState(false);
  const [originalEndTime, setOriginalEndTime] = useState(initialEndTime);

  // Подписка на обновления времени через WebSocket
  useEffect(() => {
    const socket = io('/api/auction');
    
    // Слушаем событие изменения времени для этого лота
    socket.on(`lot_${lotId}_time_changed`, (data) => {
      // Проверяем, что на лот ещё нет ставок (должно проверяться на сервере)
      if (data.canChange && data.newEndTime) {
        setOriginalEndTime(endTime);
        setEndTime(data.newEndTime);
        setTimeChanged(true);
        
        // Показываем уведомление пользователю
        showNotification(`Время аукциона изменено администратором. Новое окончание: ${new Date(data.newEndTime).toLocaleString()}`);
        
        // Скрываем сообщение о переносе через 10 секунд
        setTimeout(() => setTimeChanged(false), 10000);
      }
    });
    
    return () => socket.disconnect();
  }, [lotId, endTime]);

  // Таймер обратного отсчёта
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(endTime) - new Date();
      
      if (diff <= 0) {
        setTimeLeft('Аукцион завершён');
        clearInterval(timer);
        return;
      }
      
      const hours = Math.floor(diff / 3600000);
      const min = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      
      if (hours > 0) {
        setTimeLeft(`${hours}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft(`${min}:${sec.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 'bold', margin: '16px 0' }}>
        ⏰ {timeLeft}
      </div>
      
      {/* Предупреждение об изменении времени */}
      {timeChanged && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffc107',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '14px',
          marginTop: '8px'
        }}>
          ⚠️ Время окончания аукциона было изменено администратором. 
          {originalEndTime && ` Ранее было: ${new Date(originalEndTime).toLocaleString()}`}
        </div>
      )}
      
      {/* Предупреждение для ставок в последние 2 минуты */}
      {timeLeft.includes(':') && parseInt(timeLeft.split(':')[0]) === 0 && parseInt(timeLeft.split(':')[1]) < 2 && (
        <div style={{ 
          backgroundColor: '#ffcccc', 
          border: '1px solid #ff0000',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '14px',
          marginTop: '8px'
        }}>
          ⚡ При ставке в последние 2 минуты время будет продлено на 2 минуты!
        </div>
      )}
    </div>
  );
}

// Вспомогательная функция для уведомлений
function showNotification(message) {
  // Можно использовать любой UI-компонент
  console.log('Notification:', message);
  
  // Если разрешено, показать браузерное уведомление
  if (Notification.permission === 'granted') {
    new Notification('Время аукциона изменено', { body: message });
  }
}