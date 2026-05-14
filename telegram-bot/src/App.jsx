import { useState, useEffect, useCallback, useMemo } from 'react'
import './index.css'

// --- Константы ---
const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
const tg = typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp : null
const user = tg?.initDataUnsafe?.user

const USER_ID = user?.id ? String(user.id) : (urlParams.get('tg_id') || 'Гость')
const USER_NAME = user?.first_name ? String(user.first_name) : (urlParams.get('tg_name') ? decodeURIComponent(urlParams.get('tg_name')) : 'Пользователь')
const REF_CODE = urlParams.get('ref')

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

const API_URL = 'https://boostix-o2ty.onrender.com/api'

// --- Вспомогательные функции ---
const getStep = (quantity) => {
  if (quantity >= 10000) return 1000
  if (quantity >= 1000) return 100
  if (quantity >= 100) return 50
  return 10
}

const detectPlatform = (link) => {
  if (link.includes('t.me') || link.includes('telegram')) return 'telegram'
  if (link.includes('youtube.com') || link.includes('youtu.be')) return 'youtube'
  if (link.includes('instagram.com')) return 'instagram'
  if (link.includes('tiktok.com')) return 'tiktok'
  if (link.includes('vk.com')) return 'vkontakte'
  if (link.includes('likee.com')) return 'likee'
  return null
}

const validateLink = (link, platform) => {
  const allowed = LINK_RULES[platform]
  return allowed ? allowed.some(domain => link.toLowerCase().includes(domain)) : true
}

const validateServiceLink = (link, serviceName) => {
  const name = serviceName.toLowerCase()
  const isFollowers = /подписчик|subscriber|follow/.test(name)
  const isPostAction = /реакци|reaction|лайк|like|просмотр|view|комментар|comment|репост|repost|поделить/.test(name)
  
  if (isFollowers) {
    const hasPostPattern = /\/post\/|\/video\/|\/reel\/|\/story\/|\/photo\//.test(link)
    if (hasPostPattern) {
      return { valid: false, message: 'Для подписчиков нужна ссылка на профиль или канал, а не на пост/видео.' }
    }
  }
  
  if (isPostAction) {
    const hasPostIndicators = link.includes('/post/') || link.includes('/video/') || link.includes('/reel/') ||
                              link.includes('/story/') || (link.match(/\//g) || []).length > 3
    if (!hasPostIndicators) {
      return { valid: false, message: 'Для данной услуги нужна ссылка на конкретный пост, видео или публикацию.' }
    }
  }
  
  return { valid: true }
}

// --- Хук для API запросов ---
const useApi = () => {
  const request = useCallback(async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      })
      const data = await response.json()
      return data.success ? data : null
    } catch {
      return null
    }
  }, [])

  return { request }
}

// --- Компонент модального окна ---
const Modal = ({ modal, onClose }) => {
  if (!modal) return null
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-card ${modal.type}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">{modal.type === 'success' ? '✅' : '❌'}</div>
        <div className="modal-title">{modal.title}</div>
        <div className="modal-message">{modal.message}</div>
        {modal.action && (
          <a href={modal.action.link} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ marginTop: 12, textDecoration: 'none', display: 'block' }}>
            {modal.action.text}
          </a>
        )}
        <button className="btn-primary" onClick={onClose} style={{ marginTop: 8 }}>
          {modal.type === 'success' ? 'Отлично' : 'Закрыть'}
        </button>
      </div>
    </div>
  )
}

// --- Компонент шапки ---
const AppHeader = () => (
  <div className="app-header">
    <h1>🤖 Boostix</h1>
    <p className="subtitle">Умное продвижение</p>
  </div>
)

// --- Компонент вкладок ---
const Tabs = ({ activeTab, onTabChange, isAdmin }) => {
  const tabs = [
    { id: 'smart', label: '🎯 Умный' },
    { id: 'order', label: '⚡ Заказ' },
    { id: 'ref', label: '👥 Рефералы' },
    { id: 'profile', label: '👤 Профиль' },
    ...(isAdmin ? [{ id: 'admin', label: '⚙️' }] : []),
  ]
  
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={activeTab === tab.id ? 'active' : ''}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// --- Компонент умного подбора ---
const SmartTab = ({ onAnalyze, onLinkChange, linkValue }) => (
  <div className="smart-tab">
    <div className="smart-hero">
      <span className="smart-icon">🎯</span>
      <h2>Умный подбор</h2>
      <p>Вставьте ссылку — Boostix определит платформу и подберёт услуги</p>
    </div>
    <div className="smart-input-group">
      <span className="smart-input-icon">🔗</span>
      <input
        type="text"
        placeholder="Вставьте ссылку..."
        value={linkValue}
        onChange={(e) => onLinkChange(e.target.value)}
      />
    </div>
    <button className="btn-primary" onClick={onAnalyze}>🔍 Анализировать</button>
  </div>
)

// --- Компонент выбора платформ ---
const PlatformsGrid = ({ platforms, onSelect }) => (
  <>
    <h2>Выберите платформу</h2>
    <p className="order-subtitle">Нажмите на иконку соцсети</p>
    <div className="platforms-grid">
      {platforms.map(platform => (
        <div key={platform.id} className="platform-card" onClick={() => onSelect(platform.id)}>
          <img src={platform.icon} alt={platform.name} className="platform-card-icon-img" />
          <span className="platform-card-name">{platform.name}</span>
        </div>
      ))}
    </div>
  </>
)

// --- Компонент списка услуг ---
const ServicesList = ({ services, platform, onBack, onSelect }) => {
  const platformName = PLATFORMS.find(p => p.id === platform)?.name
  
  return (
    <>
      <div className="step-header">
        <button className="back-btn" onClick={onBack}>← Назад</button>
        <h2>{platformName}</h2>
      </div>
      <div className="services-scroll">
        {services.map((service, index) => (
          <div key={index} className="service-detail-card" onClick={() => onSelect(service)}>
            <div className="service-detail-name">{service.name}</div>
            <div className="service-detail-info">
              <span className="service-detail-price">{service.rate} ₽</span>
              <span className="service-detail-unit">/ 1000 шт</span>
            </div>
            <div className="service-detail-limits">
              от {service.min || 10} до {service.max || 100000} шт
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// --- Компонент оформления заказа ---
const OrderForm = ({ service, onBack, onOrder, link, onLinkChange, quantity, onQuantityChange }) => {
  const total = useMemo(() => ((service.rate / 1000) * quantity).toFixed(2), [service.rate, quantity])
  const step = getStep(quantity)
  
  return (
    <>
      <div className="step-header">
        <button className="back-btn" onClick={onBack}>← Назад</button>
        <h2>Оформить заказ</h2>
      </div>
      
      <div className="selected-service-card">
        <div className="selected-service-title">{service.name}</div>
        <div className="selected-service-meta">
          <div className="meta-item">
            <span className="meta-label">ЦЕНА</span>
            <span className="meta-value">{service.rate} ₽/1000</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">МИН.</span>
            <span className="meta-value">{service.min || 10}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">МАКС.</span>
            <span className="meta-value">{service.max || 100000}</span>
          </div>
        </div>
      </div>

      <label>Ссылка</label>
      <input type="text" placeholder="Ссылка на профиль, видео или пост" value={link} onChange={(e) => onLinkChange(e.target.value)} />

      <label>Количество</label>
      <div className="quantity-control">
        <button className="quantity-btn" onClick={() => onQuantityChange(q => Math.max(service.min || 10, q - step))} disabled={quantity <= (service.min || 10)}>−</button>
        <input type="number" value={quantity} onChange={(e) => {
          let val = parseInt(e.target.value) || (service.min || 10)
          val = Math.min(Math.max(val, service.min || 10), service.max || 100000)
          onQuantityChange(val)
        }} min={service.min || 10} max={service.max || 100000} />
        <button className="quantity-btn" onClick={() => onQuantityChange(q => Math.min(service.max || 100000, q + step))} disabled={quantity >= (service.max || 100000)}>+</button>
      </div>
      <p className="quantity-hint">От {service.min || 10} до {service.max || 100000}</p>

      <div className="order-total">
        Итого к оплате: <span className="highlight">~{total} ₽</span>
      </div>

      <button className="btn-primary" onClick={onOrder}>🚀 Оформить заказ</button>
    </>
  )
}

// --- Компонент рефералов ---
const ReferralTab = ({ stats, link, history, onCopy }) => (
  <div className="profile">
    <h2>👥 Реферальная система</h2>
    <p>Приглашайте друзей и зарабатывайте!</p>
    
    <div className="profile-balance" style={{ marginBottom: 12 }}>
      💰 Заработано: {stats?.totalEarned || '0'} ₽
    </div>

    {link && (
      <>
        <label>Ваша реферальная ссылка</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input type="text" value={link} readOnly style={{ flex: 1, fontSize: 12 }} />
          <button className="btn-primary" onClick={onCopy} style={{ width: 'auto', marginTop: 0, padding: '12px 16px', fontSize: 13 }}>📋</button>
        </div>
      </>
    )}

    <div className="referral-levels" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16, marginBottom: 16 }}>
      <div className="ref-level-card">
        <div className="ref-level-num">1 уровень</div>
        <div className="ref-level-percent">10%</div>
        <div className="ref-level-count">{stats?.level1 || 0} чел.</div>
      </div>
      <div className="ref-level-card">
        <div className="ref-level-num">2 уровень</div>
        <div className="ref-level-percent">3%</div>
        <div className="ref-level-count">{stats?.level2 || 0} чел.</div>
      </div>
      <div className="ref-level-card">
        <div className="ref-level-num">3 уровень</div>
        <div className="ref-level-percent">2%</div>
        <div className="ref-level-count">{stats?.level3 || 0} чел.</div>
      </div>
    </div>

    <div className="orders-history">
      <h3>📋 История начислений</h3>
      {history.length === 0 && <p className="orders-empty">Нет начислений</p>}
      {history.map((item, index) => (
        <div key={index} className="order-card">
          <div className="order-card-header">
            <span className="order-id" style={{ color: '#4ade80' }}>+{item.amount} ₽</span>
          </div>
          <div className="order-card-body">
            <div className="order-link">{item.description}</div>
          </div>
          <div className="order-card-date">{new Date(item.created_at).toLocaleString('ru-RU')}</div>
        </div>
      ))}
    </div>
  </div>
)

// --- Компонент профиля ---
const ProfileTab = ({ userId, userName, orders, onRefresh, onDeposit }) => (
  <div className="profile">
    <h2>👤 Профиль</h2>
    <p>ID: {userId}</p>
    <p>Имя: {userName}</p>
    <div className="profile-balance">💰 Баланс: 0 ₽</div>
    <button className="btn-primary" onClick={onDeposit}>💳 Пополнить баланс</button>

    <div className="orders-history">
      <div className="orders-history-header">
        <h3>📋 История заказов</h3>
        <button className="btn-refresh" onClick={onRefresh}>🔄</button>
      </div>
      {orders.length === 0 && <p className="orders-empty">У вас пока нет заказов</p>}
      {orders.map((order, index) => (
        <div key={index} className="order-card">
          <div className="order-card-header">
            <span className="order-id">Заказ #{order.provider_order_id?.slice(0, 8)}</span>
            <span className={`order-status-badge ${order.status}`}>
              {order.status === 'pending' && '⏳ Ожидает'}
              {order.status === 'in_progress' && '🔄 Выполняется'}
              {order.status === 'completed' && '✅ Выполнен'}
              {order.status === 'cancelled' && '🚫 Отменён'}
              {order.status === 'failed' && '❌ Ошибка'}
              {!['pending','in_progress','completed','cancelled','failed'].includes(order.status) && '🔄 ' + order.status}
            </span>
          </div>
          <div className="order-card-body">
            <div className="order-link" title={order.link}>
              {order.link?.slice(0, 45)}{order.link?.length > 45 ? '...' : ''}
            </div>
            <div className="order-quantity">{order.quantity} шт</div>
          </div>
          <div className="order-card-date">{new Date(order.created_at).toLocaleString('ru-RU')}</div>
        </div>
      ))}
    </div>
  </div>
)

// --- Компонент админки ---
const AdminTab = ({
  section, onSectionChange,
  dashboard, users, orders, transactions, settings,
  userSearch, onUserSearch,
  orderStatus, onOrderStatusChange,
  transType, onTransTypeChange,
  onToggleBlock, onChangeBalance,
  onRefreshOrder, onSaveSettings,
  onSettingsChange
}) => {
  const sections = [
    { id: 'dashboard', label: '📊' },
    { id: 'users', label: '👥' },
    { id: 'orders', label: '📦' },
    { id: 'transactions', label: '💰' },
    { id: 'settings', label: '⚙️' },
  ]
  
  return (
    <div className="profile">
      <h2>⚙️ Админ-панель</h2>
      
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {sections.map(s => (
          <button
            key={s.id}
            style={{
              flex: 1, marginTop: 0, padding: 10, fontSize: 12,
              background: section === s.id ? '#7c3aed' : '#1a1a1a',
              border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer'
            }}
            onClick={() => onSectionChange(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'dashboard' && (
        <div className="admin-stats">
          <div className="admin-stat-card"><div className="admin-stat-num">{dashboard?.totalUsers || 0}</div><div className="admin-stat-label">Пользователей</div></div>
          <div className="admin-stat-card"><div className="admin-stat-num">{dashboard?.totalOrders || 0}</div><div className="admin-stat-label">Заказов</div></div>
          <div className="admin-stat-card"><div className="admin-stat-num">{dashboard?.pendingOrders || 0}</div><div className="admin-stat-label">В обработке</div></div>
          <div className="admin-stat-card"><div className="admin-stat-num">{dashboard?.completedOrders || 0}</div><div className="admin-stat-label">Выполнено</div></div>
          <div className="admin-stat-card"><div className="admin-stat-num">{dashboard?.totalRevenue || '0'} ₽</div><div className="admin-stat-label">Выручка</div></div>
        </div>
      )}

      {section === 'users' && (
        <>
          <input type="text" placeholder="Поиск по имени или ID..." value={userSearch} onChange={(e) => onUserSearch(e.target.value)} style={{ marginBottom: 12 }} />
          <div className="services-scroll" style={{ maxHeight: '500px' }}>
            {users.map((u, i) => (
              <div key={i} className="order-card">
                <div className="order-card-header">
                  <span className="order-id">{u.first_name || u.username || u.telegram_id}</span>
                  <span className={`order-status-badge ${u.is_blocked ? 'failed' : 'completed'}`}>{u.is_blocked ? '🚫 Заблокирован' : '✅ Активен'}</span>
                </div>
                <div className="order-card-body"><div>ID: {u.telegram_id}</div><div>💰 {u.balance} ₽</div></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn-primary" style={{ flex: 1, marginTop: 0, padding: '8px', fontSize: 12 }} onClick={() => onToggleBlock(u.telegram_id, u.is_blocked)}>{u.is_blocked ? 'Разблокировать' : 'Заблокировать'}</button>
                  <button className="btn-primary" style={{ flex: 1, marginTop: 0, padding: '8px', fontSize: 12, background: '#fbbf24', color: '#000' }} onClick={() => { const amount = prompt('Сумма:', '0'); if (amount) onChangeBalance(u.telegram_id, parseFloat(amount)) }}>💰 Баланс</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {section === 'orders' && (
        <>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {['all', 'pending', 'in_progress', 'completed', 'cancelled', 'failed'].map(s => (
              <button key={s} style={{ flex: 1, padding: '8px 2px', fontSize: 11, background: orderStatus === s ? '#7c3aed' : '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }} onClick={() => onOrderStatusChange(s)}>
                {s === 'all' ? 'Все' : s === 'pending' ? '⏳' : s === 'in_progress' ? '🔄' : s === 'completed' ? '✅' : s === 'cancelled' ? '🚫' : '❌'}
              </button>
            ))}
          </div>
          <div className="services-scroll" style={{ maxHeight: '500px' }}>
            {orders.map((o, i) => (
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
                <button className="btn-primary" style={{ marginTop: 8, padding: '8px', fontSize: 12 }} onClick={() => onRefreshOrder(o.provider_order_id)}>🔄 Обновить статус</button>
              </div>
            ))}
          </div>
        </>
      )}

      {section === 'transactions' && (
        <>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {['all', 'deposit', 'referral', 'debit'].map(t => (
              <button key={t} style={{ flex: 1, padding: '8px 2px', fontSize: 11, background: transType === t ? '#7c3aed' : '#1a1a1a', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }} onClick={() => onTransTypeChange(t)}>
                {t === 'all' ? 'Все' : t === 'deposit' ? '💳' : t === 'referral' ? '👥' : '🛒'}
              </button>
            ))}
          </div>
          <div className="services-scroll" style={{ maxHeight: '500px' }}>
            {transactions.map((t, i) => (
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

      {section === 'settings' && (
        <>
          <label>Наценка (%)</label>
          <input type="number" value={settings.default_markup || '50'} onChange={(e) => onSettingsChange({...settings, default_markup: e.target.value})} />
          
          <label>Мин. депозит (₽)</label>
          <input type="number" value={settings.min_deposit || '10'} onChange={(e) => onSettingsChange({...settings, min_deposit: e.target.value})} />
          
          <label>Макс. депозит (₽)</label>
          <input type="number" value={settings.max_deposit || '50000'} onChange={(e) => onSettingsChange({...settings, max_deposit: e.target.value})} />
          
          <label>Реферал 1 уровня (%)</label>
          <input type="number" value={settings.ref_level1 || '10'} onChange={(e) => onSettingsChange({...settings, ref_level1: e.target.value})} />
          
          <label>Реферал 2 уровня (%)</label>
          <input type="number" value={settings.ref_level2 || '3'} onChange={(e) => onSettingsChange({...settings, ref_level2: e.target.value})} />
          
          <label>Реферал 3 уровня (%)</label>
          <input type="number" value={settings.ref_level3 || '2'} onChange={(e) => onSettingsChange({...settings, ref_level3: e.target.value})} />
          
          <button className="btn-primary" onClick={onSaveSettings}>💾 Сохранить настройки</button>
        </>
      )}
    </div>
  )
}

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
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
  const [adminSettings, setAdminSettings] = useState({})

  const { request } = useApi()
  const isAdmin = USER_NAME === 'Manager_EGL'

  useEffect(() => {
    if (tg) { tg.ready(); tg.expand() }
    if (USER_ID !== 'Гость') {
      request('/orders/user/register', {
        method: 'POST',
        body: JSON.stringify({ telegram_id: USER_ID, first_name: USER_NAME, username: '', ref: REF_CODE })
      })
    }
    fetch(`${API_URL}/services`)
      .then(res => res.json())
      .then(data => { if (data.success && Array.isArray(data.data)) setServices(data.data) })
      .catch(() => {})
  }, [request])

  const showModal = useCallback((type, title, message, action) => {
    setModal({ type, title, message, action })
  }, [])

  const closeModal = useCallback(() => setModal(null), [])

  const loadOrders = useCallback(async () => {
    if (USER_ID === 'Гость') return
    try {
      await fetch(`${API_URL}/orders/refresh/${USER_ID}`, { method: 'POST' }).catch(() => {})
      const data = await request(`/orders/user/orders/${USER_ID}`)
      if (data?.orders) setOrders(data.orders)
    } catch {}
  }, [request])

  const loadRefData = useCallback(async () => {
    if (USER_ID === 'Гость') return
    try {
      const stats = await request(`/orders/referral/stats/${USER_ID}`)
      const link = await request(`/orders/referral/link/${USER_ID}`)
      const history = await request(`/orders/referral/history/${USER_ID}`)
      if (stats) setRefStats(stats)
      if (link) setRefLink(link.link)
      if (history) setRefHistory(history.history)
    } catch {}
  }, [request])

  const copyRefLink = useCallback(() => {
    if (refLink) {
      navigator.clipboard.writeText(refLink).then(() => {
        showModal('success', '✅ Скопировано', 'Реферальная ссылка скопирована')
      }).catch(() => {
        showModal('error', 'Ошибка', 'Не удалось скопировать ссылку')
      })
    }
  }, [refLink, showModal])

  const loadAdminData = useCallback(async () => {
    const data = await request('/orders/admin/dashboard')
    if (data) setAdminData(data)
  }, [request])

  const loadAdminUsers = useCallback(async () => {
    const data = await request(`/orders/admin/users?search=${adminSearch}`)
    if (data?.users) setAdminUsers([...data.users])
  }, [request, adminSearch])

  const loadAdminOrders = useCallback(async () => {
    const data = await request(`/orders/admin/orders?status=${adminOrderStatus}`)
    if (data?.orders) setAdminOrders(data.orders)
  }, [request, adminOrderStatus])

  const loadAdminTransactions = useCallback(async () => {
    const data = await request(`/orders/admin/transactions?type=${adminTransType}`)
    if (data?.transactions) setAdminTransactions(data.transactions)
  }, [request, adminTransType])

  const loadAdminSettings = useCallback(async () => {
    const data = await request('/orders/admin/settings')
    if (data?.settings) setAdminSettings(data.settings)
  }, [request])

  const saveSettings = useCallback(async () => {
    const result = await request('/orders/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ settings: adminSettings })
    })
    if (result) {
      showModal('success', '✅ Сохранено', 'Настройки обновлены')
    } else {
      showModal('error', 'Ошибка', 'Не удалось сохранить настройки')
    }
  }, [adminSettings, request, showModal])

  const toggleBlockUser = useCallback(async (userId, currentBlock) => {
    await request('/orders/admin/user/block', {
      method: 'POST',
      body: JSON.stringify({ userId, block: !currentBlock })
    })
    setTimeout(() => loadAdminUsers(), 1000)
  }, [request, loadAdminUsers])

  const changeBalance = useCallback(async (userId, amount) => {
    await request('/orders/admin/user/balance', {
      method: 'POST',
      body: JSON.stringify({ userId, amount })
    })
    setTimeout(() => loadAdminUsers(), 1000)
  }, [request, loadAdminUsers])

  const refreshOrder = useCallback(async (orderId) => {
    await request('/orders/admin/order/refresh', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    })
    setTimeout(() => loadAdminOrders(), 1000)
  }, [request, loadAdminOrders])

  const analyzeLink = useCallback(() => {
    if (!smartLink.trim()) { showModal('error', 'Ошибка', 'Вставьте ссылку'); return }
    const platform = detectPlatform(smartLink)
    if (!platform) { showModal('error', 'Ошибка', 'Не удалось определить платформу'); return }

    const filtered = services
      .filter(s => s.name.toLowerCase().includes(PLATFORMS.find(p => p.id === platform)?.name.toLowerCase()))
      .slice(0, 10)
    const suggestions = filtered.length > 0 ? filtered : [
      { name: '👥 Подписчики', rate: '390.00', service: '118' },
      { name: '👀 Просмотры', rate: '190.00', service: '118' },
      { name: '❤️ Реакции', rate: '150.00', service: '391' },
    ]
    setSmartResults({ platform, suggestions })
    setSmartLink('')
  }, [smartLink, services, showModal])

  const createOrder = useCallback(async () => {
    if (!selectedService || !link || !quantity) { showModal('error', 'Ошибка', 'Заполните все поля'); return }

    const linkCheck = validateServiceLink(link, selectedService.name)
    if (!linkCheck.valid) { showModal('error', '❌ Неверная ссылка', linkCheck.message); return }

    if (selectedPlatform && !validateLink(link, selectedPlatform)) {
      showModal('error', '❌ Неверная ссылка', `Ссылка должна вести на ${PLATFORMS.find(p => p.id === selectedPlatform)?.name}.`)
      return
    }

    try {
      const balanceData = await request(`/orders/user/balance/${USER_ID}`)
      if (balanceData?.balance <= 0) {
        showModal('error', '💰 Недостаточно средств', 'Баланс пуст.', { text: '💳 Пополнить баланс', link: 'https://t.me/boostix_smm_bot' })
        return
      }
    } catch {}

    const data = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({ serviceId: selectedService.service, link, quantity, userId: USER_ID !== 'Гость' ? USER_ID : null })
    })
    if (data) {
      showModal('success', '✅ Заказ создан!', `Номер: #${data.orderId}\nКол-во: ${quantity}`)
      setLink(''); setQuantity(100); setSelectedService(null); setSelectedPlatform(null); setStep('platforms')
    } else {
      showModal('error', '❌ Ошибка', 'Не удалось создать заказ')
    }
  }, [selectedService, link, quantity, selectedPlatform, USER_ID, request, showModal])

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    if (tab === 'ref') loadRefData()
    if (tab === 'profile') loadOrders()
    if (tab === 'admin') loadAdminData()
    if (tab === 'smart') setSmartResults(null)
    if (tab === 'order') { setStep('platforms'); setSelectedPlatform(null); setSelectedService(null) }
  }, [loadRefData, loadOrders, loadAdminData])

  const handlePlatformSelect = useCallback((id) => { setSelectedPlatform(id); setSelectedService(null); setStep('services') }, [])
  const handleServiceSelect = useCallback((s) => { setSelectedService(s); setStep('order') }, [])
  const handleBack = useCallback(() => {
    if (step === 'order') setStep('services')
    else if (step === 'services') { setStep('platforms'); setSelectedPlatform(null) }
  }, [step])

  const filteredServices = useMemo(() => {
    if (!selectedPlatform) return []
    return services.filter(s => s.name.toLowerCase().includes(PLATFORMS.find(p => p.id === selectedPlatform)?.name.toLowerCase()))
  }, [selectedPlatform, services])

  return (
    <div className="app">
      <AppHeader />
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} isAdmin={isAdmin} />
      <div className="tab-content">
        {activeTab === 'smart' && !smartResults && (
          <SmartTab onAnalyze={analyzeLink} onLinkChange={setSmartLink} linkValue={smartLink} />
        )}
        {smartResults && (
          <ServicesList services={smartResults.suggestions} platform={smartResults.platform} onBack={() => setSmartResults(null)} onSelect={handleServiceSelect} />
        )}
        {activeTab === 'order' && (
          <div className="order-form">
            {step === 'platforms' && <PlatformsGrid platforms={PLATFORMS} onSelect={handlePlatformSelect} />}
            {step === 'services' && selectedPlatform && (
              <ServicesList services={filteredServices} platform={selectedPlatform} onBack={handleBack} onSelect={handleServiceSelect} />
            )}
            {step === 'order' && selectedService && (
              <OrderForm service={selectedService} onBack={handleBack} onOrder={createOrder} link={link} onLinkChange={setLink} quantity={quantity} onQuantityChange={setQuantity} />
            )}
          </div>
        )}
        {activeTab === 'ref' && <ReferralTab stats={refStats} link={refLink} history={refHistory} onCopy={copyRefLink} />}
        {activeTab === 'profile' && (
          <ProfileTab userId={USER_ID} userName={USER_NAME} orders={orders} onRefresh={loadOrders} onDeposit={() => window.open('https://t.me/boostix_smm_bot', '_blank')} />
        )}
        {activeTab === 'admin' && (
          <AdminTab
            section={adminSection}
            onSectionChange={(s) => {
              setAdminSection(s)
              if (s === 'users') loadAdminUsers()
              if (s === 'orders') loadAdminOrders()
              if (s === 'transactions') loadAdminTransactions()
              if (s === 'settings') loadAdminSettings()
            }}
            dashboard={adminData} users={adminUsers} orders={adminOrders} transactions={adminTransactions} settings={adminSettings}
            userSearch={adminSearch} onUserSearch={(v) => { setAdminSearch(v); setTimeout(loadAdminUsers, 300) }}
            orderStatus={adminOrderStatus} onOrderStatusChange={(v) => { setAdminOrderStatus(v); setTimeout(loadAdminOrders, 0) }}
            transType={adminTransType} onTransTypeChange={(v) => { setAdminTransType(v); setTimeout(loadAdminTransactions, 0) }}
            onToggleBlock={toggleBlockUser} onChangeBalance={changeBalance} onRefreshOrder={refreshOrder}
            onSaveSettings={saveSettings} onSettingsChange={setAdminSettings}
          />
        )}
      </div>
      <Modal modal={modal} onClose={closeModal} />
    </div>
  )
}

export default App