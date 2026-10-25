import React, { useState } from 'react';

export default function EditLotForm({ lot, token, onUpdate, onCancel, isCreating = false }) {
  console.log('=========================================');
  console.log('🔍 EditLotForm - ПОЛУЧЕННЫЕ ДАННЫЕ:');
  console.log('=========================================');
  console.log('📦 lot:', lot);
  console.log('📌 lot.id:', lot?.id);
  console.log('📌 lot.min_step:', lot?.min_step);
  console.log('📌 Тип lot.min_step:', typeof lot?.min_step);
  console.log('📌 lot.min_step как число:', parseFloat(lot?.min_step));
  console.log('📌 lot.start_price:', lot?.start_price);
  console.log('📌 lot.current_price:', lot?.current_price);
  console.log('📌 isCreating:', isCreating);
  console.log('=========================================');  //убрать что сверху
  console.log('🔍 EditLotForm получил lot:', lot);
  console.log('🔍 ID лота:', lot?.id);
  console.log('🔍 isCreating:', isCreating);
  const [formData, setFormData] = useState({
    title: lot.title,
    description: lot.description,
    
    // Винные характеристики
    vintage: lot.vintage || '',
    wine_type: lot.wine_type || 'red',
    sweetness: lot.sweetness || 'dry',
    volume: lot.volume || '0.75',
    alcohol: lot.alcohol || '13.5',
    country: lot.country || '',
    region: lot.region || '',
    appellation: lot.appellation || '',
    producer: lot.producer || '',
    grape_variety: lot.grape_variety || '',
    
    // Состояние
    bottle_condition: lot.bottle_condition || 'Отличное',
    
    // Аукционные параметры
    start_price: lot.start_price,
    min_step: lot.min_step,
    start_time: lot.start_time ? lot.start_time.slice(0, 16) : '',
    end_time: lot.end_time ? lot.end_time.slice(0, 16) : '',
    max_extensions: lot.max_extensions || '15',
    
    // Изображение
    image_url: lot.image_url || ''
  });
  
  console.log('📊 ДАННЫЕ В STATE ПОСЛЕ УСТАНОВКИ:');
  console.log('formData.min_step:', formData.min_step);
  console.log('Тип formData.min_step:', typeof formData.min_step);
  console.log('formData.start_price:', formData.start_price);
  console.log('=========================================');  //убрать затем
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(lot.image_url || null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
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


    console.log('=========================================');
    console.log('📤 ПЕРЕД ОТПРАВКОЙ НА СЕРВЕР:');
    console.log('=========================================');
    console.log('formData.min_step:', formData.min_step);
    console.log('Тип formData.min_step:', typeof formData.min_step);
    console.log('parseFloat(formData.min_step):', parseFloat(formData.min_step));
    console.log('formData.start_price:', formData.start_price);
    console.log('parseFloat(formData.start_price):', parseFloat(formData.start_price));
    console.log('=========================================');//  Удалить потом
    // Валидация дат
    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      setError('Дата окончания должна быть позже даты начала');
      setLoading(false);
      return;
    }

    try {
      let imageUrl = formData.image_url; // Используем существующий URL по умолчанию
      
      // Загружаем новое изображение ТОЛЬКО если пользователь выбрал файл
      if (imageFile) {
        setUploadingImage(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        
        const uploadResponse = await fetch('/api/upload/wine-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.trim()}`
          },
          body: uploadFormData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
          console.log('✅ Новое изображение загружено:', imageUrl);
        } else {
          throw new Error('Ошибка загрузки изображения');
        }
        setUploadingImage(false);
      }
      
      const url = isCreating 
        ? '/api/admin/lots' 
        : `/api/admin/lots/${lot.id}`;
      
      const method = isCreating ? 'POST' : 'PUT';

      // Подготавливаем данные для отправки
      /*const dataToSend = {
        title: formData.title,
        description: formData.description,
        vintage: formData.vintage ? parseInt(formData.vintage) : null,
        wine_type: formData.wine_type,
        sweetness: formData.sweetness,
        volume: formData.volume ? parseFloat(formData.volume) : null,
        alcohol: formData.alcohol ? parseFloat(formData.alcohol) : null,
        country: formData.country || null,
        region: formData.region || null,
        appellation: formData.appellation || null,
        producer: formData.producer || null,
        grape_variety: formData.grape_variety || null,
        bottle_condition: formData.bottle_condition,
        start_price: parseFloat(formData.start_price),
        min_step: parseFloat(formData.min_step),
        start_time: formData.start_time,
        end_time: formData.end_time,
        max_extensions: parseInt(formData.max_extensions),
        image_url: imageUrl
      };*/

      const dataToSend = {
        title: formData.title || null,  // Добавлено || null
        description: formData.description || null,  // Добавлено || null
        vintage: formData.vintage ? parseInt(formData.vintage) : null,
        wine_type: formData.wine_type || null,  // ✅ Исправлено!
        sweetness: formData.sweetness || null,  // Добавлено || null
        volume: formData.volume ? parseFloat(formData.volume) : null,
        alcohol: formData.alcohol ? parseFloat(formData.alcohol) : null,
        country: formData.country || null,
        region: formData.region || null,
        appellation: formData.appellation || null,
        producer: formData.producer || null,
        grape_variety: formData.grape_variety || null,
        bottle_condition: formData.bottle_condition || null,  // Добавлено || null
        start_price: parseFloat(formData.start_price),
        min_step: parseFloat(formData.min_step),
        start_time: formData.start_time || null,  // Добавлено || null
        end_time: formData.end_time || null,  // Добавлено || null
        max_extensions: parseInt(formData.max_extensions) || 15,  // Добавлено значение по умолчанию
        image_url: imageUrl || null  // Добавлено || null
    };

      // Если создаем новый лот, добавляем current_price
      if (isCreating) {
        dataToSend.current_price = parseFloat(formData.start_price);
      }

      console.log('📤 Отправляем данные:', dataToSend);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при сохранении');
      }

      const savedLot = await response.json();
      console.log('✅ Успешно сохранено:', savedLot);
      onUpdate(savedLot);
    } catch (err) {
      console.error('❌ Ошибка:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="edit-lot-form">
      <h2>{isCreating ? '➕ Добавление нового лота' : '✏️ Редактирование лота'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {/* Изображение */}
        <div className="form-section">
          <h3>📸 Изображение вина</h3>
          <div className="form-group">
            {formData.image_url && !imageFile && imagePreview && (
              <div className="current-image">
                <img src={imagePreview} alt="Current" style={{ maxWidth: '200px', marginBottom: '10px' }} />
                <p style={{ fontSize: '12px', color: 'green' }}>✓ Текущее изображение (будет сохранено)</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <small>Оставьте пустым, чтобы сохранить текущее изображение</small>
            {imageFile && imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px' }} />
                <p style={{ fontSize: '12px', color: 'orange' }}>🔄 Новое изображение (будет загружено)</p>
              </div>
            )}
          </div>
        </div>

        {/* Основная информация */}
        <div className="form-section">
          <h3>🍷 Основная информация</h3>
          
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Описание *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
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
                <option value="Розоваое">Розовое</option>
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
            <label>Апелласьон (AOC/AOP)</label>
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
                min="0"
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
                min="0"
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
            <small>Количество раз, которое аукцион может быть продлён при ставках в последний момент</small>
          </div>
        </div>

        <div className="form-buttons">
          <button type="button" onClick={onCancel} className="btn-cancel">
            Отмена
          </button>
          <button type="submit" disabled={loading || uploadingImage} className="btn-save">
            {loading ? 'Сохранение...' : uploadingImage ? '📤 Загрузка изображения...' : (isCreating ? '➕ Создать лот' : '💾 Сохранить изменения')}
          </button>
        </div>
      </form>
    </div>
  );
}