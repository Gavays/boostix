import { useState, useEffect } from 'react'
import './index.css'

const tg = typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp : null
const user = tg?.initDataUnsafe?.user
const userId = user?.id ? String(user.id) : 'Гость'
const userName = user?.first_name || 'Пользователь'

const PLATFORMS = [
  { id: 'telegram', name: 'Telegram', icon: '/icons/boostix-telegram.png' },
  { id: 'youtube', name: 'YouTube', icon: '/icons/boostix-youtube.png' },
  { id: 'instagram', name: 'Instagram', icon: '/icons/boostix-instagram.png' },
  { id: 'tiktok', name: 'TikTok', icon: '/icons/boostix-tiktok.png' },
  { id: 'vkontakte', name: 'ВКонтакте', icon: '/icons/boostix-vk.png' },
  { id: 'likee', name: 'Likee', icon: '/icons/boostix-likee.png' },
]

const LINK_RULES = {
  telegram: ['t.me', 'telegram.org', 'telegram'],
  youtube: ['youtube.com', 'youtu.be', 'youtube'],
  instagram: ['instagram.com', 'instagram'],
  tiktok: ['tiktok.com', 'tiktok', 'vm.tiktok'],
  vkontakte: ['vk.com', 'vk.ru', 'vkontakte'],
  likee: ['likee.com', 'likee', 'l.likee'],
}

function App() {
  const [activeTab, setActiveTab] = useState('smart')
  const [smartLink, setSmartLink] = useState('')
  const [detectedPlatform, setDetectedPlatform] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [services, setServices] = useState([])
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [link, setLink] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [step, setStep] = useState('platforms')
  const [modal, setModal] = useState(null)
  const [orders, setOrders] = useState([])

  const API_URL = 'https://boostix-o2ty.onrender.com/api'

  useEffect(() => {
    if (tg) { tg.ready(); tg.expand() }
    if (user?.id) {
      fetch(`${API_URL}/orders/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: user.id, first_name: user.first_name, username: user.username })
      }).catch(() => {})
    }
    fetch(`${API_URL}/services`)
      .then(res => res.json())
      .then(data => { if (data.success && Array.isArray(data.data)) setServices(data.data) })
      .catch(() => {})
  }, [])

  const showModal = (type, title, message) => {
    setModal({ type, title, message })
  }

  const validateLink = (link, platform) => {
    const allowed = LINK_RULES[platform]
    if (!allowed) return true
    return allowed.some(domain => link.toLowerCase().includes(domain))
  }

  const getStep = (q) => {
    if (q >= 10000) return 1000
    if (q >= 1000) return 100
    if (q >= 100) return 50
    return 10
  }

  const loadOrders = () => {
    if (userId !== 'Гость') {
      fetch(`${API_URL}/orders/user/orders/${userId}`)
        .then(res => res.json())
        .then(data => { if (data.success) setOrders(data.orders) })
        .catch(() => {})
    }
  }

  const analyzeLink = () => {
    if (!smartLink.trim()) { showModal('error', 'Ошибка', 'Вставьте ссылку'); return }
    let platform = null
    if (smartLink.includes('t.me') || smartLink.includes('telegram')) platform = 'telegram'
    else if (smartLink.includes('youtube.com') || smartLink.includes('youtu.be')) platform = 'youtube'
    else if (smartLink.includes('instagram.com')) platform = 'instagram'
    else if (smartLink.includes('tiktok.com')) platform = 'tiktok'
    else if (smartLink.includes('vk.com')) platform = 'vkontakte'
    else if (smartLink.includes('likee.com')) platform = 'likee'
    else { showModal('error', 'Ошибка', 'Не удалось определить платформу'); return }

    setDetectedPlatform(platform)
    setSmartLink('')
    const filtered = services.filter(s => s.name.toLowerCase().includes(PLATFORMS.find(p => p.id === platform)?.name.toLowerCase())).slice(0, 5)
    setSuggestions(filtered.length > 0 ? filtered : [
      { name: '👥 Подписчики', rate: '390.00', service: '118' },
      { name: '👀 Просмотры', rate: '190.00', service: '118' },
      { name: '❤️ Реакции', rate: '150.00', service: '391' },
    ])
  }

  const selectSuggestion = (s) => {
    setSelectedService(s)
    setStep('order')
    setActiveTab('order')
  }

  const filteredServices = selectedPlatform
    ? services.filter(s => s.name.toLowerCase().includes(PLATFORMS.find(p => p.id === selectedPlatform)?.name.toLowerCase()))
    : []

  const handlePlatformClick = (platformId) => {
    setSelectedPlatform(platformId)
    setSelectedService(null)
    setStep('services')
  }

  const handleServiceClick = (service) => {
    setSelectedService(service)
    setStep('order')
  }

  const handleBack = () => {
    if (step === 'order') setStep('services')
    else if (step === 'services') { setStep('platforms'); setSelectedPlatform(null) }
  }

  const createOrder = async () => {
    if (!selectedService || !link || !quantity) {
      showModal('error', 'Ошибка', 'Заполните все поля: выберите услугу, укажите ссылку и количество.')
      return
    }
    if (quantity < (selectedService.min || 10)) {
      showModal('error', 'Ошибка', `Минимальное количество: ${selectedService.min || 10}`)
      return
    }
    if (quantity > (selectedService.max || 100000)) {
      showModal('error', 'Ошибка', `Максимальное количество: ${selectedService.max || 100000}`)
      return
    }

    const platformId = selectedPlatform
    if (platformId && !validateLink(link, platformId)) {
      showModal('error', '❌ Неверная ссылка', `Ссылка должна вести на ${PLATFORMS.find(p => p.id === platformId)?.name || 'выбранную платформу'}. Проверьте URL.`)
      return
    }

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedService.service, link, quantity, userId: userId !== 'Гость' ? userId : null })
      })
      const data = await res.json()
      if (data.success) {
        showModal('success', '✅ Заказ успешно создан!', `Номер заказа: #${data.orderId}\nУслуга: ${selectedService.name.slice(0, 50)}\nКоличество: ${quantity}\nСсылка: ${link}`)
        setLink('')
        setQuantity(100)
        setSelectedService(null)
        setSelectedPlatform(null)
        setStep('platforms')
      } else {
        showModal('error', '❌ Ошибка', data.error || 'Не удалось создать заказ. Попробуйте позже.')
      }
    } catch {
      showModal('error', '❌ Ошибка соединения', 'Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.')
    }
  }

  const closeModal = () => setModal(null)

  return (
    <div className="app">
      <div className="app-header">
        <h1>🤖 Boostix</h1>
        <p className="subtitle">Умное продвижение</p>
      </div>

      <div className="tabs">
        <button className={activeTab === 'smart' ? 'active' : ''} onClick={() => setActiveTab('smart')}>🎯 Умный</button>
        <button className={activeTab === 'order' ? 'active' : ''} onClick={() => { setActiveTab('order'); setStep('platforms'); setSelectedPlatform(null); setSelectedService(null) }}>⚡ Заказ</button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); loadOrders() }}>👤 Профиль</button>
      </div>

      <div className="tab-content">
        {activeTab === 'smart' && (
          <div className="smart-tab">
            <div className="smart-hero">
              <span className="smart-icon">🎯</span>
              <h2>Умный подбор</h2>
              <p>Вставьте ссылку — Boostix определит платформу и подберёт услуги</p>
            </div>
            <div className="smart-input-group">
              <span className="smart-input-icon">🔗</span>
              <input type="text" placeholder="Вставьте ссылку..." value={smartLink} onChange={(e) => setSmartLink(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={analyzeLink}>🔍 Анализировать</button>
            {detectedPlatform && (
              <div className="smart-result">
                <div className="smart-result-header">
                  <span className="smart-result-icon">✅</span>
                  <div>
                    <div className="smart-result-label">Платформа</div>
                    <div className="smart-result-platform">{PLATFORMS.find(p => p.id === detectedPlatform)?.name}</div>
                  </div>
                </div>
                <div className="suggestions-list">
                  {suggestions.map((s, i) => (
                    <div key={i} className={`suggestion-card ${i === 0 ? 'suggestion-best' : ''}`}
                      onClick={() => selectSuggestion(s)}>
                      <div className="suggestion-left">
                        <span className="suggestion-icon">{s.name?.split(' ')[0] || '📦'}</span>
                        <div>
                          <div className="suggestion-name">{s.name || s.type}</div>
                          <div className="suggestion-badge">{i === 0 ? '🔥 Лучший выбор' : '⚡ Старт'}</div>
                        </div>
                      </div>
                      <div className="suggestion-right">
                        <span className="suggestion-price">от {s.rate || '?'} ₽</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'order' && (
          <div className="order-form">
            {step === 'platforms' && (
              <>
                <h2>Выберите платформу</h2>
                <p className="order-subtitle">Нажмите на иконку соцсети</p>
                <div className="platforms-grid">
                  {PLATFORMS.map(p => (
                    <div key={p.id} className="platform-card"
                      onClick={() => handlePlatformClick(p.id)}>
                      <img src={p.icon} alt={p.name} className="platform-card-icon-img" />
                      <span className="platform-card-name">{p.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'services' && selectedPlatform && (
              <>
                <div className="step-header">
                  <button className="back-btn" onClick={handleBack}>← Назад</button>
                  <h2>{PLATFORMS.find(p => p.id === selectedPlatform)?.name}</h2>
                </div>
                <div className="services-scroll">
                  {filteredServices.map((s, i) => (
                    <div key={i} className="service-detail-card"
                      onClick={() => handleServiceClick(s)}>
                      <div className="service-detail-name">{s.name}</div>
                      <div className="service-detail-info">
                        <span className="service-detail-price">{s.rate} ₽</span>
                        <span className="service-detail-unit">/ 1000 шт</span>
                      </div>
                      <div className="service-detail-limits">
                        от {s.min || 10} до {s.max || 100000} шт
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'order' && selectedService && (
              <>
                <div className="step-header">
                  <button className="back-btn" onClick={handleBack}>← Назад</button>
                  <h2>Оформить заказ</h2>
                </div>
                <div className="selected-service-card">
                  <div className="selected-service-title">{selectedService.name}</div>
                  <div className="selected-service-meta">
                    <div className="meta-item">
                      <span className="meta-label">ЦЕНА</span>
                      <span className="meta-value">{selectedService.rate} ₽/1000</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">МИН.</span>
                      <span className="meta-value">{selectedService.min || 10}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">МАКС.</span>
                      <span className="meta-value">{selectedService.max || 100000}</span>
                    </div>
                  </div>
                </div>

                <label>Ссылка</label>
                <input type="text" placeholder="Ссылка на профиль, видео или пост" value={link} onChange={(e) => setLink(e.target.value)} />

                <label>Количество</label>
                <div className="quantity-control">
                  <button className="quantity-btn" onClick={() => setQuantity(q => Math.max((selectedService.min || 10), q - getStep(q)))} disabled={quantity <= (selectedService.min || 10)}>−</button>
                  <input type="number" value={quantity} onChange={(e) => {
                    let val = parseInt(e.target.value) || (selectedService.min || 10)
                    if (val < (selectedService.min || 10)) val = selectedService.min || 10
                    if (val > (selectedService.max || 100000)) val = selectedService.max || 100000
                    setQuantity(val)
                  }} min={selectedService.min || 10} max={selectedService.max || 100000} />
                  <button className="quantity-btn" onClick={() => setQuantity(q => Math.min((selectedService.max || 100000), q + getStep(q)))} disabled={quantity >= (selectedService.max || 100000)}>+</button>
                </div>
                <p className="quantity-hint">От {selectedService.min || 10} до {selectedService.max || 100000}</p>

                <div className="order-total">
                  Итого к оплате: <span className="highlight">~{((selectedService.rate / 1000) * quantity).toFixed(2)} ₽</span>
                </div>

                <button className="btn-primary" onClick={createOrder}>🚀 Оформить заказ</button>
              </>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile">
            <h2>👤 Профиль</h2>
            <p>ID: {userId}</p>
            <p>Имя: {userName}</p>
            <div className="profile-balance">💰 Баланс: 0 ₽</div>
            <button className="btn-primary">💳 Пополнить баланс</button>

            <div className="orders-history">
              <div className="orders-history-header">
                <h3>📋 История заказов</h3>
                <button className="btn-refresh" onClick={loadOrders}>🔄</button>
              </div>
              {orders.length === 0 && <p className="orders-empty">Нет заказов</p>}
              {orders.map((o, i) => (
                <div key={i} className="order-card">
                  <div className="order-card-header">
                    <span className="order-id">#{o.provider_order_id}</span>
                    <span className={`order-status-badge ${o.status}`}>
                      {o.status === 'pending' && '⏳ В обработке'}
                      {o.status === 'completed' && '✅ Выполнен'}
                      {o.status === 'failed' && '❌ Ошибка'}
                      {!['pending','completed','failed'].includes(o.status) && '🔄 ' + o.status}
                    </span>
                  </div>
                  <div className="order-card-body">
                    <div className="order-link">{o.link?.slice(0, 50)}</div>
                    <div className="order-quantity">{o.quantity} шт</div>
                  </div>
                  <div className="order-card-date">{new Date(o.created_at).toLocaleString('ru-RU')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className={`modal-card ${modal.type}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{modal.type === 'success' ? '✅' : '❌'}</div>
            <div className="modal-title">{modal.title}</div>
            <div className="modal-message">{modal.message}</div>
            <button className="btn-primary" onClick={closeModal} style={{ marginTop: 12 }}>
              {modal.type === 'success' ? 'Отлично' : 'Закрыть'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App