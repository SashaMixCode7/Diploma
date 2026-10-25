

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SYNC_FILE = path.join(__dirname, '../../.last_sync_hash');

// Функция для получения хэша файла
function getFileHash(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
}

async function syncDatabase(pool) {
    // ПУТЬ К ФАЙЛУ - server/bd/init.sql
    const initSqlPath = path.join(process.cwd(), 'server/bd/init.sql');
    
    // Проверяем существование файла
    if (!fs.existsSync(initSqlPath)) {
        console.log('⚠️ Файл init.sql не найден по пути:', initSqlPath);
        console.log('📁 Текущая рабочая директория:', process.cwd());
        console.log('📁 Проверьте, что файл существует в: server/bd/init.sql');
        return;
    }

    console.log('📄 Найден файл init.sql:', initSqlPath);
    
    const currentHash = getFileHash(initSqlPath);
    let savedHash = null;
    
    if (fs.existsSync(SYNC_FILE)) {
        savedHash = fs.readFileSync(SYNC_FILE, 'utf8');
    }

    if (currentHash === savedHash) {
        console.log('✅ База данных актуальна (init.sql не менялся)');
        return;
    }

    console.log('🔄 Обнаружены изменения в init.sql, обновляем базу данных...');

    try {
        const sql = fs.readFileSync(initSqlPath, 'utf8');
        
        // Разделяем SQL на отдельные запросы
        const statements = sql
            .split(';')
            .filter(stmt => {
                const trimmed = stmt.trim();
                return trimmed.length > 0 && !trimmed.startsWith('--');
            });
        
        let executedCount = 0;
        let errorCount = 0;
        
        for (const statement of statements) {
            try {
                await pool.query(statement);
                executedCount++;
                
                // Логируем основные операции
                const firstWord = statement.trim().split(' ')[0].toUpperCase();
                if (['CREATE', 'ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE'].includes(firstWord)) {
                    const tableMatch = statement.match(/TABLE\s+(\w+)/i);
                    const tableName = tableMatch ? tableMatch[1] : '';
                    console.log(`  ✓ ${firstWord} ${tableName}`);
                }
            } catch (err) {
                // Игнорируем ошибки "already exists" - это нормально
                if (err.message.includes('already exists') || 
                    err.message.includes('duplicate key') ||
                    err.message.includes('already a column') ||
                    (err.message.includes('does not exist') && err.message.includes('DROP'))) {
                    // Пропускаем эти ошибки
                } else {
                    errorCount++;
                    console.error(`  ✗ Ошибка: ${err.message.substring(0, 100)}`);
                }
            }
        }
        
        if (executedCount > 0) {
            fs.writeFileSync(SYNC_FILE, currentHash);
            console.log(`✅ База данных успешно синхронизирована!`);
            console.log(`📊 Выполнено запросов: ${executedCount}, пропущено ошибок: ${errorCount}`);
        } else {
            console.log('⚠️ Не найдено новых запросов для выполнения');
        }
    } catch (err) {
        console.error('❌ Ошибка синхронизации БД:', err);
        throw err;
    }
}

module.exports = { syncDatabase };