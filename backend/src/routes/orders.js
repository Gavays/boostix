const express = require('express');
const router = express.Router();
const providerClient = require('../modules/providerClient');

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

module.exports = router;