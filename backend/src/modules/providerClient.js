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

  async getBalance() {
    const result = await this._request('balance');
    return { balance: parseFloat(result.balance), currency: result.currency };
  }

  async getServices() {
    return await this._request('services');
  }

  async createOrder(serviceId, link, quantity) {
    const result = await this._request('add', {
      service: serviceId,
      link: link,
      quantity: quantity,
    });
    return { orderId: result.order };
  }

  async getOrderStatus(orderId) {
    const result = await this._request('status', { order: orderId });
    return result;
  }
}

module.exports = new ProviderClient();