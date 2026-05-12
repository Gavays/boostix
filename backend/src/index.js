const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./cron');

const { pool, initDatabase } = require('./config/database');
const servicesRouter = require('./routes/services');
const ordersRouter = require('./routes/orders');
require('./bot');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/services', servicesRouter);
app.use('/api/orders', ordersRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Boostix API работает' });
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/fix-db', async (req, res) => {
  try {
    await pool.query('ALTER TABLE orders ALTER COLUMN user_id TYPE BIGINT');
    await pool.query('ALTER TABLE orders ALTER COLUMN amount DROP NOT NULL');
    res.json({ success: true, message: 'Типы колонок исправлены' });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Ошибка запуска:', err);
    process.exit(1);
  }
}

start();