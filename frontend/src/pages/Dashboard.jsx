import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = 'https://boostix-o2ty.onrender.com/api'

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

function Dashboard({ user, setUser }) {
  const [activeTab, setActiveTab] = useState('smart')
  const [smartLink, setSmartLink] = useState('')
  const [smartResults, setSmartResults] = useState(null)
  const [services, setServices] = useState([])
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [link, setLink] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [step, setStep] = useState('platforms')
  const [modal, setModal] = useState(null)
  const [orders, setOrders] = useState([])
  const [refStats, setRefStats] = useState(null)
  const [refLink, setRefLink] = useState('')
  const [refHistory, setRefHistory] = useState([])
  const [balance, setBalance] = useState(parseFloat(user.balance) || 0)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then(res => res.json())
      .then(data => { if (data.success && Array.isArray(data.data)) setServices(data.data) })
      .catch(() => {})
  }, [])

  const showModal = (type, title, message, action) => {
    setModal({ type, title, message, action })
  }

  const loadBalance = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/orders/user/balance/${user.telegram_id}`)
      const data = await res.json()
      if (data.success) setBalance(data.balance)
    } catch { /* ignore */ }
  }, [user.telegram_id])

  const loadOrders = useCallback(async () => {
    try {
      await fetch(`${API_URL}/orders/refresh/${user.telegram_id}`, { method: 'POST' }).catch(() => {})
      const res = await fetch(`${API_URL}/orders/user/orders/${user.telegram_id}`)
      const data = await res.json()
      if (data.success) setOrders(data.orders)
    } catch { /* ignore */ }
  }, [user.telegram_id])

  const loadRefData = useCallback(async () => {
    try {
      const [statsRes, linkRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/orders/referral/stats/${user.telegram_id}`),
        fetch(`${API_URL}/orders/referral/link/${user.telegram_id}`),
        fetch(`${API_URL}/orders/referral/history/${user.telegram_id}`)
      ])
      const stats = await statsRes.json()
      const link = await linkRes.json()
      const history = await historyRes.json()
      if (stats.success) setRefStats(stats)
      if (link.success) setRefLink(link.link)
      if (history.success) setRefHistory(history.history)
    } catch { /* ignore */ }
  }, [user.telegram_id])

  const validateLink = (link, platform) => {
    const allowed = LINK_RULES[platform]
    if (!allowed) return true
    return allowed.some(domain => link.toLowerCase().includes(domain))
  }

  const validateServiceLink = (link, serviceName) => {
    const name = serviceName.toLowerCase()
    const isFollowers = name.includes('подписчик') || name.includes('subscriber') || name.includes('follow')
    const isPost = /реакци|reaction|лайк|like|просмотр|view|комментар|comment|репост|repost|поделить/.test(name)
    
    if (isFollowers) {
      if (/\/post\/|\/video\/|\/reel\/|\/story\/|\/photo\//.test(link)) {
        return { valid: false, message: 'Для подписчиков нужна ссылка на профиль или канал.' }
      }
    }
    
    if (isPost) {
      const hasPost = link.includes('/post/') || link.includes('/video/') || link.includes('/reel/') || link.includes('/story/') || (link.match(/\//g) || []).length > 3
      if (!hasPost) return { valid: false, message: 'Нужна ссылка на конкретный пост, видео или публикацию.' }
    }
    
    return { valid: true }
  }

  const getStep = (q) => {
    if (q >= 10000) return 1000
    if (q >= 1000) return 100
    if (q >= 100) return 50
    return 10
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

    const filtered = services.filter(s => s.name.toLowerCase().includes(PLATFORMS.find(p => p.id === platform)?.name.toLowerCase())).slice(0, 10)
    setSmartResults({ platform, suggestions: filtered.length > 0 ? filtered : [
      { name: '👥 Подписчики', rate: '390.00', service: '118' },
      { name: '👀 Просмотры', rate: '190.00', service: '118' },
      { name: '❤️ Реакции', rate: '150.00', service: '391' },
    ]})
    setSmartLink('')
  }

  const createOrder = async () => {
    if (!selectedService || !link || !quantity) { showModal('error', 'Ошибка', 'Заполните все поля'); return }

    const linkCheck = validateServiceLink(link, selectedService.name)
    if (!linkCheck.valid) { showModal('error', '❌ Неверная ссылка', linkCheck.message); return }

    if (selectedPlatform && !validateLink(link, selectedPlatform)) {
      showModal('error', '❌ Неверная ссылка', `Ссылка должна вести на ${PLATFORMS.find(p => p.id === selectedPlatform)?.name}.`)
      return
    }

    try {
      const balanceRes = await fetch(`${API_URL}/orders/user/balance/${user.telegram_id}`)
      const balanceData = await balanceRes.json()
      if (balanceData.success && balanceData.balance <= 0) {
        showModal('error', '💰 Недостаточно средств', 'Пополните баланс для создания заказа.')
        return
      }
    } catch { /* ignore */ }

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedService.service, link, quantity, userId: user.telegram_id })
      })
      const data = await res.json()
      if (data.success) {
        showModal('success', '✅ Заказ создан!', `Номер: #${data.orderId}\nКол-во: ${quantity}`)
        setLink(''); setQuantity(100); setSelectedService(null); setSelectedPlatform(null); setStep('platforms')
        loadBalance()
      } else {
        showModal('error', '❌ Ошибка', data.error || 'Не удалось создать заказ')
      }
    } catch {
      showModal('error', '❌ Ошибка соединения', 'Не удалось связаться с сервером')
    }
  }

  const topUpBalance = () => {
    const amount = prompt('Введите сумму пополнения (₽):', '500')
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) return
    
    fetch(`${API_URL}/orders/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.telegram_id, amount: parseInt(amount) })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBalance(b => b + parseInt(amount))
          showModal('success', '✅ Баланс пополнен!', `Начислено: ${amount} ₽`)
        } else {
          showModal('error', 'Ошибка', 'Не удалось пополнить баланс')
        }
      })
      .catch(() => showModal('error', 'Ошибка', 'Не удалось пополнить баланс'))
  }

  const copyRefLink = () => {
    if (refLink) {
      navigator.clipboard.writeText(refLink)
      showModal('success', '✅ Скопировано', 'Реферальная ссылка скопирована')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/')
  }

  const filteredServices = selectedPlatform
    ? services.filter(s => s.name.toLowerCase().includes(PLATFORMS.find(p => p.id === selectedPlatform)?.name.toLowerCase()))
    : []

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1>🤖 Boostix</h1>
        <div className="dash-user">
          <span>💰 {balance} ₽</span>
          <span>👤 {user.first_name || user.username}</span>
          <button onClick={handleLogout} className="btn-logout">Выйти</button>
        </div>
      </header>

      <div className="tabs">
        <button className={activeTab === 'smart' ? 'active' : ''} onClick={() => { setActiveTab('smart'); setSmartResults(null) }}>🎯 Умный</button>
        <button className={activeTab === 'order' ? 'active' : ''} onClick={() => { setActiveTab('order'); setStep('platforms'); setSelectedPlatform(null); setSelectedService(null) }}>⚡ Заказ</button>
        <button className={activeTab === 'ref' ? 'active' : ''} onClick={() => { setActiveTab('ref'); loadRefData() }}>👥 Рефералы</button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); loadOrders(); loadBalance() }}>👤 Профиль</button>
      </div>

      <div className="dash-content">
        {activeTab === 'smart' && !smartResults && (
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
          </div>
        )}

        {smartResults && (
          <div className="order-form">
            <div className="step-header">
              <button className="back-btn" onClick={() => setSmartResults(null)}>← Назад</button>
              <h2>{PLATFORMS.find(p => p.id === smartResults.platform)?.name}</h2>
            </div>
            <div className="services-scroll">
              {smartResults.suggestions.map((s, i) => (
                <div key={i} className="service-detail-card" onClick={() => { setSelectedService(s); setSmartResults(null); setStep('order'); setActiveTab('order') }}>
                  <div className="service-detail-name">{s.name}</div>
                  <div className="service-detail-info">
                    <span className="service-detail-price">{s.rate} ₽</span>
                    <span className="service-detail-unit">/ 1000 шт</span>
                  </div>
                </div>
              ))}
            </div>
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
                    <div key={p.id} className="platform-card" onClick={() => { setSelectedPlatform(p.id); setSelectedService(null); setStep('services') }}>
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
                  <button className="back-btn" onClick={() => { setStep('platforms'); setSelectedPlatform(null) }}>← Назад</button>
                  <h2>{PLATFORMS.find(p => p.id === selectedPlatform)?.name}</h2>
                </div>
                <div className="services-scroll">
                  {filteredServices.map((s, i) => (
                    <div key={i} className="service-detail-card" onClick={() => { setSelectedService(s); setStep('order') }}>
                      <div className="service-detail-name">{s.name}</div>
                      <div className="service-detail-info">
                        <span className="service-detail-price">{s.rate} ₽</span>
                        <span className="service-detail-unit">/ 1000 шт</span>
                      </div>
                      <div className="service-detail-limits">от {s.min || 10} до {s.max || 100000} шт</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'order' && selectedService && (
              <>
                <div className="step-header">
                  <button className="back-btn" onClick={() => setStep('services')}>← Назад</button>
                  <h2>Оформить заказ</h2>
                </div>
                <div className="selected-service-card">
                  <div className="selected-service-title">{selectedService.name}</div>
                  <div className="selected-service-meta">
                    <div className="meta-item"><span className="meta-label">ЦЕНА</span><span className="meta-value">{selectedService.rate} ₽/1000</span></div>
                    <div className="meta-item"><span className="meta-label">МИН.</span><span className="meta-value">{selectedService.min || 10}</span></div>
                    <div className="meta-item"><span className="meta-label">МАКС.</span><span className="meta-value">{selectedService.max || 100000}</span></div>
                  </div>
                </div>
                <label>Ссылка</label>
                <input type="text" placeholder="Ссылка на профиль, видео или пост" value={link} onChange={(e) => setLink(e.target.value)} />
                <label>Количество</label>
                <div className="quantity-control">
                  <button className="quantity-btn" onClick={() => setQuantity(q => Math.max((selectedService.min || 10), q - getStep(q)))} disabled={quantity <= (selectedService.min || 10)}>−</button>
                  <input type="number" value={quantity} onChange={(e) => { let val = parseInt(e.target.value) || (selectedService.min || 10); val = Math.min(Math.max(val, selectedService.min || 10), selectedService.max || 100000); setQuantity(val) }} />
                  <button className="quantity-btn" onClick={() => setQuantity(q => Math.min((selectedService.max || 100000), q + getStep(q)))} disabled={quantity >= (selectedService.max || 100000)}>+</button>
                </div>
                <p className="quantity-hint">От {selectedService.min || 10} до {selectedService.max || 100000}</p>
                <div className="order-total">Итого: <span className="highlight">~{((selectedService.rate / 1000) * quantity).toFixed(2)} ₽</span></div>
                <button className="btn-primary" onClick={createOrder}>🚀 Оформить заказ</button>
              </>
            )}
          </div>
        )}

        {activeTab === 'ref' && (
          <div className="profile">
            <h2>👥 Реферальная система</h2>
            <p>Приглашайте друзей и зарабатывайте!</p>
            <div className="profile-balance">💰 Заработано: {refStats?.totalEarned || '0'} ₽</div>
            {refLink && (
              <>
                <label>Ваша реферальная ссылка</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input type="text" value={refLink} readOnly style={{ flex: 1, fontSize: 12 }} />
                  <button className="btn-primary" onClick={copyRefLink} style={{ width: 'auto', marginTop: 0, padding: '12px 16px', fontSize: 13 }}>📋</button>
                </div>
              </>
            )}
            <div className="referral-levels" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16, marginBottom: 16 }}>
              <div className="ref-level-card"><div className="ref-level-num">1 уровень</div><div className="ref-level-percent">10%</div><div className="ref-level-count">{refStats?.level1 || 0} чел.</div></div>
              <div className="ref-level-card"><div className="ref-level-num">2 уровень</div><div className="ref-level-percent">3%</div><div className="ref-level-count">{refStats?.level2 || 0} чел.</div></div>
              <div className="ref-level-card"><div className="ref-level-num">3 уровень</div><div className="ref-level-percent">2%</div><div className="ref-level-count">{refStats?.level3 || 0} чел.</div></div>
            </div>
            <div className="orders-history">
              <h3>📋 История начислений</h3>
              {refHistory.length === 0 && <p className="orders-empty">Нет начислений</p>}
              {refHistory.map((h, i) => (
                <div key={i} className="order-card">
                  <div className="order-card-header"><span className="order-id" style={{ color: '#4ade80' }}>+{h.amount} ₽</span></div>
                  <div className="order-card-body"><div className="order-link">{h.description}</div></div>
                  <div className="order-card-date">{new Date(h.created_at).toLocaleString('ru-RU')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile">
            <h2>👤 Профиль</h2>
            <p>ID: {user.telegram_id?.slice(0, 12)}</p>
            <p>Имя: {user.first_name || user.username}</p>
            <div className="profile-balance">💰 Баланс: {balance} ₽</div>
            <button className="btn-primary" onClick={topUpBalance}>💳 Пополнить баланс</button>
            <div className="orders-history">
              <div className="orders-history-header">
                <h3>📋 История заказов</h3>
                <button className="btn-refresh" onClick={loadOrders}>🔄</button>
              </div>
              {orders.length === 0 && <p className="orders-empty">Нет заказов</p>}
              {orders.map((o, i) => (
                <div key={i} className="order-card">
                  <div className="order-card-header">
                    <span className="order-id">Заказ #{o.provider_order_id?.slice(0, 8)}</span>
                    <span className={`order-status-badge ${o.status}`}>
                      {o.status === 'pending' && '⏳ Ожидает'}
                      {o.status === 'in_progress' && '🔄 Выполняется'}
                      {o.status === 'completed' && '✅ Выполнен'}
                      {o.status === 'cancelled' && '🚫 Отменён'}
                      {o.status === 'failed' && '❌ Ошибка'}
                    </span>
                  </div>
                  <div className="order-card-body">
                    <div className="order-link">{o.link?.slice(0, 45)}</div>
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
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className={`modal-card ${modal.type}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{modal.type === 'success' ? '✅' : '❌'}</div>
            <div className="modal-title">{modal.title}</div>
            <div className="modal-message">{modal.message}</div>
            {modal.action && (
              <a href={modal.action.link} target="_blank" className="btn-primary" style={{ marginTop: 12, textDecoration: 'none', display: 'block' }}>
                {modal.action.text}
              </a>
            )}
            <button className="btn-primary" onClick={() => setModal(null)} style={{ marginTop: 8 }}>
              {modal.type === 'success' ? 'Отлично' : 'Закрыть'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard