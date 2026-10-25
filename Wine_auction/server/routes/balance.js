module.exports = (pool, authenticateToken) => {
    const router = require('express').Router();
    
    // Получить баланс
    router.get('/', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT balance FROM users WHERE id = $1',
                [req.user.id]
            );
            res.json({ balance: parseFloat(result.rows[0].balance) });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    
    // Пополнить депозит
    router.post('/deposit', authenticateToken, async (req, res) => {
        const { amount } = req.body;
        
        if (amount <= 0 || amount < 10) {
            return res.status(400).json({ error: 'Минимальная сумма 1000 ₽' });
        }
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const result = await client.query(
                'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
                [amount, req.user.id]
            );
            
            await client.query(
                'INSERT INTO transactions (user_id, amount, type, status) VALUES ($1, $2, $3, $4)',
                [req.user.id, amount, 'deposit', 'completed']
            );
            
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                newBalance: parseFloat(result.rows[0].balance),
                message: `Депозит пополнен на ${amount} ₽`
            });
        } catch (err) {
            await client.query('ROLLBACK');
            res.status(500).json({ error: err.message });
        } finally {
            client.release();
        }
    });
    //Получение информации о пользователе
    /*router.get('/users/me', async (req, res) => {
    const result = await pool.query(
        'SELECT id, first_name, last_name, email, phone, created_at FROM users WHERE id = $1',
        [req.user.id]
    );
    res.json(result.rows[0]);
    });*/
     // Активные ставки пользователя
    /*router.get('/users/active-bids', async (req, res) => {
    const result = await pool.query(
        `SELECT b.*, l.title as lot_title, l.end_time,
                CASE WHEN l.current_winner_id = b.user_id THEN true ELSE false END as is_leader,
                ab.max_amount as max_bid
         FROM bids b
         JOIN lots l ON b.lot_id = l.id
         LEFT JOIN auto_bids ab ON ab.lot_id = l.id AND ab.user_id = b.user_id
         WHERE b.user_id = $1 AND l.end_time > NOW()
         ORDER BY b.created_at DESC`,
        [req.user.id]
    );
    res.json(result.rows);
    });*/

    // История всех ставок пользователя
    /*router.get('/users/my-bids', async (req, res) => {
    const result = await pool.query(
        `SELECT b.*, l.title as lot_title,
                CASE WHEN l.current_winner_id = b.user_id AND l.end_time < NOW() 
                     THEN true ELSE false END as is_winner
         FROM bids b
         JOIN lots l ON b.lot_id = l.id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC
         LIMIT 50`,
        [req.user.id]
    );
    res.json(result.rows);
    });*/

    // История транзакции
    /*router.get('/balance/transactions', async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.id]
    );
    res.json(result.rows);
    });*/
     //Активные ставки пользователя
    router.get('/users/active-bids', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT DISTINCT ON (b.lot_id) 
                    b.id, b.lot_id, b.amount, b.created_at, b.max_bid_amount,
                    l.title as lot_title, l.current_price, l.end_time,
                    l.current_winner_id,
                    CASE WHEN l.current_winner_id = $1 THEN true ELSE false END as is_leader
                 FROM bids b
                 JOIN lots l ON b.lot_id = l.id
                 WHERE b.user_id = $1 
                   AND l.is_active = true
                   AND l.end_time > NOW()
                   AND l.start_time <= NOW()
                 ORDER BY b.lot_id, b.created_at DESC`,
                [req.user.id]
            );
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    //История всех ставок пользователя
    router.get('/users/bid-history', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT b.*, l.title as lot_title, l.end_time,
                        CASE WHEN l.current_winner_id = $1 AND l.end_time < NOW() 
                             THEN true ELSE false END as is_winner
                 FROM bids b
                 JOIN lots l ON b.lot_id = l.id
                 WHERE b.user_id = $1
                 ORDER BY b.created_at DESC
                 LIMIT 50`,
                [req.user.id]
            );
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    //История транзакций
    router.get('/balance/transactions', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM transactions 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 100`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

    
    // История выигранных лотов
    /*router.get('/won-lots', async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT * FROM lots 
                 WHERE current_winner_id = $1 AND is_active = false
                 ORDER BY end_time DESC`,
                [req.user.id]
            );
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });*/

    router.get('/won-lots', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                l.id,
                l.title,
                l.description,
                l.current_price,
                l.image_url,
                l.end_time,
                l.current_winner_id,
                b.amount as winning_bid,
                b.created_at as won_date
            FROM lots l
            INNER JOIN bids b ON b.lot_id = l.id AND b.amount = l.current_price
            WHERE l.current_winner_id = $1 
              AND l.is_active = true
              AND l.end_time < NOW()
            ORDER BY l.end_time DESC
        `, [req.user.id]);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка получения выигранных лотов:', err);
        res.status(500).json({ error: err.message });
    }
});
    
    return router;
};
