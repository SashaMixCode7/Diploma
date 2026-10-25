import React from 'react';
import Layout from '../../components/Layout/Layout';
import './ContactsPage.css';

const ContactsPage = ({ onNavigate, currentPage, isLoggedIn, user }) => {
  return (
    
  
      <div className="contacts-page">
        {/* Бордовый левый фон */}
        <div className="contacts-left-bg"></div>
        
        {/* Бордовый правый фон */}
        <div className="contacts-right-bg"></div>
        
        {/* Основной контент */}
        <div className="contacts-content">
          {/* Левая колонка с изображением */}
          <div className="contacts-image-col">
            <img 
              src="/uploads/tabs/office-building.jpg" 
              alt="Офис компании" 
              className="office-image"
            />
          </div>
          
          {/* Правая колонка с информацией */}
          <div className="contacts-info-col">
            {/* Блок офиса */}
            <div className="info-block">
              <h2 className="info-title">Офис</h2>
              <div className="info-content">
                <p className="info-address">
                  125009, г. Москва,<br />
                  ул. Тверская, д. 12, офис 401
                </p>
                <div className="info-details">
                  <p className="info-hours">
                    <strong>Время работы:</strong><br />
                    Пн–Пт: 10:00 – 19:00<br />
                    Сб: 11:00 – 16:00<br />
                    Вс: выходной
                  </p>
                  <p className="info-phone">
                    <strong>Телефон:</strong><br />
                    +7 (495) 123-45-67
                  </p>
                  <p className="info-email">
                    <strong>Email:</strong><br />
                    office@wineauction.ru
                  </p>
                </div>
              </div>
            </div>

            {/* Разделитель */}
            <div className="info-divider"></div>

            {/* Блок склада */}
            <div className="info-block">
              <h2 className="info-title">Склад</h2>
              <div className="info-content">
                <p className="info-address">
                  141400, Московская обл.,<br />
                  г. Химки, ул. Логистическая, д. 5, стр. 3
                </p>
                <div className="info-details">
                  <p className="info-hours">
                    <strong>Время работы склада:</strong><br />
                    Пн–Пт: 10:00 – 18:00<br />
                    (только по предварительной записи)
                  </p>
                  <p className="info-phone">
                    <strong>Телефон склада:</strong><br />
                    +7 (495) 123-45-68
                  </p>
                  <p className="info-email">
                    <strong>Email склада:</strong><br />
                    warehouse@wineauction.ru
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ContactsPage;