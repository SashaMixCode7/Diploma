

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (pool) => {
    const router = require('express').Router();
    
    // Middleware для проверки токена (для маршрута /me)
    const authenticateToken = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }
        
        jwt.verify(token, process.env.JWT_SECRET || 'wine_secret_key', (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Недействительный токен' });
            }
            req.user = user;
            next();
        });
    };
    
    // Регистрация
    router.post('/register', async (req, res) => {
        const { firstName, lastName, email, phone, password, birthDate, deliveryAddress } = req.body;
        
        const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
        if (age < 18) {
            return res.status(400).json({ error: 'Вам должно быть 18+ для участия в аукционе' });
        }
        
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const result = await pool.query(
                `INSERT INTO users (first_name, last_name, email, phone, password_hash, birth_date, delivery_address) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, email, is_admin`,
                [firstName, lastName, email, phone, hashedPassword, birthDate, deliveryAddress]
            );
            
            const user = result.rows[0];
            
            const token = jwt.sign(
                { id: user.id, email: user.email, is_admin: user.is_admin || false },
                process.env.JWT_SECRET || 'wine_secret_key',
                { expiresIn: '24h' }
            );
            
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    is_admin: user.is_admin || false
                } 
            });
        } catch (err) {
            console.error('Ошибка при регистрации:', err);
            res.status(500).json({ error: 'Ошибка при регистрации' });
        }
    });
    
    // Логин (ИСПРАВЛЕН - добавлен is_admin)
    router.post('/login', async (req, res) => {
        const { email, password } = req.body;
        
        try {
            // ✅ Добавляем все нужные поля, включая is_admin
            const result = await pool.query(
                'SELECT id, first_name, last_name, email, phone, balance, is_admin, password_hash FROM users WHERE email = $1',
                [email]
            );
            
            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }
            
            const user = result.rows[0];
            const valid = await bcrypt.compare(password, user.password_hash);
            
            if (!valid) {
                return res.status(401).json({ error: 'Неверный email или пароль' });
            }
            
            // ✅ Добавляем is_admin в токен
            const token = jwt.sign(
                { id: user.id, email: user.email, is_admin: user.is_admin },
                process.env.JWT_SECRET || 'wine_secret_key',
                { expiresIn: '24h' }
            );
            
            // ✅ Возвращаем полные данные пользователя с is_admin
            res.json({ 
                token, 
                user: { 
                    id: user.id, 
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone: user.phone,
                    balance: user.balance,
                    is_admin: user.is_admin  // ← КЛЮЧЕВОЕ ПОЛЕ
                } 
            });
        } catch (err) {
            console.error('Ошибка при входе:', err);
            res.status(500).json({ error: 'Ошибка при входе' });
        }
    });
    
    // ✅ НОВЫЙ МАРШРУТ: Получение текущего пользователя (для обновления данных)
    router.get('/me', authenticateToken, async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT id, first_name, last_name, email, phone, balance, is_admin, birth_date, delivery_address, created_at FROM users WHERE id = $1',
                [req.user.id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Ошибка получения пользователя:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
    
    // ✅ НОВЫЙ МАРШРУТ: Обновление профиля пользователя
    router.put('/profile', authenticateToken, async (req, res) => {
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
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
    
    return router;
};