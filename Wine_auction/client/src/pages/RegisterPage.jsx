import React, { useState } from 'react';
import { register } from '../services/api';

export default function RegisterPage({ onLogin }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', birthDate: '', deliveryAddress: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await register(form);
    if (result.error) {
      setError(result.error);
    } else {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onLogin(result.token, result.user);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 20, fontFamily: 'Arial' }}>
      <h2>Регистрация</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input name="firstName" placeholder="Имя" onChange={handleChange} required style={inputStyle} />
        <input name="lastName" placeholder="Фамилия" onChange={handleChange} required style={inputStyle} />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={inputStyle} />
        <input name="phone" placeholder="Телефон" onChange={handleChange} required style={inputStyle} />
        <input name="password" type="password" placeholder="Пароль" onChange={handleChange} required style={inputStyle} />
        <input name="birthDate" type="date" placeholder="Дата рождения" onChange={handleChange} required style={inputStyle} />
        <input name="deliveryAddress" placeholder="Адрес доставки" onChange={handleChange} required style={inputStyle} />
        <button type="submit" style={btnStyle}>Зарегистрироваться</button>
      </form>
    </div>
  );
}

const inputStyle = {
  display: 'block', width: '100%', padding: 10, marginBottom: 10,
  fontSize: 16, borderRadius: 6, border: '1px solid #ccc'
};

const btnStyle = {
  padding: '12px 24px', fontSize: 16, cursor: 'pointer',
  background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6
};

