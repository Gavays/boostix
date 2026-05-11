const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on('error', (err) => {
  console.error('Ошибка PostgreSQL:', err);
});

// Функция инициализации БД
async function initDatabase() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await client.query(schema);
    console.log('✅ База данных инициализирована');
  } catch (err) {
    if (err.code === '42P07') {
      console.log('⚠️ Таблицы уже существуют, пропускаем');
    } else {
      console.error('❌ Ошибка инициализации БД:', err.message);
    }
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };