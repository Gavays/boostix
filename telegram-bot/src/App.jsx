/* eslint-disable react-hooks/exhaustive-deps */
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
  const [orderStatus, setOrderStatus] = useState(null)
  const [step, setStep] = useState('platforms') // 'platforms' | 'services' | 'order'

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

  const showAlert = (msg) => tg ? tg.showAlert(msg) : alert(msg)

  const analyzeLink = () => {
    if (!smartLink.trim()) { showAlert('Вставьте ссылку'); return }
    let platform = null
    if (smartLink.includes('t.me') || smartLink.includes('telegram')) platform = 'Telegram'
    else if (smartLink.includes('youtube.com') || smartLink.includes('youtu.be')) platform = 'YouTube'
    else if (smartLink.includes('instagram.com')) platform = 'Instagram'
    else if (smartLink.includes('tiktok.com')) platform = 'TikTok'
    else if (smartLink.includes('vk.com')) platform = 'ВКонтакте'
    else { showAlert('Не удалось определить платформу'); return }

    setDetectedPlatform(platform)
    setSmartLink('')
    const filtered = services.filter(s => s.name.toLowerCase().includes(platform.toLowerCase())).slice(0, 5)
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
    ? services.filter(s => s.name.toLowerCase().includes(selectedPlatform.toLowerCase()))
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
    if (!selectedService || !link || !quantity) { showAlert('Заполните все поля'); return }
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedService.service, link, quantity })
      })
      const data = await res.json()
      if (data.success) {
        setOrderStatus(`Заказ #${data.orderId} создан!`)
        setLink('')
        setQuantity(100)
        setSelectedService(null)
        setSelectedPlatform(null)
        setStep('platforms')
        setTimeout(() => setOrderStatus(null), 5000)
      } else showAlert(`Ошибка: ${data.error}`)
    } catch { showAlert('Ошибка соединения с сервером') }
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>🤖 Boostix</h1>
        <p className="subtitle">Умное продвижение</p>
      </div>

      <div className="tabs">
        <button className={activeTab === 'smart' ? 'active' : ''} onClick={() => setActiveTab('smart')}>🎯 Умный</button>
        <button className={activeTab === 'order' ? 'active' : ''} onClick={() => { setActiveTab('order'); setStep('platforms'); setSelectedPlatform(null); setSelectedService(null) }}>⚡ Заказ</button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 Профиль</button>
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
                    <div className="smart-result-platform">{detectedPlatform}</div>
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
            {/* Шаг 1: Выбор платформы */}
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

            {/* Шаг 2: Список услуг */}
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

            {/* Шаг 3: Оформление заказа */}
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
                <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={selectedService.min || 10} max={selectedService.max || 100000} />
                <p className="quantity-hint">От {selectedService.min || 10} до {selectedService.max || 100000}</p>

                <div className="order-total">
                  Итого к оплате: <span className="highlight">~{((selectedService.rate / 1000) * quantity).toFixed(2)} ₽</span>
                </div>

                <button className="btn-primary" onClick={createOrder}>🚀 Оформить заказ</button>
                {orderStatus && <div className="order-status">{orderStatus}</div>}
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
          </div>
        )}
      </div>
    </div>
  )
}

export default App