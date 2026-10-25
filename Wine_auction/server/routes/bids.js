
// Добавлен для установки лимита при автоматической ставке

module.exports = (pool, authenticateToken, io) => {
    const router = require('express').Router();
    router.use(authenticateToken);
    
    // ✅ Получение последних 3 ставок
    router.get('/recent/:lotId', async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT b.*, u.first_name || ' ' || u.last_name as user_name
                 FROM bids b
                 JOIN users u ON b.user_id = u.id
                 WHERE b.lot_id = $1
                 ORDER BY b.created_at DESC
                 LIMIT 3`,
                [req.params.lotId]
            );
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    
    // ✅ Получение максимальной автоставки пользователя
    router.get('/my-max-bid/:lotId', async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT max_amount FROM auto_bids 
                 WHERE lot_id = $1 AND user_id = $2`,
                [req.params.lotId, req.user.id]
            );
            res.json({ max_bid: result.rows[0]?.max_amount || null });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    
   
    router.post('/set-max-bid/:lotId', async (req, res) => {
        const { max_amount } = req.body;
        const lotId = req.params.lotId;
        const userId = req.user.id;
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Проверяем, что аукцион активен
            const lotCheck = await client.query(
                'SELECT start_time, end_time, current_price, current_winner_id, min_step FROM lots WHERE id = $1 FOR UPDATE',
                [lotId]
            );
            
            if (lotCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Лот не найден' });
            }
            
            const lot = lotCheck.rows[0];
            const now = new Date();
            const start = new Date(lot.start_time);
            const end = new Date(lot.end_time);
            
            if (now < start) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Аукцион ещё не начался' });
            }
            
            if (now > end) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Аукцион уже завершён' });
            }
            
            // Проверяем, что максимальная ставка не меньше текущей цены + шаг
            const minBid = Number(lot.current_price) + Number(lot.min_step);
            if (max_amount < minBid) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    error: `Максимальная ставка должна быть не меньше ${minBid} ₽`,
                    min_bid: minBid
                });
            }
            
            // Сохраняем или обновляем автоставку
            const existing = await client.query(
                'SELECT id FROM auto_bids WHERE lot_id = $1 AND user_id = $2',
                [lotId, userId]
            );
            
            if (existing.rows.length > 0) {
                await client.query(
                    'UPDATE auto_bids SET max_amount = $1, updated_at = NOW() WHERE lot_id = $2 AND user_id = $3',
                    [max_amount, lotId, userId]
                );
            } else {
                await client.query(
                    'INSERT INTO auto_bids (lot_id, user_id, max_amount, created_at) VALUES ($1, $2, $3, NOW())',
                    [lotId, userId, max_amount]
                );
            }
            
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                max_bid: max_amount,
                message: 'Максимальная ставка установлена'
            });
            
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Ошибка установки автоставки:', err);
            res.status(500).json({ error: err.message });
        } finally {
            client.release();
        }
    });
    


    router.post('/:lotId', async (req, res) => {
    //const minStep = 500.00;  //временное решение проблемы для шага
    const { amount } = req.body;
    const lotId = req.params.lotId;
    const userId = req.user.id;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // ✅ 1. СНАЧАЛА БЛОКИРУЕМ ЛОТ
    const lotResult = await client.query(
      `SELECT * FROM lots WHERE id = $1 FOR UPDATE`,
      [lotId]
    );
    
    if (lotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Лот не найден' });
    }
    
    const lot = lotResult.rows[0];
    const now = new Date();
    const startTime = new Date(lot.start_time);
    const endTime = new Date(lot.end_time);
    
    // 2. Проверки
    if (now < startTime) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Аукцион ещё не начался' });
    }
    
    if (now > endTime) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Аукцион уже завершён' });
    }
    
    const minBid = lot.current_price === lot.start_price && !lot.current_winner_id
      ? lot.start_price
      : parseFloat(lot.current_price) + parseFloat(lot.min_step);
    
    if (amount < minBid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Минимальная ставка: ${minBid}₽`,
        min_bid: minBid
      });
    }
    
    if (lot.current_winner_id === userId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Вы уже являетесь лидером' });
    }
    
    // 3. Создаём ставку
    await client.query(
      `INSERT INTO bids (lot_id, user_id, amount, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [lotId, userId, amount]
    );
    
    // 4. Обновляем лот
    await client.query(
      `UPDATE lots 
       SET current_price = $1, current_winner_id = $2
       WHERE id = $3`,
      [amount, userId, lotId]
    );
    
    // 5. ✅ ПОЛУЧАЕМ ОБНОВЛЁННЫЙ ЛОТ С ИМЕНЕМ ПОБЕДИТЕЛЯ (БЕЗ FOR UPDATE)
    const updatedLotResult = await client.query(
      `SELECT l.*, u.first_name || ' ' || u.last_name as winner_name
       FROM lots l
       LEFT JOIN users u ON l.current_winner_id = u.id
       WHERE l.id = $1`,  // 👈 НЕТ FOR UPDATE!
      [lotId]
    );
    
    const updatedLot = updatedLotResult.rows[0];
    
    await client.query('COMMIT');
    
    // 6. WebSocket уведомления
    if (io) {
      io.emit(`lot_${lotId}_update`, updatedLot);
      
      const newBid = {
        id: Date.now(),
        lot_id: lotId,
        user_id: userId,
        user_name: req.user.first_name + ' ' + req.user.last_name,
        amount: amount,
        created_at: new Date().toISOString()
      };
      io.emit(`lot_${lotId}_new_bid`, newBid);
    }
    
    // 7. Автоставки в фоне
    processAutoBids(pool, io, lotId, userId, null).catch(console.error);
    
    res.json({ success: true, lot: updatedLot });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при ставке:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
    
    return router;
};

// ✅ ФУНКЦИЯ ОБРАБОТКИ АВТОСТАВОК (общая логика)
async function processAutoBids(pool, io, lotId, excludeUserId, newMaxAmount = null) {
    //const minStep = 500.00;  //Принудительное для шага 
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Получаем текущий лот
            const lotResult = await client.query(
                `SELECT * FROM lots WHERE id = $1 FOR UPDATE`,
                [lotId]
            );
            
            if (lotResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return;
            }
            
            let lot = lotResult.rows[0];
            const now = new Date();
            const endTime = new Date(lot.end_time);
            
            if (now > endTime) {
                await client.query('ROLLBACK');
                return;
            }
            
            // Получаем все автоставки для этого лота, кроме исключённого пользователя
            const autoBidsResult = await client.query(
                `SELECT ab.*, u.first_name, u.last_name 
                 FROM auto_bids ab
                 JOIN users u ON ab.user_id = u.id
                 WHERE ab.lot_id = $1 AND ab.user_id != $2
                 ORDER BY ab.max_amount DESC, ab.created_at ASC`,
                [lotId, excludeUserId]
            );
            
            let currentLot = lot;
            let madeBid = true;
            let maxLoop = 10; // Защита от бесконечного цикла
            
            while (madeBid && maxLoop-- > 0) {
                madeBid = false;
                
                for (const autoBid of autoBidsResult.rows) {
                    // Если пользователь уже лидер, пропускаем
                    if (currentLot.current_winner_id === autoBid.user_id) continue;
                    
                    // Вычисляем минимальную ставку для этого пользователя
                    const minRequiredBid = parseFloat(currentLot.current_price) + parseFloat(currentLot.min_step);

                    // ✅ ДОБАВЬТЕ ПРОВЕРКУ:
                    /*let minStep = parseFloat(currentLot.min_step);
                    if (minStep === 0.01) {
                        console.warn('⚠️ Ошибка! min_step = 0.01, исправляем на 500');
                        minStep = 500.00;
                    }*/
                    //const minRequiredBid = parseFloat(currentLot.current_price) + minStep; //Проверка
                    
                    // Если максимальная ставка пользователя меньше минимальной, пропускаем
                    if (autoBid.max_amount < minRequiredBid) continue;
                    
                    // Определяем сумму ставки
                    let bidAmount = minRequiredBid;
                    
                    // Если есть другой пользователь с большей автоставкой, ограничиваем
                    let nextHigherBid = null;
                    for (const other of autoBidsResult.rows) {
                        if (other.user_id !== autoBid.user_id && other.max_amount > bidAmount) {
                            if (nextHigherBid === null || other.max_amount < nextHigherBid) {
                                nextHigherBid = other.max_amount;
                            }
                        }
                    }
                    
                    if (nextHigherBid !== null) {
                        bidAmount = Math.min(bidAmount, nextHigherBid);
                        if (bidAmount < minRequiredBid) continue;
                    }
                    
                    // Делаем ставку
                    await client.query(
                        `INSERT INTO bids (lot_id, user_id, amount, created_at)
                         VALUES ($1, $2, $3, NOW())`,
                        [lotId, autoBid.user_id, bidAmount]
                    );
                    
                    await client.query(
                        `UPDATE lots 
                         SET current_price = $1, current_winner_id = $2
                         WHERE id = $3`,
                        [bidAmount, autoBid.user_id, lotId]
                    );
                    
                    currentLot = (await client.query(
                        `SELECT * FROM lots WHERE id = $1 FOR UPDATE`,
                        [lotId]
                    )).rows[0];
                    
                    madeBid = true;
                    
                    // Отправляем WebSocket уведомление
                    if (io) {
                        const updatedLotResult = await client.query(
                            `SELECT l.*, u.first_name || ' ' || u.last_name as winner_name
                             FROM lots l
                             LEFT JOIN users u ON l.current_winner_id = u.id
                             WHERE l.id = $1`,
                            [lotId]
                        );
                        io.emit(`lot_${lotId}_update`, updatedLotResult.rows[0]);
                        
                        const newBid = {
                            id: Date.now(),
                            lot_id: lotId,
                            user_id: autoBid.user_id,
                            user_name: autoBid.first_name + ' ' + autoBid.last_name,
                            amount: bidAmount,
                            created_at: new Date().toISOString()
                        };
                        io.emit(`lot_${lotId}_new_bid`, newBid);
                    }
                    
                    break; // После ставки начинаем цикл заново
                }
            }
            
            await client.query('COMMIT');
            
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Ошибка в processAutoBids:', err);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Критическая ошибка processAutoBids:', err);
    }
}
