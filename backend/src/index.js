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