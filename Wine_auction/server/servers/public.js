

module.exports = (pool) => {
    const router = require('express').Router();
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    
    // ========== КАЛЕНДАРЬ АУКЦИОНОВ ==========
    router.get('/auctions', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT id, title, start_time as date, end_time, is_active
                FROM lots 
                ORDER BY start_time DESC
            `);
            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
    
    // ========== ЛОТЫ ПО ДАТЕ ==========
    router.get('/auctions/date/:date', async (req, res) => {
        try {
            const { date } = req.params;
            const result = await pool.query(`
                SELECT l.*, COUNT(b.id) as bids_count
                FROM lots l
                LEFT JOIN bids b ON l.id = b.lot_id
                WHERE DATE(l.start_time) = $1
                GROUP BY l.id
                ORDER BY l.start_time
            `, [date]);
            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка:', err);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
    
    // ========== ТЕСТ ==========
    router.get('/test', (req, res) => {
        res.json({ status: 'ok', message: 'Сервер работает' });
    });
    
    // ========== ЗАГРУЗКА ИЗОБРАЖЕНИЙ ==========
    const uploadDir = path.join(__dirname, '../../uploads/wines');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, ext).replace(/[()\s]/g, '');
            cb(null, `${baseName}${uniqueSuffix}${ext}`);
        }
    });
    
    const upload = multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|gif|webp/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);
            if (mimetype && extname) {
                return cb(null, true);
            }
            cb(new Error('Только изображения (jpeg, jpg, png, gif, webp)'));
        }
    });
    
    const { authenticateToken } = require('../middleware/auth');
    
    router.post('/upload/wine-image', authenticateToken, upload.single('image'), (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Файл не загружен' });
            }
            const imageUrl = `/uploads/wines/${req.file.filename}`;
            console.log('✅ Изображение загружено:', req.file.filename);
            res.json({ url: imageUrl, filename: req.file.filename, success: true });
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            res.status(500).json({ error: 'Ошибка при загрузке файла' });
        }
    });
    
    return router;  // ← ВАЖНО: возвращаем router
};