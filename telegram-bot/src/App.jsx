import { useState, useEffect } from 'react'
import './index.css'

const tg = typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp : null
const initUser = tg?.initDataUnsafe?.user

const PLATFORMS = [
  { id: 'telegram', name: 'Telegram', icon: '/icons/boostix-telegram.png' },
  { id: 'youtube', name: 'YouTube', icon: '/icons/boostix-youtube.png' },
  { id: 'instagram', name: 'Instagram', icon: '/icons/boostix-instagram.png' },
  { id: 'tiktok', name: 'TikTok', icon: '/icons/boostix-tiktok.png' },
  { id: 'vkontakte', name: 'ВКонтакте', icon: '/icons/boostix-vk.png' },
  { id: 'likee', name: 'Likee', icon: '/icons/boostix-likee.png' },
]

function App() {
  const [activeTab, setActiveTab] = useState('order')
  const [services, setServices] = useState([])
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [link, setLink] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [orderStatus, setOrderStatus] = useState(null)
  const [autoBudget, setAutoBudget] = useState('')
  const [autoGoal, setAutoGoal] = useState('')
  const [autoPlan, setAutoPlan] = useState(null)

  const API_URL = 'https://boostix-o2ty.onrender.com/api'
  const userId = initUser?.id || 'Гость'
  const userName = initUser?.first_name || 'Пользователь'

  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()
    }
    fetch(`${API_URL}/services`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) setServices(data.data)
      })
      .catch(() => {})
  }, [])

  const filteredServices = selectedPlatform
    ? services.filter(s => s.name.toLowerCase().includes(selectedPlatform.toLowerCase()))
    : []

  const showAlert = (msg) => tg ? tg.showAlert(msg) : alert(msg)

  const createOrder = async () => {
    if (!selectedService || !link || !quantity) { showAlert('Заполните все поля'); return }
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedService.service, link, quantity })
      })
      const data = await res.json()
      if (data.success) setOrderStatus(`Заказ #${data.orderId} создан!`)
      else showAlert(`Ошибка: ${data.error}`)
    } catch { showAlert('Ошибка соединения с сервером') }
  }

  const createAutoPlan = () => {
    if (!autoBudget || !autoGoal) { showAlert('Укажите бюджет и цель'); return }
    setAutoPlan({
      goal: parseInt(autoGoal),
      dailyBudget: parseInt(autoBudget),
      estimatedDays: Math.ceil(parseInt(autoGoal) / (parseInt(autoBudget) / 200)),
    })
    showAlert('План создан!')
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>🤖 Boostix</h1>
        <p className="subtitle">Умное продвижение</p>
      </div>

      <div className="tabs">
        <button className={activeTab === 'order' ? 'active' : ''} onClick={() => setActiveTab('order')}>⚡ Заказ</button>
        <button className={activeTab === 'auto' ? 'active' : ''} onClick={() => setActiveTab('auto')}>🤖 Авто</button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 Профиль</button>
      </div>

      <div className="tab-content">
        {activeTab === 'order' && (
          <div className="order-form">
            <h2>Выберите платформу</h2>
            <p className="order-subtitle">Нажмите на иконку соцсети, чтобы увидеть доступные услуги</p>

            <div className="platforms-grid">
              {PLATFORMS.map(p => (
                <div 
                  key={p.id}
                  className={`platform-card ${selectedPlatform === p.id ? 'active' : ''}`}
                  onClick={() => { setSelectedPlatform(p.id); setSelectedService(null) }}
                >
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
                    <div 
                      key={i}
                      className={`service-mini-card ${selectedService?.service === s.service ? 'selected' : ''}`}
                      onClick={() => setSelectedService(s)}
                    >
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

        {activeTab === 'auto' && (
          <div className="auto-tab">
            <h2>🤖 Автопродвижение</h2>
            <p>Укажите цель и дневной бюджет</p>
            <label>Цель (подписчиков)</label>
            <input type="number" placeholder="5000" value={autoGoal} onChange={(e) => setAutoGoal(e.target.value)} />
            <label>Бюджет в день (₽)</label>
            <input type="number" placeholder="2500" value={autoBudget} onChange={(e) => setAutoBudget(e.target.value)} />
            <button className="btn-primary" onClick={createAutoPlan}>🤖 Запустить автопилот</button>
            {autoPlan && (
              <div className="auto-plan">
                <div className="plan-row"><span>Цель</span><span>+{autoPlan.goal}</span></div>
                <div className="plan-row"><span>Бюджет/день</span><span>до {autoPlan.dailyBudget} ₽</span></div>
                <div className="plan-row"><span>Прогноз</span><span className="highlight">{autoPlan.estimatedDays} дней</span></div>
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