const express = require('express');
const router = express.Router();
const providerClient = require('../modules/providerClient');

// GET /api/services — список всех услуг
router.get('/', async (req, res) => {
  try {
    const services = await providerClient.getServices();
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;