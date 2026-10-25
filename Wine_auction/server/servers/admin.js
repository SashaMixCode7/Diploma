module.exports = (pool, authenticateToken, isAdmin, io) => {
    const router = require('express').Router();

    // Управление пользователями
    router.get('/users', authenticateToken, isAdmin, async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT id, first_name, last_name, email, phone, balance, is_admin, created_at
                FROM users ORDER BY created_at DESC
            `);
            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка получения пользователей:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    router.put('/users/:id/balance', authenticateToken, isAdmin, async (req, res) => {
        const { id } = req.params;
        const { balance } = req.body;
        
        if (balance === undefined || balance < 0) {
            return res.status(400).json({ error: 'Некорректная сумма баланса' });
        }
        
        try {
            const result = await pool.query(
                'UPDATE users SET balance = $1 WHERE id = $2 RETURNING id, balance',
                [balance, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            res.json({ success: true, balance: result.rows[0].balance });
        } catch (err) {
            console.error('Ошибка обновления баланса:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    // Управление лотами
    router.get('/lots', authenticateToken, isAdmin, async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT l.*, u.email as creator_email 
                FROM lots l
                LEFT JOIN users u ON l.created_by = u.id
                ORDER BY l.created_at DESC
            `);
            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка получения списка лотов:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

   

    router.put('/lots/:id', authenticateToken, isAdmin, async (req, res) => {
        const { id } = req.params;
        const {
            title, description, vintage, wine_type, sweetness, volume, alcohol,
            country, region, appellation, producer, grape_variety,
            bottle_condition, start_price, min_step, start_time, end_time, 
            max_extensions, image_url
        } = req.body;

        try {
            const result = await pool.query(
                `UPDATE lots 
                 SET title = $1, description = $2, vintage = $3, wine_type = $4, sweetness = $5,
                     volume = $6, alcohol = $7, country = $8, region = $9, appellation = $10,
                     producer = $11, grape_variety = $12, bottle_condition = $13,
                     start_price = $14, min_step = $15, start_time = $16, end_time = $17,
                     max_extensions = $18, image_url = $19, updated_at = NOW()
                 WHERE id = $20
                 RETURNING *`,
                [
                    title || '', description || '', vintage ? parseInt(vintage) : null,
                    wine_type || null, sweetness || null, volume ? parseFloat(volume) : null,
                    alcohol ? parseFloat(alcohol) : null, country || null, region || null,
                    appellation || null, producer || null, grape_variety || null,
                    bottle_condition || null, parseFloat(start_price), parseFloat(min_step),
                    start_time, end_time, max_extensions ? parseInt(max_extensions) : 15,
                    image_url || null, id
                ]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Лот не найден' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            console.error('❌ Ошибка обновления лота:', err);
            res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
        }
    });

    router.delete('/lots/:id', authenticateToken, isAdmin, async (req, res) => {
        const { id } = req.params;
        try {
            await pool.query('DELETE FROM bids WHERE lot_id = $1', [id]);
            const result = await pool.query('DELETE FROM lots WHERE id = $1 RETURNING id', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Лот не найден' });
            }
            res.json({ success: true, message: 'Лот успешно удалён' });
        } catch (err) {
            console.error('Ошибка при удалении лота:', err);
            res.status(500).json({ error: 'Ошибка при удалении лота' });
        }
    });

    // Статистика
    router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
        try {
            const stats = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT COUNT(*) FROM lots) as total_lots,
                    (SELECT COUNT(*) FROM lots WHERE is_active = true) as active_lots,
                    (SELECT COUNT(*) FROM bids) as total_bids,
                    (SELECT COALESCE(SUM(current_price), 0) FROM lots WHERE is_active = false AND current_winner_id IS NOT NULL) as total_revenue
            `);
            res.json(stats.rows[0]);
        } catch (err) {
            console.error('Ошибка получения статистики:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });

    return router;
};