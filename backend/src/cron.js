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
      const today = new Date().toISOString().split('T')[0];
      const lastOrder = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 AND created_at::date = $2 AND provider_order_id IS NOT NULL",
        [plan.user_id, today]
      );

      if (lastOrder.rows.length > 0) continue;

      const remaining = plan.goal - plan.completed;
      const affordableQuantity = Math.floor((plan.daily_budget - plan.spent) / 2);
      const quantity = Math.min(remaining, Math.max(10, affordableQuantity));

      if (quantity <= 0) continue;

      const services = await providerClient.getServices();
      const bestService = services.find(s => 
        s.name.toLowerCase().includes(plan.platform.toLowerCase()) && 
        s.name.toLowerCase().includes('подписчик')
      );

      if (!bestService) continue;

      const result = await providerClient.createOrder(bestService.service, plan.link, quantity);

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

// Проверка статусов заказов каждые 15 минут
cron.schedule('*/15 * * * *', async () => {
  console.log('🔄 Проверка статусов заказов...');

  try {
    const { rows: orders } = await pool.query(
      "SELECT * FROM orders WHERE status = 'pending' OR status = 'in_progress'"
    );

    for (const order of orders) {
      try {
        const status = await providerClient.getOrderStatus(order.provider_order_id);
        
        let newStatus = order.status;
        if (status.status === 'Completed' || status.status === 'Complete') newStatus = 'completed';
        else if (status.status === 'Canceled' || status.status === 'Cancelled') newStatus = 'cancelled';
        else if (status.status === 'In progress') newStatus = 'in_progress';
        else if (status.status === 'Pending') newStatus = 'pending';
        else if (status.status === 'Partial') newStatus = 'completed';
        
        if (newStatus !== order.status) {
          await pool.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
            [newStatus, order.id]
          );
          console.log(`📝 Заказ #${order.provider_order_id}: ${order.status} → ${newStatus}`);
        }
      } catch (err) {
        // Пропускаем ошибки по отдельным заказам
      }
    }
  } catch (err) {
    console.error('❌ Ошибка проверки статусов:', err.message);
  }
});

console.log('⏰ Планировщик автопродвижения запущен');