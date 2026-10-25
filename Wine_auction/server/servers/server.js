


const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // ← теперь на 2 уровня выше

// Импорт модулей - ПРАВИЛЬНЫЕ ПУТИ
const { authenticateToken, createIsAdmin } = require('../middleware/auth');
const userRoutes = require('../routes/auth');      
const balanceRoutes = require('../routes/balance'); 
const bidRoutes = require('../routes/bids');        
const lotRoutes = require('../routes/lots');        
const adminRoutes = require('./admin');             
const publicRoutes = require('./public');          

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Подключение к БД
const pool = new Pool({
    user: String(process.env.DB_USER || 'postgres'),
    host: String(process.env.DB_HOST || 'localhost'),
    database: String(process.env.DB_NAME || 'mydb1'),
    password: String(process.env.DB_PASSWORD || 'sgh56jk78g'),
    port: parseInt(process.env.DB_PORT || '5432', 10),
});


// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ========== МАРШРУТЫ ==========

// 1. Публичные маршруты (без авторизации)
app.get('/api/public/lots', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM lots 
            WHERE is_active = true 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/public/lots/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM lots WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Лот не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Календарь аукционов
app.get('/api/auctions', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, title, start_time as date, end_time, is_active
            FROM lots 
            ORDER BY start_time DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/auctions/date/:date', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM lots 
            WHERE DATE(start_time) = $1 AND is_active = true
        `, [req.params.date]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, first_name, last_name, email, phone, balance, is_admin, created_at 
             FROM users WHERE id = $1`,
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка получения профиля:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    const { first_name, last_name, phone, delivery_address } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users 
             SET first_name = COALESCE($1, first_name),
                 last_name = COALESCE($2, last_name),
                 phone = COALESCE($3, phone),
                 delivery_address = COALESCE($4, delivery_address)
             WHERE id = $5
             RETURNING id, first_name, last_name, email, phone, balance, is_admin`,
            [first_name, last_name, phone, delivery_address, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка обновления профиля:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/balance', authenticateToken, async (req, res) => {
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

app.get('/api/users/active-bids', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT ON (b.lot_id) 
                b.id, b.lot_id, b.amount, b.created_at,
                l.title as lot_title, l.current_price, l.end_time, l.start_time,
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
        console.error('Ошибка получения активных ставок:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/bid-history', authenticateToken, async (req, res) => {
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
        console.error('Ошибка получения истории ставок:', err);
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/lots/won', authenticateToken, async (req, res) => {
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
                (
                    SELECT amount FROM bids 
                    WHERE lot_id = l.id 
                    ORDER BY created_at DESC 
                    LIMIT 1
                ) as winning_bid,
                (
                    SELECT created_at FROM bids 
                    WHERE lot_id = l.id 
                    ORDER BY created_at DESC 
                    LIMIT 1
                ) as won_date
            FROM lots l
            WHERE l.current_winner_id = $1 
              AND (l.is_active = false OR l.end_time < NOW())
            ORDER BY l.end_time DESC
        `, [req.user.id]);
        
        res.json(result.rows);
    } catch (err) {
        console.error('❌ Ошибка получения выигранных лотов:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/balance/transactions', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, type, amount, status, created_at, description
             FROM transactions 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 100`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        if (err.message.includes('relation "transactions" does not exist')) {
            return res.json([]);
        }
        console.error('Ошибка получения транзакций:', err);
        res.status(500).json({ error: err.message });
    }
});


// 3. Подключаем роутеры
const isAdmin = createIsAdmin(pool);

app.use('/api/users', userRoutes(pool));                                    // регистрация/логин
app.use('/api/balance', balanceRoutes(pool, authenticateToken));            // баланс
app.use('/api/bids', bidRoutes(pool, authenticateToken, io));               // ставки
app.use('/api/admin/lots', lotRoutes(pool, authenticateToken));             // управление лотами
//app.use('/api/admin', adminRoutes(pool, authenticateToken, isAdmin, io));   // админка
app.use('/api', publicRoutes( pool));                                   // публичные маршруты

// 4. Дополнительные маршруты
app.get('/api/test', (req, res) => {
    res.json({ message: 'Сервер работает' });
});

// Запуск сервера
(async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Подключение к PostgreSQL установлено');
        client.release();
        
        server.listen(PORT, () => {
            console.log(`\n🚀 Сервер аукциона запущен на порту ${PORT}`);
            console.log(`📝 Тест: http://localhost:${PORT}/api/test`);
            console.log(`🍷 Лоты: http://localhost:${PORT}/api/public/lots`);
            console.log(`👤 Логин: http://localhost:${PORT}/api/users/login`);
            console.log(`📁 Путь к серверу: ${__dirname}`);
        });
    } catch (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
        server.listen(PORT, () => {
            console.log(`⚠️ Сервер запущен без БД на порту ${PORT}`);
        });
    }
})();