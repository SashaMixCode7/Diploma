
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
//import { getAuctions } from '../../services/api';
import { getAuctions, getLots, createLot } from '../../services/api';  //исправление цены
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './CalendarPage.css';

const CalendarPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('dayGridMonth');
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        const data = await getLots();   //исправление цены
        console.log('Загружены аукционы:', data);
        setAuctions(data);
      } catch (err) {
        console.error('Ошибка загрузки:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctions();
  }, []);

  // ========== Функция определения статуса лота ==========
  /*const getLotStatus = (auction) => {
    if (!auction.date) return auction.is_active ? 'active' : 'ended';
    
    const now = new Date();
    const start = new Date(auction.date);
    
    // Если есть время окончания - используем его, иначе добавляем 2 часа
    let end;
    if (auction.end_date) {
      end = new Date(auction.end_date);
    } else {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }
    
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'ended';
  };*/
    const getLotStatus = (auction) => {
    if (!auction.start_time) return auction.is_active ? 'active' : 'ended';
  
    const now = new Date();
    const start = new Date(auction.start_time);
    const end = new Date(auction.end_time || new Date(start.getTime() + 2 * 60 * 60 * 1000));
  
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'ended';
  };

  // ========== Преобразуем аукционы в события ==========
  const calendarEvents = auctions.map((auction, index) => {
    const startDate = new Date(auction.start_time);   //start_time для цены
    
    // Если есть end_date - используем, иначе +2 часа
    let endDate;
    if (auction.end_date) {
      endDate = new Date(auction.end_date);
    } else {
      endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    }

    const status = getLotStatus(auction);
    const colorIndex = index % 10;
    
    // Определяем цену для отображения в зависимости от статуса
    let displayPrice;
    let priceLabel;
    
    if (status === 'upcoming') {
      displayPrice = auction.start_price || 0;
      priceLabel = 'Стартовая';
    } else if (status === 'active') {
      displayPrice = auction.current_price || auction.start_price || 0;
      priceLabel = 'Текущая';
    } else { // ended
      displayPrice = auction.final_price || auction.current_price || auction.start_price || 0;
      priceLabel = 'Продано';
    }
    
    return {
      id: auction.id,
      title: auction.title,
      start: startDate,
      end: endDate,
      extendedProps: {
        // ========== ВРЕМЯ НАЧАЛА И ОКОНЧАНИЯ ==========
        start_time: startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        end_time: endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        start_date: startDate,
        end_date: endDate,
        current_price: auction.current_price || auction.start_price || 0,
        start_price: auction.start_price || 0,
        display_price: displayPrice,
        price_label: priceLabel,
        lots_count: auction.lots_count || 0,
        status: status,
        description: auction.description || 'Винный аукцион',
        colorIndex: colorIndex,
        is_active: auction.is_active
      },
      className: `auction-event ${status} event-color-${colorIndex}`,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: '#ffffff'
    };
  });

  console.log('Всего событий для календаря:', calendarEvents.length);

  // ========== Обработчик клика по событию ==========
  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      date: clickInfo.event.start,
      start_time: clickInfo.event.extendedProps.start_time,
      end_time: clickInfo.event.extendedProps.end_time,
      start_date: clickInfo.event.extendedProps.start_date,
      end_date: clickInfo.event.extendedProps.end_date,
      ...clickInfo.event.extendedProps
    });
  };

  const changeView = (view) => {
    setViewMode(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  };

  // ========== Кастомный рендер события ==========
  const renderEventContent = (eventInfo) => {
    const { status, display_price, price_label, start_time, end_time } = eventInfo.event.extendedProps;
    const title = eventInfo.event.title;
    
    const shortTitle = title.length > 20 ? title.substring(0, 18) + '...' : title;
    
    // Иконка и цвет статуса
    let statusIcon;
    let statusColor;
    if (status === 'upcoming') {
      statusIcon = 'bi-clock-history';
      statusColor = '#ffc107';
    } else if (status === 'active') {
      statusIcon = 'bi-graph-up';
      statusColor = '#28a745';
    } else {
      statusIcon = 'bi-check-circle';
      statusColor = '#6c757d';
    }

    // Цвет цены в зависимости от статуса
    let priceColor;
    if (status === 'upcoming') priceColor = '#ffc107';
    else if (status === 'active') priceColor = '#28a745';
    else priceColor = '#6c757d';

    return (
      <div className="fc-event-custom">
        <div className="event-header">
          <i className={`bi ${statusIcon}`} style={{ color: statusColor, fontSize: '12px' }}></i>
          <strong className="event-title" title={title}>{shortTitle}</strong>
        </div>
        {/* ========== ВРЕМЯ В КАЛЕНДАРЕ ========== */}
        <div className="event-time">
          <i className="bi bi-clock" style={{ fontSize: '10px' }}></i>
          {start_time} — {end_time}
        </div>
        <div className="event-price" style={{ color: priceColor }}>
          <i className="bi bi-currency-ruble" style={{ fontSize: '10px' }}></i>
          {display_price?.toLocaleString() || 0} ₽
          <span className="price-badge" style={{ 
            background: priceColor, 
            color: 'white',
            padding: '1px 6px',
            borderRadius: '3px',
            fontSize: '8px',
            marginLeft: '4px'
          }}>
            {price_label}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
        <p>Загрузка календаря торгов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-error">
        <i className="bi bi-exclamation-triangle-fill"></i>
        <h2>Ошибка загрузки</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          <i className="bi bi-arrow-repeat"></i> Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="calendar-page-wrapper">
      <div className="container-fluid px-4 py-4">
        {/* Хедер */}
        <div className="calendar-header mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="display-5 fw-bold text-gradient">
                <i className="bi bi-calendar-event text-danger me-3"></i>
                Календарь винных аукционов
              </h1>
              <p className="text-muted mt-2">
                Все предстоящие, текущие и завершённые торги в одном месте
              </p>
            </div>
            
            <div className="btn-group" role="group">
              <button 
                className={`btn ${viewMode === 'dayGridMonth' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => changeView('dayGridMonth')}
              >
                <i className="bi bi-calendar-month"></i> Месяц
              </button>
              <button 
                className={`btn ${viewMode === 'timeGridWeek' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => changeView('timeGridWeek')}
              >
                <i className="bi bi-calendar-week"></i> Неделя
              </button>
              <button 
                className={`btn ${viewMode === 'timeGridDay' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => changeView('timeGridDay')}
              >
                <i className="bi bi-calendar-day"></i> День
              </button>
            </div>
          </div>
        </div>

        {/* ========== СТАТИСТИКА ========== */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="stats-card">
              <i className="bi bi-calendar-range stats-icon text-primary"></i>
              <div className="stats-info">
                <h3>{auctions.length}</h3>
                <p>Всего аукционов</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stats-card">
              <i className="bi bi-play-circle-fill stats-icon text-success"></i>
              <div className="stats-info">
                <h3>{auctions.filter(a => getLotStatus(a) === 'active').length}</h3>
                <p>Активных торгов</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stats-card">
              <i className="bi bi-clock-history stats-icon text-warning"></i>
              <div className="stats-info">
                <h3>{auctions.filter(a => getLotStatus(a) === 'upcoming').length}</h3>
                <p>Предстоящих торгов</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="stats-card">
              <i className="bi bi-currency-ruble stats-icon text-info"></i>
              <div className="stats-info">
                <h3>
                  {Math.max(...auctions.map(a => a.start_price || 0)).toLocaleString()} ₽
                </h3>
                <p>Макс. стартовая</p>
              </div>
            </div>
          </div>
        </div>

        {/* FullCalendar */}
        <div className="calendar-container card shadow-lg">
          <div className="card-body p-0">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={viewMode}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              height="auto"
              locale="ru"
              firstDay={1}
              buttonText={{
                today: 'Сегодня',
                month: 'Месяц',
                week: 'Неделя',
                day: 'День'
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              allDaySlot={false}
              slotMinTime="08:00:00"
              slotMaxTime="22:00:00"
            />
          </div>
        </div>

        {/* ========== ЛЕГЕНДА ========== */}
        <div className="legend mt-4 d-flex justify-content-center gap-4 flex-wrap">
          <div className="legend-item">
            <span className="badge bg-warning me-2">&nbsp;&nbsp;&nbsp;</span>
            <span> Предстоящие</span>
          </div>
          <div className="legend-item">
            <span className="badge bg-success me-2">&nbsp;&nbsp;&nbsp;</span>
            <span> Активные</span>
          </div>
          <div className="legend-item">
            <span className="badge bg-secondary me-2">&nbsp;&nbsp;&nbsp;</span>
            <span> Завершённые</span>
          </div>
          <div className="legend-item">
            <i className="bi bi-currency-ruble text-danger me-2"></i>
            <span>Цена: стартовая / текущая / продано</span>
          </div>
        </div>
      </div>

      {/* ========== МОДАЛЬНОЕ ОКНО ========== */}
      {selectedEvent && (
        <div className="modal show d-block" tabIndex="-1" onClick={() => setSelectedEvent(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header bg-gradient-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-wine me-2"></i>
                  {selectedEvent.title}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedEvent(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    {/* Дата */}
                    <div className="detail-item">
                      <i className="bi bi-calendar3 text-danger"></i>
                      <strong>Дата:</strong>
                      <span>{new Date(selectedEvent.date).toLocaleDateString('ru', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>
                    
                    {/* ========== ВРЕМЯ НАЧАЛА ========== */}
                    <div className="detail-item">
                      <i className="bi bi-play-circle-fill text-success"></i>
                      <strong>Начало торгов:</strong>
                      <span className="fw-bold text-success">{selectedEvent.start_time || '—'}</span>
                    </div>
                    
                    {/* ========== ВРЕМЯ ОКОНЧАНИЯ ========== */}
                    <div className="detail-item">
                      <i className="bi bi-stop-circle-fill text-danger"></i>
                      <strong>Окончание торгов:</strong>
                      <span className="fw-bold text-danger">{selectedEvent.end_time || '—'}</span>
                    </div>
                    
                    {/* Стартовая цена */}
                    <div className="detail-item">
                      <i className="bi bi-currency-ruble text-danger"></i>
                      <strong>Стартовая цена:</strong>
                      <span>{selectedEvent.start_price?.toLocaleString() || 0} ₽</span>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    {/* ========== ДИНАМИЧЕСКАЯ ЦЕНА ========== */}
                    <div className="detail-item">
                      <i className="bi bi-graph-up text-danger"></i>
                      <strong>
                        {selectedEvent.status === 'upcoming' ? 'Стартовая цена:' : 
                         selectedEvent.status === 'active' ? 'Текущая цена:' : 
                         'Цена продажи:'}
                      </strong>
                      <span className={`fw-bold ${
                        selectedEvent.status === 'active' ? 'text-success' : 
                        selectedEvent.status === 'upcoming' ? 'text-warning' : 
                        'text-secondary'
                      }`}>
                        {selectedEvent.display_price?.toLocaleString() || 0} ₽
                      </span>
                      <span className="badge bg-light text-dark ms-2">
                        {selectedEvent.price_label}
                      </span>
                    </div>
                    
                    {/* Количество лотов */}
                    <div className="detail-item">
                      <i className="bi bi-grid-3x3-gap-fill text-danger"></i>
                      <strong>Количество лотов:</strong>
                      <span>{selectedEvent.lots_count || 0}</span>
                    </div>
                    
                    {/* ========== СТАТУС ========== */}
                    <div className="detail-item">
                      <i className={`bi ${
                        selectedEvent.status === 'upcoming' ? 'bi-clock-history text-warning' :
                        selectedEvent.status === 'active' ? 'bi-play-circle-fill text-success' : 
                        'bi-check-circle-fill text-secondary'
                      }`}></i>
                      <strong>Статус:</strong>
                      <span className={
                        selectedEvent.status === 'upcoming' ? 'text-warning' :
                        selectedEvent.status === 'active' ? 'text-success' : 
                        'text-secondary'
                      }>
                        {selectedEvent.status === 'upcoming' ? '⏳ Предстоит' :
                         selectedEvent.status === 'active' ? '🔴 Активен' : 
                         '✅ Завершён'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedEvent.description && (
                  <div className="mt-3">
                    <hr />
                    <p className="text-muted">{selectedEvent.description}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
                  <i className="bi bi-x-circle"></i> Закрыть
                </button>
                {selectedEvent.status === 'active' && (
                  <Link to={`/lots?lotId=${selectedEvent.id}`} className="btn btn-danger">
                    <i className="bi bi-gavel"></i> Участвовать в торгах
                  </Link>
                )}
                {selectedEvent.status === 'upcoming' && (
                  <button className="btn btn-warning" disabled>
                    <i className="bi bi-clock-history"></i> Скоро начнётся
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;

