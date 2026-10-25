const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'wine_secret_key', (err, user) => {
        if (err) return res.status(403).json({ error: 'Недействительный токен' });
        req.user = user;
        next();
    });
};

// Фабрика для создания isAdmin с доступом к pool
const createIsAdmin = (pool) => {
    return async (req, res, next) => {
        try {
            const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
            if (result.rows.length === 0 || !result.rows[0].is_admin) {
                return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
            }
            req.user.is_admin = result.rows[0].is_admin;
            next();
        } catch (err) {
            console.error('Ошибка проверки прав:', err);
            res.status(500).json({ error: 'Ошибка проверки прав' });
        }
    };
};

module.exports = { authenticateToken, createIsAdmin };