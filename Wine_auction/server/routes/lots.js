

module.exports = (pool, authenticateToken) => {
    const router = require('express').Router();
    
    // Просмотр всех лотов
    router.get('/', async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT l.*, u.first_name || ' ' || u.last_name as winner_name
                 FROM lots l
                 LEFT JOIN users u ON l.current_winner_id = u.id
                 ORDER BY l.created_at DESC`
            );
            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка загрузки лотов:', err);
            res.status(500).json({ error: err.message });
        }
    });
    
    // Просмотр конкретного лота
    router.get('/:id', async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT l.*, u.first_name || ' ' || u.last_name as winner_name,
                 (SELECT COUNT(*) FROM bids WHERE lot_id = l.id) as bid_count
                 FROM lots l
                 LEFT JOIN users u ON l.current_winner_id = u.id
                 WHERE l.id = $1`,
                [req.params.id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Лот не найден' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Ошибка загрузки лота:', err);
            res.status(500).json({ error: err.message });
        }
    });
    
    // ✅ СОЗДАНИЕ ЛОТА (с проверкой на администратора внутри)
    router.post('/', authenticateToken, async (req, res) => {
        try {
            // Проверяем, является ли пользователь администратором
            const userCheck = await pool.query(
                'SELECT is_admin FROM users WHERE id = $1',
                [req.user.id]
            );
            
            if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
                return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
            }
            
            const { 
                title, 
                description,
                vintage,
                wine_type,
                sweetness,
                volume,
                alcohol,
                country,
                region,
                appellation,
                producer,
                grape_variety,
                bottle_condition, 
                start_price, 
                min_step, 
                start_time, 
                end_time,
                max_extensions,
                image_url
            } = req.body;
            
            // Валидация обязательных полей
            if (!title || !description || !start_price || !min_step || !start_time || !end_time) {
                return res.status(400).json({ error: 'Заполните все обязательные поля' });
            }

             const params = [
            title || null,                              // $1
            description || null,                        // $2
            vintage ? parseInt(vintage) : null,         // $3
            wine_type || null,                          // $4
            sweetness || null,                          // $5
            volume ? parseFloat(volume) : null,         // $6
            alcohol ? parseFloat(alcohol) : null,       // $7
            country || null,                            // $8
            region || null,                             // $9
            appellation || null,                        // $10
            producer || null,                           // $11
            grape_variety || null,                      // $12
            bottle_condition || null,                   // $13
            parseFloat(start_price),                    // $14
            parseFloat(min_step),                       // $15
            parseFloat(start_price),                    // $16 - current_price = start_price
            start_time || null,                         // $17
            end_time || null,                           // $18
            max_extensions ? parseInt(max_extensions) : 15, // $19
            image_url || null,                          // $20
            req.user.id                                 // $21
        ];
            
            const result = await pool.query(
                `INSERT INTO lots (
                    title, description, vintage, wine_type, sweetness,
                    volume, alcohol, country, region, appellation,
                    producer, grape_variety, bottle_condition,
                    start_price, min_step, current_price,
                    start_time, end_time, max_extensions,
                    image_url, created_by, is_active, extension_count, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19,
                    $20, $21, true, 0, NOW()
                )
                RETURNING *`,
                params
            );
            
            console.log('✅ Лот создан, ID:', result.rows[0].id);
            res.status(201).json(result.rows[0]);
            
        } catch (err) {
            console.error('❌ Ошибка создания лота:', err);
            console.error('❌ Детали:', {
                message: err.message,
                code: err.code,
                position: err.position
            });
            res.status(500).json({ error: err.message });
        }
    });
    
    

    router.put('/:id', authenticateToken, async (req, res) => {
    try {
        // Проверяем, является ли пользователь администратором
        const userCheck = await pool.query(
            'SELECT is_admin FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
            return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
        }
        
        const { id } = req.params;
        
        // ✅ ПОЛУЧАЕМ ВСЕ ПОЛЯ
        const { 
            title,
            description,
            vintage,
            wine_type,
            sweetness,
            volume,
            alcohol,
            country,
            region,
            appellation,
            producer,
            grape_variety,
            bottle_condition,
            start_price,
            min_step,
            start_time,
            end_time,
            max_extensions,
            image_url,
            is_active
        } = req.body;

        // ✅ ЛОГИРУЕМ ВХОДНЫЕ ДАННЫЕ
        console.log('📥 Получены данные для обновления лота:', req.body);
        
        // Проверяем, существует ли лот
        const lotCheck = await pool.query('SELECT id FROM lots WHERE id = $1', [id]);
        if (lotCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Лот не найден' });
        }

        // ✅ ПОДГОТОВКА ПАРАМЕТРОВ (все строки преобразуем в NULL)
        const params = [
            title || null,                              // $1 - строка
            description || null,                        // $2 - строка
            vintage ? parseInt(vintage) : null,         // $3 - integer или NULL
            wine_type || null,                          // $4 - строка
            sweetness || null,                          // $5 - строка
            volume ? parseFloat(volume) : null,         // $6 - float или NULL
            alcohol ? parseFloat(alcohol) : null,       // $7 - float или NULL
            country || null,                            // $8 - строка
            region || null,                             // $9 - строка
            appellation || null,                        // $10 - строка
            producer || null,                           // $11 - строка
            grape_variety || null,                      // $12 - строка
            bottle_condition || null,                   // $13 - строка
            start_price ? parseFloat(start_price) : null,  // $14 - float или NULL
            min_step ? parseFloat(min_step) : null,        // $15 - float или NULL
            start_time || null,                         // $16 - timestamp или NULL
            end_time || null,                           // $17 - timestamp или NULL
            max_extensions ? parseInt(max_extensions) : 15, // $18 - integer или 15
            image_url || null,                          // $19 - строка
            is_active !== undefined ? is_active : true, // $20 - boolean
            parseInt(id)                                // $21 - integer
    ];

        // ✅ ЛОГИРУЕМ ПАРАМЕТРЫ
        console.log('📤 Параметры запроса:');
        const paramNames = [
            'title', 'description', 'vintage', 'wine_type', 'sweetness',
            'volume', 'alcohol', 'country', 'region', 'appellation',
            'producer', 'grape_variety', 'bottle_condition', 'start_price',
            'min_step', 'start_time', 'end_time', 'max_extensions',
            'image_url', 'is_active', 'id'
        ];
        params.forEach((param, index) => {
            console.log(`  $${index + 1} (${paramNames[index]}): ${param === null ? 'NULL' : param} (${typeof param})`);
        });

        // ✅ SQL ЗАПРОС СО ВСЕМИ ПОЛЯМИ
        const query = `
            UPDATE lots SET
                title = $1,
                description = $2,
                vintage = $3,
                wine_type = $4,
                sweetness = $5,
                volume = $6,
                alcohol = $7,
                country = $8,
                region = $9,
                appellation = $10,
                producer = $11,
                grape_variety = $12,
                bottle_condition = $13,
                start_price = $14,
                min_step = $15,
                start_time = $16,
                end_time = $17,
                max_extensions = $18,
                image_url = $19,
                is_active = $20,
                updated_at = NOW()
            WHERE id = $21
            RETURNING id
        `;

        const result = await pool.query(query, params);
        
        console.log('✅ Лот успешно обновлен, ID:', result.rows[0].id);
        res.json({
            success: true,
            message: 'Лот обновлен',
            lot: result.rows[0]
        });

    } catch (err) {
        console.error('❌ Ошибка обновления лота:', err);
        console.error('❌ Детали:', {
            message: err.message,
            code: err.code,
            position: err.position,
            detail: err.detail
        });
        res.status(500).json({ 
            error: 'Ошибка при обновлении лота',
            details: err.message,
            code: err.code
        });
    }
});
    
    // ✅ УДАЛЕНИЕ ЛОТА (с проверкой на администратора внутри)
    router.delete('/:id', authenticateToken, async (req, res) => {
        try {
            // Проверяем, является ли пользователь администратором
            const userCheck = await pool.query(
                'SELECT is_admin FROM users WHERE id = $1',
                [req.user.id]
            );
            
            if (userCheck.rows.length === 0 || !userCheck.rows[0].is_admin) {
                return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
            }
            
            const { id } = req.params;
            
            const result = await pool.query('DELETE FROM lots WHERE id = $1 RETURNING id', [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Лот не найден' });
            }
            
            res.json({ message: 'Лот успешно удалён', id: result.rows[0].id });
        } catch (err) {
            console.error('Ошибка удаления лота:', err);
            res.status(500).json({ error: err.message });
        }
    });
    
    // Получение последних ставок для лота
    router.get('/:id/recent-bids', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT b.*, u.first_name || ' ' || u.last_name as user_name
                 FROM bids b
                 JOIN users u ON b.user_id = u.id
                 WHERE b.lot_id = $1
                 ORDER BY b.created_at DESC
                 LIMIT 10`,
                [req.params.id]
            );
            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка загрузки ставок:', err);
            res.status(500).json({ error: err.message });
        }
    });
    
    return router;
};
