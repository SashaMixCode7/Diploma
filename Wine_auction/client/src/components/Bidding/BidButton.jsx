/*import React, { useState } from 'react';
import { placeBid } from '../../services/api';

export default function BidButton({ lotId, minBid, token }) {
  const [amount, setAmount] = useState(minBid);
  const [message, setMessage] = useState('');

  const handleBid = async () => {
    if (!token) {
      setMessage('Необходимо авторизоваться');
      return;
    }
    try {
      const result = await placeBid(lotId, amount, token);
      if (result.error) {
        setMessage('Ошибка: ' + result.error);
      } else {
        setMessage('Ставка принята! ' + (result.message || ''));
        setAmount(result.newPrice + 50);
      }
    } catch (err) {
      setMessage('Ошибка соединения');
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Сделать ставку</h3>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        min={minBid}
        step={50}
        style={{ padding: 8, marginRight: 8, fontSize: 16 }}
      />
      <button onClick={handleBid} style={{ padding: '10px 24px', fontSize: 16, cursor: 'pointer' }}>
        Сделать ставку
      </button>
      {message && <p style={{ marginTop: 8, color: message.includes('Ошибка') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
}*/
