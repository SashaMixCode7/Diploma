import React, { useState } from 'react';
import { login } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();    //?

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onLogin(result.token, result.user);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20, fontFamily: 'Arial' }}>
      <h2>Вход</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required
          style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <input
          type="password" placeholder="Пароль" value={password}
          onChange={e => setPassword(e.target.value)} required
          style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '12px 24px', fontSize: 16, cursor: 'pointer', background: '#2196F3', color: '#fff', border: 'none', borderRadius: 6, marginRight: 10 }}>
          Войти
        </button>
        <button type="button" onClick={() => navigate('/register')} style={{ padding: '12px 24px', fontSize: 16, cursor: 'pointer', background: '#eee', border: 'none', borderRadius: 6 }}>
          Регистрация
        </button>
      </form>
    </div>
  );
}
