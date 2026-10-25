import React, { useState } from 'react';
import './AddLotForm.css';

export default function AddLotForm({ token, onLotAdded, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    
    // Винные характеристики
    vintage: '',
    wine_type: 'red',
    sweetness: 'dry',
    volume: '0.75',
    alcohol: '13.5',
    country: '',
    region: '',
    appellation: '',
    producer: '',
    grape_variety: '',
    
    // Состояние
    bottle_condition: 'Отличное',
    
    // Аукционные параметры
    start_price: '',
    min_step: '',
    start_time: '',
    end_time: '',
    max_extensions: '15'
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Валидация
    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      setError('Дата окончания должна быть позже даты начала');
      setLoading(false);
      return;
    }

    try {
      // Сначала загружаем изображение (если есть)
      let imageUrl = null;
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        
        const uploadResponse = await fetch('/upload/wine-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
        }
      }

      // Создаём лот
      const response = await fetch('/api/admin/lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          start_price: parseFloat(formData.start_price),
          min_step: parseFloat(formData.min_step),
          current_price: parseFloat(formData.start_price),
          volume: parseFloat(formData.volume),
          alcohol: parseFloat(formData.alcohol),
          vintage: formData.vintage ? parseInt(formData.vintage) : null,
          image_url: imageUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании лота');
      }

      const newLot = await response.json();
      onLotAdded(newLot);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-lot-form-container">
      <div className="add-lot-form">
        <div className="form-header">
          <h2>➕ Добавить новый лот</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Изображение */}
          <div className="form-section">
            <h3>📸 Изображение вина</h3>
            <div className="form-group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
                </div>
              )}
            </div>
          </div>

          {/* Основная информация */}
          <div className="form-section">
            <h3>🍷 Основная информация</h3>
            
            <div className="form-group">
              <label>Название вина *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Например: Château Margaux 2015"
                required
              />
            </div>

            <div className="form-group">
              <label>Описание *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Вкусовые характеристики, аромат, особенности..."
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Винтаж (год)</label>
                <input
                  type="number"
                  name="vintage"
                  value={formData.vintage}
                  onChange={handleChange}
                  placeholder="2015"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="form-group">
                <label>Тип вина</label>
                <select name="wine_type" value={formData.wine_type} onChange={handleChange}>
                  <option value="Красное">Красное</option>
                  <option value="Белое">Белое</option>
                  <option value="Розовое">Розовое</option>
                  <option value="Игристое">Игристое</option>
                  <option value="Десертное">Десертное</option>
                </select>
              </div>

              <div className="form-group">
                <label>Сладость</label>
                <select name="sweetness" value={formData.sweetness} onChange={handleChange}>
                  <option value="Сухое">Сухое</option>
                  <option value="Полусухое">Полусухое</option>
                  <option value="Полусладкое">Полусладкое</option>
                  <option value="Сладкое">Сладкое</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Объём (л)</label>
                <input
                  type="number"
                  name="volume"
                  value={formData.volume}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.75"
                />
              </div>

              <div className="form-group">
                <label>Крепость (%)</label>
                <input
                  type="number"
                  name="alcohol"
                  value={formData.alcohol}
                  onChange={handleChange}
                  step="0.1"
                  placeholder="13.5"
                />
              </div>
            </div>
          </div>

          {/* Происхождение */}
          <div className="form-section">
            <h3>🌍 Происхождение</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Страна</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Франция"
                />
              </div>

              <div className="form-group">
                <label>Регион</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="Бордо"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Апелласьон </label>
              <input
                type="text"
                name="appellation"
                value={formData.appellation}
                onChange={handleChange}
                placeholder="Margaux AOC"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Производитель</label>
                <input
                  type="text"
                  name="producer"
                  value={formData.producer}
                  onChange={handleChange}
                  placeholder="Château Margaux"
                />
              </div>

              <div className="form-group">
                <label>Сорт винограда</label>
                <input
                  type="text"
                  name="grape_variety"
                  value={formData.grape_variety}
                  onChange={handleChange}
                  placeholder="Каберне Совиньон, Мерло"
                />
              </div>
            </div>
          </div>

          {/* Состояние */}
          <div className="form-section">
            <h3>📦 Состояние</h3>
            
            <div className="form-group">
              <label>Состояние бутылки</label>
              <select
                name="bottle_condition"
                value={formData.bottle_condition}
                onChange={handleChange}
              >
                <option value="Идеальное">Идеальное (в заводской упаковке)</option>
                <option value="Отличное">Отличное (незначительные следы хранения)</option>
                <option value="Хорошее">Хорошее (есть небольшие повреждения)</option>
                <option value="Удовлетворительное">Удовлетворительное</option>
              </select>
            </div>
          </div>

          {/* Аукционные параметры */}
          <div className="form-section">
            <h3>💰 Аукционные параметры</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Стартовая цена (₽) *</label>
                <input
                  type="number"
                  name="start_price"
                  value={formData.start_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Шаг ставки (₽) *</label>
                <input
                  type="number"
                  name="min_step"
                  value={formData.min_step}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Дата и время начала *</label>
                <input
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Дата и время окончания *</label>
                <input
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Максимальное количество продлений</label>
              <input
                type="number"
                name="max_extensions"
                value={formData.max_extensions}
                onChange={handleChange}
                min="0"
                max="30"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Отмена
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Создание...' : 'Создать лот'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
