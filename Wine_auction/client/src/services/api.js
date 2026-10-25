



//const API_URL = 'http://localhost:5000/api';
const API_URL = '/api';

// ==================== ЛОТЫ ====================

// Получить все лоты (публичный доступ)
export async function getLots() {
  const res = await fetch(`${API_URL}/public/lots`);
  if (!res.ok) throw new Error('Ошибка загрузки лотов');
  return res.json();
}

// Получить лот по id (публичный доступ)
export async function getLot(id) {
  const res = await fetch(`${API_URL}/public/lots/${id}`);
  if (!res.ok) throw new Error('Лот не найден');
  return res.json();
}

// ==================== КАЛЕНДАРЬ АУКЦИОНОВ ====================

// Получить все аукционы для календаря
export async function getAuctions() {
  const res = await fetch(`${API_URL}/auctions`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Ошибка загрузки календаря');
  }
  return res.json();
}

// Получить лоты по конкретной дате
export async function getAuctionsByDate(date) {
  const res = await fetch(`${API_URL}/auctions/date/${date}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Ошибка загрузки лотов по дате');
  }
  return res.json();
}

// ==================== АДМИН-ПАНЕЛЬ (требуют токен) ====================

// Получить все лоты для админа (с дополнительной информацией)
export async function getAdminLots(token) {
  const response = await fetch(`${API_URL}/admin/lots`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка загрузки лотов');
  }
  return response.json();
}

// Создать новый лот (только админ)
export async function createLot(lotData, token) {
  const response = await fetch(`${API_URL}/admin/lots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(lotData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка создания лота');
  }
  return response.json();
}

// Обновить существующий лот (только админ)
export async function updateLot(id, lotData, token) {
  const response = await fetch(`${API_URL}/admin/lots/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(lotData)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка обновления лота');
  }
  return response.json();
}

// Удалить лот (только админ)
export async function deleteLot(id, token) {
  const response = await fetch(`${API_URL}/admin/lots/${id}`, {
    method: 'DELETE',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка удаления лота');
  }
  return response.json();
}

// ==================== АВТОРИЗАЦИЯ ====================

// Авторизация
export async function login(email, password) {
  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// Регистрация
export async function register(data) {
  const res = await fetch(`${API_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ==================== СТАВКИ ====================

// Сделать ставку
export async function placeBid(lotId, amount, token) {

  const numericAmount = parseFloat(amount);
  
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Некорректная сумма ставки');
  }
  const res = await fetch(`${API_URL}/bids/${lotId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    //body: JSON.stringify({ amount }),
    body: JSON.stringify({ amount: numericAmount }),
  });
  return res.json();
}

// Получить последние ставки для лота
export async function getRecentBids(lotId, token) {
  const res = await fetch(`${API_URL}/lots/${lotId}/recent-bids`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Ошибка загрузки ставок');
  return res.json();
}

// Получить максимальную ставку пользователя
export async function getUserMaxBid(lotId, token) {
  const res = await fetch(`${API_URL}/lots/${lotId}/my-max-bid`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Ошибка загрузки максимальной ставки');
  return res.json();
}

// Установить автоматическую максимальную ставку
export async function setMaxBid(lotId, maxAmount, token) {
  const res = await fetch(`${API_URL}/lots/${lotId}/set-max-bid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ max_amount: maxAmount })
  });
  return res.json();
}
          //Личный кабинет
// Получить активные ставки пользователя
export async function getUserActiveBids(token) {
  const res = await fetch(`${API_URL}/users/active-bids`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Ошибка загрузки активных ставок');
  return res.json();
}

// Получить историю ставок
export async function getUserBidHistory(token) {
  const res = await fetch(`${API_URL}/users/bid-history`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Ошибка загрузки истории ставок');
  return res.json();
}

// Получить историю транзакций
export async function getUserTransactions(token) {
  const res = await fetch(`${API_URL}/balance/transactions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Ошибка загрузки транзакций');
  return res.json();
}

// ==================== БАЛАНС И ПОЛЬЗОВАТЕЛИ ====================

// Получить баланс пользователя
export async function getBalance(token) {
  const res = await fetch(`${API_URL}/balance`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Ошибка загрузки баланса');
  return res.json();
}

// Получить профиль пользователя
export async function getUserProfile(token) {
  const res = await fetch(`${API_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Ошибка загрузки профиля');
  return res.json();
}

// Обновить профиль пользователя
export async function updateUserProfile(userData, token) {
  const res = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error('Ошибка обновления профиля');
  return res.json();
}

// ==================== АУКЦИОН И ВЕБСОКЕТЫ ====================

// Получить активные лоты
export async function getActiveLots() {
  const res = await fetch(`${API_URL}/lots/active`);
  if (!res.ok) throw new Error('Ошибка загрузки активных лотов');
  return res.json();
}

// Получить лоты пользователя (выигранные)
/*export async function getUserWonLots(token) {
  const res = await fetch(`${API_URL}/lots/won`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Ошибка загрузки выигранных лотов');
  return res.json();
}*/
export async function getUserWonLots(token) {
    try {
        const res = await fetch(`${API_URL}/lots/won`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            // Если ошибка, пробуем альтернативный маршрут
            const altRes = await fetch(`${API_URL}/balance/won-lots`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (altRes.ok) {
                return await altRes.json();
            }
            throw new Error('Ошибка загрузки выигранных лотов');
        }
        
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('Ошибка загрузки выигранных лотов:', err);
        return [];
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Универсальная функция для обработки ошибок
export function handleApiError(error) {
  console.error('API Error:', error);
  if (error.message === 'Failed to fetch') {
    return 'Ошибка соединения с сервером. Проверьте, запущен ли сервер.';
  }
  return error.message || 'Произошла неизвестная ошибка';
}

// ==================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ АДМИНА ====================

// Получить всех пользователей (только админ)
export async function getAllUsers(token) {
  const response = await fetch(`${API_URL}/admin/users`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка загрузки пользователей');
  }
  return response.json();
}

// Обновить баланс пользователя (только админ)
export async function updateUserBalance(userId, newBalance, token) {
  const response = await fetch(`${API_URL}/admin/users/${userId}/balance`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ balance: newBalance })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Ошибка обновления баланса');
  }
  return response.json();
}