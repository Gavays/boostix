import { useState, useEffect } from 'react'
import './index.css'

const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
const urlTgId = urlParams.get('tg_id')
const urlTgName = urlParams.get('tg_name')
const urlRef = urlParams.get('ref')

const tg = typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp : null
const user = tg?.initDataUnsafe?.user
const userId = user?.id ? String(user.id) : (urlTgId || 'Гость')
const userName = user?.first_name ? String(user.first_name) : (urlTgName ? decodeURIComponent(urlTgName) : 'Пользователь')

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
  const [adminData, setAdminData] = useState(null)
  const [adminSection, setAdminSection] = useState('dashboard')
  const [adminUsers, setAdminUsers] = useState([])
  const [adminSearch, setAdminSearch] = useState('')
  const [adminOrders, setAdminOrders] = useState([])
  const [adminOrderStatus, setAdminOrderStatus] = useState('all')
  const [adminTransactions, setAdminTransactions] = useState([])
  const [adminTransType, setAdminTransType] = useState('all')

  const API_URL = 'https://boostix-o2ty.onrender.com/api'

  useEffect(() => {
    if (tg) { tg.ready(); tg.expand() }
    if (userId !== 'Гость') {
      fetch(`${API_URL}/orders/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: userId, first_name: userName, username: '', ref: urlRef || null })
      }).catch(() => {})
    }
    fetch(`${API_URL}/services`)
      .then(res => res.json())
      .then(data => { if (data.success && Array.isArray(data.data)) setServices(data.data) })
      .catch(() => {})
  }, [])

  const showModal = (type, title, message, action) => {
    setModal({ type, title, message, action })
  }

  const validateLink = (link, platform) => {
    const allowed = LINK_RULES[platform]
    if (!allowed) return true
    return allowed.some(domain => link.toLowerCase().includes(domain))
  }

  const validateServiceLink = (link, serviceName) => {
    const name = serviceName.toLowerCase()
    
    const isFollowers = name.includes('подписчик') || name.includes('subscriber') || name.includes('follow')
    const isReactions = name.includes('реакци') || name.includes('reaction')
    const isLikes = name.includes('лайк') || name.includes('like')
    const isViews = name.includes('просмотр') || name.includes('view')
    const isComments = name.includes('комментар') || name.includes('comment')
    const isReposts = name.includes('репост') || name.includes('repost') || name.includes('поделить')
    
    if (isFollowers) {
      const postPatterns = ['/post/', '/video/', '/reel/', '/story/', '/photo/']
      const hasPostPattern = postPatterns.some(p => link.toLowerCase().includes(p))
      if (hasPostPattern) {
        return { valid: false, message: 'Для подписчиков нужна ссылка на профиль или канал, а не на пост/видео.' }
      }
    }
    
    if (isReactions || isLikes || isViews || isComments || isReposts) {
      const hasPostIndicators = link.includes('/post/') || 
                                link.includes('/video/') || 
                                link.includes('/reel/') ||
                                link.includes('/story/') ||
                                (link.match(/\//g) || []).length > 3
      if (!hasPostIndicators) {
        return { valid: false, message: 'Для данной услуги нужна ссылка на конкретный пост, видео или публикацию.' }
      }
    }
    
    return { valid: true }
  }

  const getStep = (q) => {
    if (q >= 10000) return 1000
    if (q >= 1000) return 100
    if (q >= 100) return 50
    return 10
  }

  const loadOrders = async () => {
    if (userId === 'Гость') return
    try {
      await fetch(`${API_URL}/orders/refresh/${userId}`, { method: 'POST' }).catch(() => {})
      const res = await fetch(`${API_URL}/orders/user/orders/${userId}`)
      const data = await res.json()
      if (data.success) setOrders(data.orders)
    } catch {
      // ignore
    }
  }

  const loadRefData = async () => {
    if (userId === 'Гость') return
    try {
      const [statsRes, linkRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/orders/referral/stats/${userId}`),
        fetch(`${API_URL}/orders/referral/link/${userId}`),
        fetch(`${API_URL}/orders/referral/history/${userId}`)
      ])
      const stats = await statsRes.json()
      const link = await linkRes.json()
      const history = await historyRes.json()
      
      if (stats.success) setRefStats(stats)
      if (link.success) setRefLink(link.link)
      if (history.success) setRefHistory(history.history)
    } catch {
      // ignore
    }
  }

  const loadAdminData = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/admin/dashboard`)
      const data = await res.json()
      if (data.success) setAdminData(data)
    } catch {
      // ignore
    }
  }

  const loadAdminUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/admin/users?search=${adminSearch}`)
      const data = await res.json()
      if (data.success) setAdminUsers(data.users)
    } catch {
      // ignore
    }
  }

  const loadAdminOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/admin/orders?status=${adminOrderStatus}`)
      const data = await res.json()
      if (data.success) setAdminOrders(data.orders)
    } catch {
      // ignore
    }
  }

  const loadAdminTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/admin/transactions?type=${adminTransType}`)
      const data = await res.json()
      if (data.success) setAdminTransactions(data.transactions)
    } catch {
      // ignore
    }
  }

  const toggleBlockUser = async (userId, currentBlock) => {
    await fetch(`${API_URL}/orders/admin/user/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, block: !currentBlock })
    })
    loadAdminUsers()
  }

  const changeBalance = async (userId, amount) => {
    await fetch(`${API_URL}/orders/admin/user/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount })
    })
    loadAdminUsers()
  }

  const refreshOrder = async (orderId) => {
    await fetch(`${API_URL}/orders/admin/order/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    })
    loadAdminOrders()
  }

  const copyRefLink = () => {
    if (refLink) {
      navigator.clipboard.writeText(refLink).then(() => {
        showModal('success', '✅ Скопировано', 'Реферальная ссылка скопирована в буфер обмена')
      }).catch(() => {
        showModal('error', 'Ошибка', 'Не удалось скопировать ссылку')
      })
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

    const filtered = services.filter(s => s.name.toLowerCase().includes(PLATFORMS.find(p => p.id === platform)?.name.toLowerCase())).slice(0, 10)
    const sugs = filtered.length > 0 ? filtered : [
      { name: '👥 Подписчики', rate: '390.00', service: '118' },
      { name: '👀 Просмотры', rate: '190.00', service: '118' },
      { name: '❤️ Реакции', rate: '150.00', service: '391' },
    ]
    setSmartResults({ platform, suggestions: sugs })
    setSmartLink('')
  }

  const selectSuggestion = (s) => {
    setSelectedService(s)
    setSmartResults(null)
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
      showModal('error', 'Ошибка', 'Заполните все поля')
      return
    }

    const linkCheck = validateServiceLink(link, selectedService.name)
    if (!linkCheck.valid) {
      showModal('error', '❌ Неверная ссылка', linkCheck.message)
      return
    }

    const platformId = selectedPlatform
    if (platformId && !validateLink(link, platformId)) {
      showModal('error', '❌ Неверная ссылка', `Ссылка должна вести на ${PLATFORMS.find(p => p.id === platformId)?.name}. Проверьте URL.`)
      return
    }

    try {
      const balanceRes = await fetch(`${API_URL}/orders/user/balance/${userId}`)
      const balanceData = await balanceRes.json()
      
      if (balanceData.success && balanceData.balance <= 0) {
        showModal('error', '💰 Недостаточно средств', 'Ваш баланс пуст. Пополните его для создания заказа.', { text: '💳 Пополнить баланс', link: 'https://t.me/boostix_smm_bot' })
        return
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: selectedService.service, link, quantity, userId: userId !== 'Гость' ? userId : null })
      })
      const data = await res.json()
      if (data.success) {
        showModal('success', '✅ Заказ успешно создан!', `Номер: #${data.orderId}\nУслуга: ${selectedService.name.slice(0, 50)}\nКол-во: ${quantity}`)
        setLink('')
        setQuantity(100)
        setSelectedService(null)
        setSelectedPlatform(null)
        setStep('platforms')
      } else {
        showModal('error', '❌ Ошибка', data.error || 'Не удалось создать заказ')
      }
    } catch {
      showModal('error', '❌ Ошибка соединения', 'Не удалось связаться с сервером')
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
        <button className={activeTab === 'smart' ? 'active' : ''} onClick={() => { setActiveTab('smart'); setSmartResults(null) }}>🎯 Умный</button>
        <button className={activeTab === 'order' ? 'active' : ''} onClick={() => { setActiveTab('order'); setStep('platforms'); setSelectedPlatform(null); setSelectedService(null) }}>⚡ Заказ</button>
        <button className={activeTab === 'ref' ? 'active' : ''} onClick={() => { setActiveTab('ref'); loadRefData() }}>👥 Рефералы</button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); loadOrders() }}>👤 Профиль</button>
        {userName === 'Manager_EGL' && (
          <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => { setActiveTab('admin'); loadAdminData() }}>⚙️</button>
        )}
      </div>

      <div className="tab-content">
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
                <div key={i} className="service-detail-card" onClick={() => selectSuggestion(s)}>
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

        {activeTab === 'ref' && (
          <div className="profile">
            <h2>👥 Реферальная система</h2>
            <p>Приглашайте друзей и зарабатывайте!</p>
            
            <div className="profile-balance" style={{ marginBottom: 12 }}>
              💰 Заработано: {refStats?.totalEarned || '0'} ₽
            </div>

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
                  <div className="order-card-header">
                    <span className="order-id" style={{ color: '#4ade80' }}>+{h.amount} ₽</span>
                  </div>
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
            <p>ID: {userId}</p>
            <p>Имя: {userName}</p>
            <div className="profile-balance">💰 Баланс: 0 ₽</div>
            <button className="btn-primary">💳 Пополнить баланс</button>

            <div className="orders-history">
              <div className="orders-history-header">
                <h3>📋 История заказов</h3>
                <button className="btn-refresh" onClick={loadOrders}>🔄</button>
              </div>
              {orders.length === 0 && <p className="orders-empty">У вас пока нет заказов</p>}
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
                      {!['pending','in_progress','completed','cancelled','failed'].includes(o.status) && '🔄 ' + o.status}
                    </span>
                  </div>
                  <div className="order-card-body"><div className="order-link" title={o.link}>{o.link?.slice(0, 45)}{o.link?.length > 45 ? '...' : ''}</div><div className="order-quantity">{o.quantity} шт</div></div>
                  <div className="order-card-date">{new Date(o.created_at).toLocaleString('ru-RU')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="profile">
            <h2>⚙️ Админ-панель</h2>
            
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              <button style={{ flex: 1, marginTop: 0, padding: 10, fontSize: 12, background: adminSection === 'dashboard' ? '#7c3aed' : '#1a1a1a', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer' }} onClick={() => setAdminSection('dashboard')}>📊</button>
              <button style={{ flex: 1, marginTop: 0, padding: 10, fontSize: 12, background: adminSection === 'users' ? '#7c3aed' : '#1a1a1a', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer' }} onClick={() => { setAdminSection('users'); loadAdminUsers() }}>👥</button>
              <button style={{ flex: 1, marginTop: 0, padding: 10, fontSize: 12, background: adminSection === 'orders' ? '#7c3aed' : '#1a1a1a', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer' }} onClick={() => { setAdminSection('orders'); loadAdminOrders() }}>📦</button>
              <button style={{ flex: 1, marginTop: 0, padding: 10, fontSize: 12, background: adminSection === 'transactions' ? '#7c3aed' : '#1a1a1a', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer' }} onClick={() => { setAdminSection('transactions'); loadAdminTransactions() }}>💰</button>
            </div>

            {adminSection === 'dashboard' && (
              <div className="admin-stats">
                <div className="admin-stat-card"><div className="admin-stat-num">{adminData?.totalUsers || 0}</div><div className="admin-stat-label">Пользователей</div></div>
                <div className="admin-stat-card"><div className="admin-stat-num">{adminData?.totalOrders || 0}</div><div className="admin-stat-label">Заказов</div></div>
                <div className="admin-stat-card"><div className="admin-stat-num">{adminData?.pendingOrders || 0}</div><div className="admin-stat-label">В обработке</div></div>
                <div className="admin-stat-card"><div className="admin-stat-num">{adminData?.completedOrders || 0}</div><div className="admin-stat-label">Выполнено</div></div>
                <div className="admin-stat-card"><div className="admin-stat-num">{adminData?.totalRevenue || '0'} ₽</div><div className="admin-stat-label">Выручка</div></div>
              </div>
            )}

            {adminSection === 'users' && (
              <>
                <input type="text" placeholder="Поиск по имени или ID..." value={adminSearch} onChange={(e) => { setAdminSearch(e.target.value); loadAdminUsers() }} style={{ marginBottom: 12 }} />
                <div className="services-scroll" style={{ maxHeight: '500px' }}>
                  {adminUsers.map((u, i) => (
                    <div key={i} className="order-card">
                      <div className="order-card-header">
                        <span className="order-id">{u.first_name || u.username || u.telegram_id}</span>
                        <span className={`order-status-badge ${u.is_blocked ? 'failed' : 'completed'}`}>{u.is_blocked ? '🚫 Заблокирован' : '✅ Активен'}</span>
                      </div>
                      <div className="order-card-body"><div>ID: {u.telegram_id}</div><div>💰 {u.balance} ₽</div></div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn-primary" style={{ flex: 1, marginTop: 0, padding: '8px', fontSize: 12 }} onClick={() => toggleBlockUser(u.telegram_id, u.is_blocked)}>{u.is_blocked ? 'Разблокировать' : 'Заблокировать'}</button>
                        <button className="btn-primary" style={{ flex: 1, marginTop: 0, padding: '8px', fontSize: 12, background: '#fbbf24', color: '#000' }} onClick={() => { const amount = prompt('Сумма:', '0'); if (amount) changeBalance(u.telegram_id, parseFloat(amount)) }}>💰 Баланс</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {adminSection === 'orders' && (
              <>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {['all', 'pending', 'in_progress', 'completed', 'cancelled', 'failed'].map(s => (
                    <button key={s} style={{ flex: 1, padding: '8px 2px', fontSize: 11, background: adminOrderStatus === s ? '#7c3aed' : '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }} onClick={() => { setAdminOrderStatus(s); loadAdminOrders() }}>
                      {s === 'all' ? 'Все' : s === 'pending' ? '⏳' : s === 'in_progress' ? '🔄' : s === 'completed' ? '✅' : s === 'cancelled' ? '🚫' : '❌'}
                    </button>
                  ))}
                </div>
                <div className="services-scroll" style={{ maxHeight: '500px' }}>
                  {adminOrders.map((o, i) => (
                    <div key={i} className="order-card">
                      <div className="order-card-header">
                        <span className="order-id">#{o.provider_order_id?.slice(0, 10)}</span>
                        <span className={`order-status-badge ${o.status === 'completed' ? 'completed' : o.status === 'failed' ? 'failed' : 'pending'}`}>
                          {o.status === 'pending' && '⏳ Ожидает'}
                          {o.status === 'in_progress' && '🔄 Выполняется'}
                          {o.status === 'completed' && '✅ Выполнен'}
                          {o.status === 'cancelled' && '🚫 Отменён'}
                          {o.status === 'failed' && '❌ Ошибка'}
                        </span>
                      </div>
                      <div className="order-card-body"><div className="order-link" title={o.link}>{o.link?.slice(0, 40)}</div><div className="order-quantity">{o.quantity} шт</div></div>
                      <div className="order-card-body"><div>👤 ID: {o.user_id}</div><div>{new Date(o.created_at).toLocaleString('ru-RU')}</div></div>
                      <button className="btn-primary" style={{ marginTop: 8, padding: '8px', fontSize: 12 }} onClick={() => refreshOrder(o.provider_order_id)}>🔄 Обновить статус</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {adminSection === 'transactions' && (
              <>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {['all', 'deposit', 'referral', 'debit'].map(t => (
                    <button key={t} style={{ flex: 1, padding: '8px 2px', fontSize: 11, background: adminTransType === t ? '#7c3aed' : '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }} onClick={() => { setAdminTransType(t); loadAdminTransactions() }}>
                      {t === 'all' ? 'Все' : t === 'deposit' ? '💳' : t === 'referral' ? '👥' : '🛒'}
                    </button>
                  ))}
                </div>
                <div className="services-scroll" style={{ maxHeight: '500px' }}>
                  {adminTransactions.map((t, i) => (
                    <div key={i} className="order-card">
                      <div className="order-card-header">
                        <span className="order-id" style={{ color: t.type === 'referral' ? '#4ade80' : '#a78bfa' }}>{t.type === 'referral' ? '+' : '-'}{t.amount} ₽</span>
                        <span className={`order-status-badge ${t.type === 'referral' ? 'completed' : 'pending'}`}>
                          {t.type === 'deposit' && '💳 Пополнение'}
                          {t.type === 'referral' && '👥 Реферал'}
                          {t.type === 'debit' && '🛒 Списание'}
                          {!['deposit','referral','debit'].includes(t.type) && t.type}
                        </span>
                      </div>
                      <div className="order-card-body"><div className="order-link">{t.description || 'Нет описания'}</div><div>👤 {t.user_id}</div></div>
                      <div className="order-card-date">{new Date(t.created_at).toLocaleString('ru-RU')}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className={`modal-card ${modal.type}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">{modal.type === 'success' ? '✅' : '❌'}</div>
            <div className="modal-title">{modal.title}</div>
            <div className="modal-message">{modal.message}</div>
            {modal.action && (
              <a href={modal.action.link} target="_blank" className="btn-primary" style={{ marginTop: 12, textDecoration: 'none', display: 'block' }}>{modal.action.text}</a>
            )}
            <button className="btn-primary" onClick={closeModal} style={{ marginTop: 8 }}>{modal.type === 'success' ? 'Отлично' : 'Закрыть'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App