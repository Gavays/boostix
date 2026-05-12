// backend/src/modules/providerClient.js
// Код для работы с API TmSMM (https://tmsmm.ru)
const axios = require('axios');
const qs = require('qs');

class ProviderClient {
  constructor() {
    this.apiKey = process.env.PROVIDER_API_KEY;
    this.baseURL = process.env.PROVIDER_API_URL;
  }

  async _request(action, params = {}) {
    const data = qs.stringify({
      key: this.apiKey,
      action: action,
      ...params,
    });

    try {
      const response = await axios.post(this.baseURL, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return response.data;
    } catch (error) {
      console.error(`Provider API error (${action}):`, error.response?.data || error.message);
      throw new Error(`Provider API request failed for action: ${action}`);
    }
  }

  // Получить баланс (см. метод 'balance' в доке)
  async getBalance() {
    const result = await this._request('balance');
    return { balance: parseFloat(result.balance), currency: result.currency };
  }

  // Получить все услуги (см. метод 'services' в доке)
  async getServices() {
    return await this._request('services');
  }

  // Создать новый заказ (см. метод 'add' в доке)
  async createOrder(serviceId, link, quantity) {
    const result = await this._request('add', {
      service: serviceId,
      link: link,
      quantity: quantity,
    });
    console.log('Создан заказ, ответ TmSMM:', JSON.stringify(result));
    return { orderId: result.order };
  }

  // Проверить статус одного заказа (см. метод 'status' в доке)
  async getOrderStatus(orderId) {
    console.log('Запрос статуса для orderId:', orderId, 'тип:', typeof orderId);
    const result = await this._request('status', { order: orderId });
    console.log('Ответ от TmSMM (status):', JSON.stringify(result));
    return result;
  }
}

module.exports = new ProviderClient();