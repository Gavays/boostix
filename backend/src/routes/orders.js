const express = require('express');
const router = express.Router();
const providerClient = require('../modules/providerClient');
const { pool } = require('../config/database');

// POST /api/orders — создать заказ
router.post('/', async (req, res) => {
  const { serviceId, link, quantity, userId } = req.body;

  if (!serviceId || !link || !quantity) {
    return res.status(400).json({ 
      success: false, 
      error: 'serviceId, link и quantity обязательны' 
    });
  }

  try {
    const result = await providerClient.createOrder(serviceId, link, quantity);
    
    const services = await providerClient.getServices();
    const service = Array.isArray(services) ? services.find(s => s.service == serviceId) : null;
    const serviceRate = service ? parseFloat(service.rate) : 0;
    const orderCost = parseFloat((serviceRate / 1000 * quantity).toFixed(2));
    
    if (userId && userId !== 'Гость') {
      if (orderCost > 0) {
        await pool.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [orderCost, userId]);
      }
      
      await pool.query(
        'INSERT INTO orders (user_id, provider_order_id, link, quantity, status) VALUES ($1, $2, $3, $4, $5)',
        [userId, String(result.orderId), link, quantity, 'pending']
      );
      
      try {
        const refUser = await pool.query('SELECT referred_by FROM users WHERE telegram_id = $1', [userId]);
        if (refUser.rows[0]?.referred_by) {
          let refId = refUser.rows[0].referred_by;
          const levels = [0.10, 0.03, 0.02];
          
          for (let i = 0; i < levels.length; i++) {
            if (!refId) break;
            const amount = parseFloat((orderCost * levels[i]).toFixed(2));
            if (amount > 0) {
              await pool.query(
                "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'referral', $2, $3)",
                [String(refId), amount, `Реферальный бонус ${i+1} уровня от заказа #${result.orderId}`]
              );
              await pool.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [amount, String(refId)]);
            }
            const nextRef = await pool.query('SELECT referred_by FROM users WHERE telegram_id = $1', [String(refId)]);
            refId = nextRef.rows[0]?.referred_by;
          }
        }
      } catch (err) {
        // ignore referral errors
      }
    }

    res.json({ 
      success: true, 
      orderId: result.orderId,
      message: 'Заказ создан' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/orders/topup — пополнение баланса
router.post('/topup', async (req, res) => {
  const { userId, amount } = req.body;
  
  if (!userId || !amount) {
    return res.status(400).json({ success: false, error: 'userId и amount обязательны' });
  }
  
  try {
    await pool.query('UPDATE users SET balance = balance + $1 WHERE telegram_id = $2', [amount, userId]);
    await pool.query(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'deposit', $2, $3)",
      [userId, amount, `Пополнение баланса`]
    );
    res.json({ success: true, message: 'Баланс пополнен' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login — вход по email
router.post('/auth/login', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email обязателен' });
  }

  try {
    let user = await pool.query('SELECT * FROM users WHERE username = $1', [email]);
    
    if (user.rows.length === 0) {
      const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      user = await pool.query(
        'INSERT INTO users (telegram_id, first_name, username, balance) VALUES ($1, $2, $3, 0) RETURNING *',
        [newId, email.split('@')[0], email]
      );
    }
    
    res.json({ 
      success: true, 
      user: user.rows[0],
      token: user.rows[0].telegram_id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me — данные пользователя по токену
router.get('/auth/me', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ success: false, error: 'Нет токена' });
  
  try {
    const user = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [token]);
    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    res.json({ success: true, user: user.rows[0] });
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

// POST /api/orders/refresh/:userId — обновление статусов
router.post('/refresh/:userId', async (req, res) => {
  try {
    const { rows: orders } = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 AND (status = 'pending' OR status = 'in_progress')",
      [req.params.userId]
    );

    for (const order of orders) {
      try {
        const status = await providerClient.getOrderStatus(order.provider_order_id);
        let newStatus = order.status;
        
        if (status.error) {
          newStatus = 'failed';
        } else {
          const s = status.status;
          if (typeof s === 'string') {
            const sl = s.toLowerCase();
            if (sl.includes('complete')) newStatus = 'completed';
            else if (sl.includes('cancel')) newStatus = 'cancelled';
            else if (sl.includes('progress')) newStatus = 'in_progress';
            else if (sl.includes('pending')) newStatus = 'pending';
            else if (sl.includes('partial')) newStatus = 'completed';
          }
        }
        
        if (newStatus !== order.status) {
          await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, order.id]);
        }
      } catch (err) {}
    }

    res.json({ success: true, message: 'Статусы обновлены' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/user/orders/:userId — история заказов
router.get('/user/orders/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.params.userId]);
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/user/balance/:userId — баланс
router.get('/user/balance/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT balance FROM users WHERE telegram_id = $1', [req.params.userId]);
    if (result.rows.length === 0) return res.json({ success: true, balance: 0 });
    res.json({ success: true, balance: parseFloat(result.rows[0].balance) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/register — регистрация
router.post('/user/register', async (req, res) => {
  const { telegram_id, first_name, username, ref } = req.body;
  if (!telegram_id) return res.status(400).json({ success: false, error: 'telegram_id обязателен' });

  try {
    const existing = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
    if (existing.rows.length > 0) {
      if (ref && !existing.rows[0].referred_by && ref !== telegram_id) {
        await pool.query('UPDATE users SET referred_by = $1 WHERE telegram_id = $2', [ref, telegram_id]);
      }
      return res.json({ success: true, user: existing.rows[0] });
    }

    const finalRef = (ref && ref !== telegram_id) ? ref : null;
    const result = await pool.query(
      'INSERT INTO users (telegram_id, first_name, username, balance, referred_by) VALUES ($1, $2, $3, 0, $4) RETURNING *',
      [telegram_id, first_name || 'Пользователь', username || '', finalRef]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/referral/stats/:userId
router.get('/referral/stats/:userId', async (req, res) => {
  try {
    const level1 = await pool.query('SELECT COUNT(*) FROM users WHERE referred_by = $1', [req.params.userId]);
    const level2 = await pool.query('SELECT COUNT(*) FROM users WHERE referred_by IN (SELECT telegram_id FROM users WHERE referred_by = $1)', [req.params.userId]);
    const level3 = await pool.query('SELECT COUNT(*) FROM users WHERE referred_by IN (SELECT telegram_id FROM users WHERE referred_by IN (SELECT telegram_id FROM users WHERE referred_by = $1))', [req.params.userId]);
    const earnings = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND type = 'referral'", [req.params.userId]);
    res.json({ success: true, level1: parseInt(level1.rows[0].count), level2: parseInt(level2.rows[0].count), level3: parseInt(level3.rows[0].count), totalEarned: parseFloat(earnings.rows[0].total) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/referral/link/:userId
router.get('/referral/link/:userId', async (req, res) => {
  const link = `https://boostix-app.onrender.com?ref=${req.params.userId}`;
  res.json({ success: true, link });
});

// GET /api/referral/history/:userId
router.get('/referral/history/:userId', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM transactions WHERE user_id = $1 AND type = 'referral' ORDER BY created_at DESC LIMIT 30", [req.params.userId]);
    res.json({ success: true, history: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auto/create
router.post('/auto/create', async (req, res) => {
  const { userId, platform, link, goal, dailyBudget } = req.body;
  if (!userId || !platform || !goal || !dailyBudget) return res.status(400).json({ success: false, error: 'Все поля обязательны' });
  try {
    const result = await pool.query('INSERT INTO auto_plans (user_id, platform, link, goal, daily_budget) VALUES ($1, $2, $3, $4, $5) RETURNING *', [userId, platform, link || '', goal, dailyBudget]);
    res.json({ success: true, plan: result.rows[0], estimatedDays: Math.ceil(goal / (dailyBudget / 200)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auto/plans/:userId
router.get('/auto/plans/:userId', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM auto_plans WHERE user_id = $1 AND status = 'active'", [req.params.userId]);
    res.json({ success: true, plans: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;