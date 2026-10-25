import React, { useEffect, useState } from 'react';
import { getBalance } from '../../services/api';

//console.log('🟢 ProfilePage загружен', { user, token });
export default function ProfilePage({ user, token, onBack }) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (token) {
      getBalance(token).then(data => setBalance(data.balance));
    }
  }, [token]);

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 20, fontFamily: 'Arial' }}>
      <button onClick={onBack} style={{ marginBottom: 16, cursor: 'pointer', padding: '8px 16px' }}>
        ← Назад
      </button>

      <h2>Профиль</h2>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>Имя:</strong> {user?.firstName}</p>
      <p><strong>Баланс:</strong> {balance !== null ? `${balance}₽` : 'Загрузка...'}</p>
    </div>
  );
}
