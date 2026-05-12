const express = require('express');
const router = express.Router();
const providerClient = require('../modules/providerClient');
const { pool } = require('../config/database');

// POST /api/orders — создать заказ
router.post('/', async (req, res) => {
  const { serviceId, link, quantity } = req.body;

  if (!serviceId || !link || !quantity) {
    return res.status(400).json({ 
      success: false, 
      error: 'serviceId, link и quantity обязательны' 
    });
  }

  try {
    const result = await providerClient.createOrder(serviceId, link, quantity);
    res.json({ 
      success: true, 
      orderId: result.orderId,
      message: 'Заказ создан' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/orders/:id — статус заказа
router.get('/:id', async (req, res) => {
  try {
    const status = await providerClient.getOrderStatus(req.params.id);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/register — регистрация пользователя из Telegram
router.post('/user/register', async (req, res) => {
  const { telegram_id, first_name, username } = req.body;

  if (!telegram_id) {
    return res.status(400).json({ success: false, error: 'telegram_id обязателен' });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);

    if (existing.rows.length > 0) {
      return res.json({ success: true, user: existing.rows[0] });
    }

    const result = await pool.query(
      'INSERT INTO users (telegram_id, first_name, username, balance) VALUES ($1, $2, $3, 0) RETURNING *',
      [telegram_id, first_name || 'Пользователь', username || '']
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auto/create — создать план автопродвижения
router.post('/auto/create', async (req, res) => {
  const { userId, platform, link, goal, dailyBudget } = req.body;

  if (!userId || !platform || !goal || !dailyBudget) {
    return res.status(400).json({ success: false, error: 'Все поля обязательны' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO auto_plans (user_id, platform, link, goal, daily_budget) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, platform, link || '', goal, dailyBudget]
    );

    res.json({ 
      success: true, 
      plan: result.rows[0],
      estimatedDays: Math.ceil(goal / (dailyBudget / 200))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auto/plans/:userId — получить планы пользователя
router.get('/auto/plans/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM auto_plans WHERE user_id = $1 AND status = 'active'",
      [req.params.userId]
    );
    res.json({ success: true, plans: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;