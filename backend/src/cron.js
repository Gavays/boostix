const cron = require('node-cron');
const { pool } = require('./config/database');
const providerClient = require('./modules/providerClient');

// Запуск каждый час — проверяет активные планы и выполняет заказы
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Проверка планов автопродвижения...');

  try {
    const { rows: plans } = await pool.query(
      "SELECT * FROM auto_plans WHERE status = 'active' AND completed < goal"
    );

    for (const plan of plans) {
      // Проверяем, прошли ли сутки с последнего заказа
      const today = new Date().toISOString().split('T')[0];
      const lastOrder = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 AND created_at::date = $2 AND provider_order_id IS NOT NULL",
        [plan.user_id, today]
      );

      if (lastOrder.rows.length > 0) continue; // Уже заказывали сегодня

      // Рассчитываем сколько заказать
      const remaining = plan.goal - plan.completed;
      const affordableQuantity = Math.floor((plan.daily_budget - plan.spent) / 2); // ~2 руб за подписчика
      const quantity = Math.min(remaining, Math.max(10, affordableQuantity));

      if (quantity <= 0) continue;

      // Подбираем услугу
      const services = await providerClient.getServices();
      const bestService = services.find(s => 
        s.name.toLowerCase().includes(plan.platform.toLowerCase()) && 
        s.name.toLowerCase().includes('подписчик')
      );

      if (!bestService) continue;

      // Создаём заказ
      const result = await providerClient.createOrder(bestService.service, plan.link, quantity);

      // Обновляем план
      await pool.query(
        'UPDATE auto_plans SET completed = completed + $1, spent = spent + $2 WHERE id = $3',
        [quantity, quantity * 0.5, plan.id]
      );

      console.log(`✅ План #${plan.id}: заказано ${quantity}, заказ #${result.orderId}`);
    }
  } catch (err) {
    console.error('❌ Ошибка в cron:', err.message);
  }
});

console.log('⏰ Планировщик автопродвижения запущен');