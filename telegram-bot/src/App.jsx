import { useState, useEffect } from 'react'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('smart')
  const [smartLink, setSmartLink] = useState('')
  const [detectedPlatform, setDetectedPlatform] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [link, setLink] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [orderStatus, setOrderStatus] = useState(null)
  const [autoBudget, setAutoBudget] = useState('')
  const [autoGoal, setAutoGoal] = useState('')
  const [autoPlan, setAutoPlan] = useState(null)
  const [platformFilter, setPlatformFilter] = useState('Все')
  const [searchQuery, setSearchQuery] = useState('')

  const API_URL = 'https://boostix-o2ty.onrender.com/api'
  const tg = typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp : null
  const userId = tg?.initDataUnsafe?.user?.id || 'Гость'
  const userName = tg?.initDataUnsafe?.user?.first_name || 'Пользователь'

  useEffect(() => { 
    if (tg) {
      tg.ready()
      tg.expand()
    }
  }, [tg])

  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setServices(data.data)
        }
      })
      .catch(() => {})
  }, [])

  const filteredServices = services.filter(s => {
    const matchPlatform = platformFilter === 'Все' || s.name.toLowerCase().includes(platformFilter.toLowerCase())
    const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchPlatform && matchSearch
  })

  const showAlert = (msg) => tg ? tg.showAlert(msg) : alert(msg)

  const analyzeLink = () => {
    if (!smartLink.trim()) { showAlert('Вставьте ссылку'); return }
    
    if (smartLink.includes('t.me') || smartLink.includes('telegram')) {
      setDetectedPlatform('Telegram')
    } else if (smartLink.includes('youtube.com') || smartLink.includes('youtu.be')) {
      setDetectedPlatform('YouTube')
    } else if (smartLink.includes('instagram.com')) {
      setDetectedPlatform('Instagram')
    } else if (smartLink.includes('tiktok.com')) {
      setDetectedPlatform('TikTok')
    } else if (smartLink.includes('vk.com')) {
      setDetectedPlatform('ВКонтакте')
    } else {
      showAlert('Не удалось определить платформу. Укажите вручную.')
      return
    }

    const filtered = services.filter(s => 
      s.name.toLowerCase().includes(detectedPlatform.toLowerCase())
    ).slice(0, 5)
    
    setSuggestions(filtered.length > 0 ? filtered : [
      { name: '👥 Подписчики', rate: '390.00', service: '118' },
      { name: '👀 Просмотры', rate: '190.00', service: '118' },
      { name: '❤️ Реакции', rate: '150.00', service: '391' },
    ])
  }

  const createOrder = async () => {
    if (!selectedService || !link || !quantity) { showAlert('Заполните все поля'); return }
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedService.service || selectedService.serviceId, link, quantity })
      })
      const data = await res.json()
      if (data.success) setOrderStatus(`Заказ #${data.orderId} создан!`)
      else showAlert(`Ошибка: ${data.error}`)
    } catch { showAlert('Ошибка соединения с сервером') }
  }

  const createAutoPlan = () => {
    if (!autoBudget || !autoGoal) { showAlert('Укажите бюджет и цель'); return }
    const days = Math.ceil(parseInt(autoGoal) / (parseInt(autoBudget) / 200))
    setAutoPlan({
      goal: parseInt(autoGoal),
      dailyBudget: parseInt(autoBudget),
      estimatedDays: days,
      progress: 0,
      status: 'active'
    })
    showAlert(`План создан! Прогноз: ${days} дней`)
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
        <button className={activeTab === 'auto' ? 'active' : ''} onClick={() => setActiveTab('auto')}>🤖 Авто</button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 Профиль</button>
      </div>

      <div className="tab-content">
        {activeTab === 'smart' && (
          <div className="smart-tab">
            <div className="smart-hero">
              <span className="smart-icon">🎯</span>
              <h2>Умный подбор</h2>
              <p>Вставьте ссылку — Boostix сам определит платформу и подберёт лучшие услуги</p>
            </div>

            <div className="smart-input-group">
              <span className="smart-input-icon">🔗</span>
              <input type="text" placeholder="Вставьте ссылку на профиль или пост..." value={smartLink} onChange={(e) => setSmartLink(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={analyzeLink}>🔍 Анализировать</button>

            {detectedPlatform && (
              <div className="smart-result">
                <div className="smart-result-header">
                  <span className="smart-result-icon">✅</span>
                  <div>
                    <div className="smart-result-label">Платформа определена</div>
                    <div className="smart-result-platform">{detectedPlatform}</div>
                  </div>
                </div>
                <div className="smart-result-title">🎯 Рекомендуемые услуги:</div>
                <div className="suggestions-list">
                  {suggestions.map((s, i) => (
                    <div key={i} className={`suggestion-card ${i === 0 ? 'suggestion-best' : ''}`}
                      onClick={() => { setSelectedService(s); setActiveTab('order'); setLink(smartLink) }}>
                      <div className="suggestion-left">
                        <span className="suggestion-icon">{s.name?.split(' ')[0] || '📦'}</span>
                        <div>
                          <div className="suggestion-name">{s.name || s.type}</div>
                          <div className="suggestion-badge">{i === 0 ? '🔥 Лучший выбор' : '⚡ Быстрый старт'}</div>
                        </div>
                      </div>
                      <div className="suggestion-right">
                        <div className="suggestion-price">от {s.rate || '?'} ₽</div>
                        <div className="suggestion-arrow">›</div>
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
            <h2>⚡ Быстрый заказ</h2>
            
            <label>Платформа</label>
            <div className="platform-filter">
              {['Все', 'Telegram', 'Instagram', 'YouTube', 'TikTok', 'ВКонтакте'].map(p => (
                <button 
                  key={p}
                  className={`platform-chip ${platformFilter === p ? 'active' : ''}`}
                  onClick={() => setPlatformFilter(p)}
                >{p}</button>
              ))}
            </div>

            <label>Поиск услуги</label>
            <input 
              type="text" 
              placeholder="Например: подписчики Telegram..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchQuery && (
              <div className="services-dropdown">
                {filteredServices.slice(0, 10).map((s, i) => (
                  <div 
                    key={i} 
                    className={`service-option ${selectedService?.service === s.service ? 'selected' : ''}`}
                    onClick={() => { setSelectedService(s); setSearchQuery('') }}
                  >
                    <div className="service-option-name">{s.name.slice(0, 70)}</div>
                    <div className="service-option-price">{s.rate} ₽</div>
                  </div>
                ))}
                {filteredServices.length === 0 && (
                  <div className="service-option-empty">Ничего не найдено</div>
                )}
              </div>
            )}

            {selectedService && (
              <div className="selected-service-badge">
                ✅ {selectedService.name.slice(0, 60)} — {selectedService.rate} ₽
                <span className="remove-service" onClick={() => setSelectedService(null)}>✕</span>
              </div>
            )}

            <label>Ссылка на профиль или пост</label>
            <input type="text" placeholder="https://t.me/username" value={link} onChange={(e) => setLink(e.target.value)} />
            
            <label>Количество</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={10} />
            
            <button className="btn-primary" onClick={createOrder}>🚀 Оформить заказ</button>
            {orderStatus && <div className="order-status">{orderStatus}</div>}
          </div>
        )}

        {activeTab === 'auto' && (
          <div className="auto-tab">
            <h2>🤖 Автопродвижение</h2>
            <p>Укажите цель и дневной бюджет — система сама всё сделает</p>
            <label>Цель (подписчиков)</label>
            <input type="number" placeholder="Например: 5000" value={autoGoal} onChange={(e) => setAutoGoal(e.target.value)} />
            <label>Бюджет в день (₽)</label>
            <input type="number" placeholder="Например: 2500" value={autoBudget} onChange={(e) => setAutoBudget(e.target.value)} />
            <button className="btn-primary" onClick={createAutoPlan}>🤖 Запустить автопилот</button>
            {autoPlan && (
              <div className="auto-plan">
                <div className="plan-row"><span>Цель</span><span>+{autoPlan.goal} подписчиков</span></div>
                <div className="plan-row"><span>Бюджет/день</span><span>до {autoPlan.dailyBudget} ₽</span></div>
                <div className="plan-row"><span>Прогноз</span><span className="highlight">{autoPlan.estimatedDays} дней</span></div>
                <div className="progress-bar"><div className="progress-fill"></div></div>
                <div className="plan-status">🟢 Активно</div>
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