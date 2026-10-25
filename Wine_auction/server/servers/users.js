module.exports = (pool, authenticateToken) => {
    const router = require('express').Router();

    // Профиль
    router.get('/profile', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT id, first_name, last_name, email, phone, 
                       delivery_address, birth_date, balance, is_admin, created_at
                FROM users WHERE id = $1
            `, [req.user.id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Ошибка получения профиля:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    router.put('/profile', authenticateToken, async (req, res) => {
        const { first_name, last_name, phone, delivery_address, birth_date } = req.body;
        try {
            const result = await pool.query(`
                UPDATE users 
                SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
                    phone = COALESCE($3, phone), delivery_address = COALESCE($4, delivery_address),
                    birth_date = COALESCE($5, birth_date), updated_at = NOW()
                WHERE id = $6
                RETURNING id, first_name, last_name, email, phone, delivery_address, birth_date, balance
            `, [first_name, last_name, phone, delivery_address, birth_date, req.user.id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Ошибка обновления профиля:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    // Баланс
    router.get('/balance', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            res.json({ balance: parseFloat(result.rows[0].balance) });
        } catch (err) {
            console.error('Ошибка получения баланса:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    router.post('/balance/deposit', authenticateToken, async (req, res) => {
        const { amount } = req.body;
        if (!amount || amount < 10) {
            return res.status(400).json({ error: 'Минимальная сумма пополнения 1000 ₽' });
        }
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
                'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
                [amount, req.user.id]
            );
            await client.query(`
                INSERT INTO transactions (user_id, type, amount, status, created_at)
                VALUES ($1, 'deposit', $2, 'completed', NOW())
            `, [req.user.id, amount]);
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                newBalance: parseFloat(result.rows[0].balance),
                message: `Баланс пополнен на ${amount} ₽`
            });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Ошибка пополнения баланса:', err);
            res.status(500).json({ error: 'Ошибка при пополнении баланса' });
        } finally {
            client.release();
        }
    });

    // Ставки пользователя
    router.get('/users/active-bids', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT b.id, b.lot_id, b.amount, b.max_bid_amount, b.created_at,
                       l.title as lot_title, l.end_time, l.current_price,
                       (b.amount = (SELECT MAX(amount) FROM bids WHERE lot_id = l.id)) as is_leader
                FROM bids b
                JOIN lots l ON b.lot_id = l.id
                WHERE b.user_id = $1 AND l.is_active = true AND l.end_time > NOW()
                ORDER BY b.created_at DESC
            `, [req.user.id]);
            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка получения активных ставок:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    router.get('/users/bid-history', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT b.id, b.lot_id, b.amount, b.created_at,
                       l.title as lot_title, l.end_time,
                       (l.current_winner_id = $1) as is_winner
                FROM bids b
                JOIN lots l ON b.lot_id = l.id
                WHERE b.user_id = $1
                ORDER BY b.created_at DESC
                LIMIT 100
            `, [req.user.id]);
            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка получения истории ставок:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    router.get('/balance/transactions', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT id, type, amount, status, created_at, description
                FROM transactions WHERE user_id = $1
                ORDER BY created_at DESC LIMIT 50
            `, [req.user.id]);
            res.json(result.rows);
        } catch (err) {
            if (err.message.includes('relation "transactions" does not exist')) {
                return res.json([]);
            }
            console.error('Ошибка получения транзакций:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    router.get('/lots/won', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT l.id, l.title, l.description, l.current_price, l.image_url, 
                       l.end_time, l.current_winner_id, b.amount as winning_bid
                FROM lots l
                JOIN bids b ON b.lot_id = l.id AND b.amount = l.current_price
                WHERE l.current_winner_id = $1 AND l.is_active = false
                ORDER BY l.end_time DESC
            `, [req.user.id]);
            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка получения выигранных лотов:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    return router;
};