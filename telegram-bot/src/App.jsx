import { useState, useEffect } from 'react'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('smart')
  const [smartLink, setSmartLink] = useState('')
  const [detectedPlatform, setDetectedPlatform] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [link, setLink] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [orderStatus, setOrderStatus] = useState(null)
  const [autoBudget, setAutoBudget] = useState('')
  const [autoGoal, setAutoGoal] = useState('')
  const [autoPlan, setAutoPlan] = useState(null)

  const API_URL = 'http://localhost:3001/api'
  const tg = typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp : null

  useEffect(() => { tg?.ready() }, [tg])

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

    setSuggestions([
      { type: '👥 Подписчики', price: 'от 390 ₽', serviceId: '1' },
      { type: '👀 Просмотры', price: 'от 190 ₽', serviceId: '2' },
      { type: '❤️ Реакции', price: 'от 150 ₽', serviceId: '3' },
    ])
  }

  const createOrder = async () => {
    if (!selectedService || !link || !quantity) { showAlert('Заполните все поля'); return }
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedService.serviceId || selectedService.service, link, quantity })
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
              <p>Вставьте ссылку — Boostix сам определит платформу и подберёт лучшие услуги для максимального роста</p>
            </div>

            <div className="smart-input-group">
              <span className="smart-input-icon">🔗</span>
              <input 
                type="text" 
                placeholder="Вставьте ссылку на профиль или пост..." 
                value={smartLink} 
                onChange={(e) => setSmartLink(e.target.value)} 
              />
            </div>
            <button className="btn-primary" onClick={analyzeLink}>
              🔍 Анализировать
            </button>

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
                    <div 
                      key={i} 
                      className={`suggestion-card ${i === 0 ? 'suggestion-best' : ''}`}
                      onClick={() => { setSelectedService(s); setActiveTab('order'); setLink(smartLink) }}
                    >
                      <div className="suggestion-left">
                        <span className="suggestion-icon">{s.type.split(' ')[0]}</span>
                        <div>
                          <div className="suggestion-name">{s.type.split(' ').slice(1).join(' ')}</div>
                          <div className="suggestion-badge">{i === 0 ? '🔥 Лучший выбор' : '⚡ Быстрый старт'}</div>
                        </div>
                      </div>
                      <div className="suggestion-right">
                        <div className="suggestion-price">{s.price}</div>
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
            
            <label>Услуга</label>
            <div className="selected-service">
              {selectedService ? selectedService.type || selectedService.name : 'Не выбрана'}
            </div>
            
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
            <p>ID: {tg?.initDataUnsafe?.user?.id || 'Гость'}</p>
            <p>Имя: {tg?.initDataUnsafe?.user?.first_name || 'Пользователь'}</p>
            <div className="profile-balance">💰 Баланс: 0 ₽</div>
            <button className="btn-primary">💳 Пополнить баланс</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App