import { useState, useEffect } from 'react'
import './index.css'

const tg = typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp : null
const initUser = tg?.initDataUnsafe?.user
const initialUserId = initUser?.id || 'Гость'
const initialUserName = initUser?.first_name || 'Пользователь'

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

  const API_URL = 'https://boostix-o2ty.onrender.com/api'
  const userId = initialUserId
  const userName = initialUserName

  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()

      const user = tg.initDataUnsafe?.user
      if (user?.id) {
        fetch(`${API_URL}/orders/user/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: user.id,
            first_name: user.first_name,
            username: user.username
          })
        }).catch(() => {})
      }
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
    setSelectedPlatform(null)
    setActiveTab('order')
  }

  const filteredServices = selectedPlatform
    ? services.filter(s => s.name.toLowerCase().includes(selectedPlatform.toLowerCase()))
    : []

  const selectPlatformAndService = (platformId) => {
    setSelectedPlatform(platformId)
    setSelectedService(null)
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
        setTimeout(() => setOrderStatus(null), 5000)
      }
      else showAlert(`Ошибка: ${data.error}`)
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
        <button className={activeTab === 'order' ? 'active' : ''} onClick={() => setActiveTab('order')}>⚡ Заказ</button>
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
            <h2>Выберите платформу</h2>
            <p className="order-subtitle">Нажмите на иконку, чтобы увидеть услуги</p>
            <div className="platforms-grid">
              {PLATFORMS.map(p => (
                <div key={p.id} className={`platform-card ${selectedPlatform === p.id ? 'active' : ''}`}
                  onClick={() => selectPlatformAndService(p.id)}>
                  <img src={p.icon} alt={p.name} className="platform-card-icon-img" />
                  <span className="platform-card-name">{p.name}</span>
                </div>
              ))}
            </div>
            {selectedPlatform && (
              <div className="services-section">
                <h3>Услуги {PLATFORMS.find(p => p.id === selectedPlatform)?.name}</h3>
                <div className="services-scroll">
                  {filteredServices.slice(0, 20).map((s, i) => (
                    <div key={i} className={`service-mini-card ${selectedService?.service === s.service ? 'selected' : ''}`}
                      onClick={() => setSelectedService(s)}>
                      <div className="service-mini-name">{s.name.slice(0, 70)}</div>
                      <div className="service-mini-price">{s.rate} ₽</div>
                    </div>
                  ))}
                </div>
                {selectedService && (
                  <>
                    <label>Ссылка</label>
                    <input type="text" placeholder="https://t.me/username" value={link} onChange={(e) => setLink(e.target.value)} />
                    <label>Количество</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={10} />
                    <button className="btn-primary" onClick={createOrder}>🚀 Оформить заказ</button>
                  </>
                )}
                {orderStatus && <div className="order-status">{orderStatus}</div>}
              </div>
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