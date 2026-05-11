import './index.css'

function App() {
  return (
    <div className="landing">
      {/* Главный экран */}
      <section className="hero">
        <div className="container">
          <span className="badge">🤖 Умное SMM-продвижение</span>
          <h1>Расти в соцсетях<br/>на <span className="highlight">автопилоте</span></h1>
          <p className="subtitle">
            Boostix сам подбирает стратегию, распределяет бюджет и защищает аккаунт.<br/>
            Вы просто указываете цель — мы делаем остальное.
          </p>
          <a href="#" className="btn-hero">🚀 Запустить рост</a>
          <div className="hero-tags">
            <span>🎯 Умный подбор</span>
            <span>·</span>
            <span>🛡 Гарантия от банов</span>
            <span>·</span>
            <span>📊 Аналитика 24/7</span>
          </div>
        </div>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">15K+</span>
            <span className="stat-label">Активных клиентов</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">6</span>
            <span className="stat-label">Платформ</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">₽0</span>
            <span className="stat-label">Комиссий за пополнение</span>
          </div>
        </div>
      </section>

      {/* Умный подбор */}
      <section className="smart-feature">
        <div className="container">
          <div className="smart-feature-content">
            <div className="smart-feature-text">
              <span className="feature-badge">🎯 Умный подбор</span>
              <h2>Кидаете ссылку —<br/><span className="highlight">Boostix делает всё сам</span></h2>
              <p>Вставьте ссылку на профиль или пост. Наш ИИ определит платформу, проанализирует аккаунт и предложит лучшие услуги для максимального роста. Больше не нужно гадать, что выбрать.</p>
              <ul className="feature-list">
                <li>✅ Автоопределение платформы</li>
                <li>✅ Анализ текущих метрик</li>
                <li>✅ Подбор оптимального пакета</li>
              </ul>
            </div>
            <div className="smart-feature-demo">
              <div className="demo-window">
                <div className="demo-input">🔗 Вставьте ссылку...</div>
                <div className="demo-result">
                  <div className="demo-platform">📱 Определён: Telegram</div>
                  <div className="demo-suggestions">
                    <div className="demo-suggestion">👥 Подписчики — от 390 ₽</div>
                    <div className="demo-suggestion active">👀 Просмотры — от 190 ₽</div>
                    <div className="demo-suggestion">❤️ Реакции — от 150 ₽</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Автопродвижение */}
      <section className="auto-boost">
        <div className="container">
          <div className="auto-boost-content">
            <div className="auto-boost-text">
              <span className="feature-badge">🤖 Автопродвижение</span>
              <h2>Выставил бюджет —<br/><span className="highlight">система работает сама</span></h2>
              <p>Укажите желаемые метрики и дневной бюджет. Boostix автоматически распределит средства между разными услугами, чтобы достичь цели максимально эффективно. Вам остаётся только следить за аналитикой.</p>
              <div className="auto-steps">
                <div className="auto-step">
                  <div className="step-icon">1</div>
                  <div>
                    <strong>Ставите цель</strong>
                    <p>Например: +5000 подписчиков за месяц</p>
                  </div>
                </div>
                <div className="auto-step">
                  <div className="step-icon">2</div>
                  <div>
                    <strong>Указываете бюджет</strong>
                    <p>Дневной лимит, который нельзя превышать</p>
                  </div>
                </div>
                <div className="auto-step">
                  <div className="step-icon">3</div>
                  <div>
                    <strong>Наблюдаете за ростом</strong>
                    <p>Система сама закупает нужные услуги</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="auto-boost-visual">
              <div className="budget-panel">
                <div className="budget-header">⚙️ План автопродвижения</div>
                <div className="budget-row">
                  <span>Цель</span>
                  <span>+5000 подписчиков</span>
                </div>
                <div className="budget-row">
                  <span>Бюджет/день</span>
                  <span>до 2 500 ₽</span>
                </div>
                <div className="budget-row">
                  <span>Прогноз</span>
                  <span className="highlight">22 дня</span>
                </div>
                <div className="budget-bar">
                  <div className="budget-fill"></div>
                </div>
                <div className="budget-status">🟢 Активно · Выполнено 34%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Платформы */}
      <section className="platforms">
        <div className="container">
          <h2>Работаем на <span className="highlight">всех</span> площадках</h2>
          <div className="platforms-grid">
            <div className="platform-card">
              <span className="platform-icon">✈️</span>
              <span className="platform-name">Telegram</span>
              <span className="platform-services">Подписчики · Просмотры · Реакции</span>
            </div>
            <div className="platform-card">
              <span className="platform-icon">▶️</span>
              <span className="platform-name">YouTube</span>
              <span className="platform-services">Просмотры · Лайки · Подписчики</span>
            </div>
            <div className="platform-card">
              <span className="platform-icon">📷</span>
              <span className="platform-name">Instagram*</span>
              <span className="platform-services">Подписчики · Лайки · Охваты</span>
            </div>
            <div className="platform-card">
              <span className="platform-icon">🎵</span>
              <span className="platform-name">TikTok</span>
              <span className="platform-services">Просмотры · Лайки · Подписчики</span>
            </div>
            <div className="platform-card">
              <span className="platform-icon">📱</span>
              <span className="platform-name">ВКонтакте</span>
              <span className="platform-services">Подписчики · Лайки · Репосты</span>
            </div>
            <div className="platform-card">
              <span className="platform-icon">🔔</span>
              <span className="platform-name">Likee</span>
              <span className="platform-services">Просмотры · Лайки · Подписчики</span>
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="features-section">
        <div className="container">
          <h2>Почему <span className="highlight">Boostix</span></h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🛡️</span>
              <h3>Гарантия от банов</h3>
              <p>Используем только безопасные методы продвижения. Если аккаунт пострадает — вернём деньги и восстановим показатели.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <h3>Живая аналитика</h3>
              <p>Графики роста, прогнозы выполнения и отчёты в реальном времени. Вы всегда знаете, что происходит с вашим заказом.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">👥</span>
              <h3>Реферальная система</h3>
              <p>Приглашайте друзей и получайте до 15% от их пополнений. Три уровня — заработок на всей цепочке приглашённых.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3>Мгновенный запуск</h3>
              <p>Заказы стартуют сразу после оплаты. Без задержек, без ручной обработки — автоматика 24/7.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💎</span>
              <h3>Кэшбэк с заказов</h3>
              <p>Возвращаем до 5% на баланс с каждого заказа. Чем больше заказываете — тем выгоднее.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <h3>Без паролей</h3>
              <p>Авторизация через Telegram. Ваши данные в безопасности — никакие пароли не передаются.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Реферальная система */}
<section className="referral-section">
  <div className="container">
    <span className="feature-badge center">👥 Реферальная программа</span>
    <h2>Зарабатывайте на <span className="highlight">приглашениях</span></h2>
    <div className="referral-levels">
      <div className="ref-level">
        <div className="ref-level-num">1 уровень</div>
        <div className="ref-percent">10%</div>
        <p>от пополнений ваших прямых рефералов</p>
      </div>
      <div className="ref-arrow">→</div>
      <div className="ref-level">
        <div className="ref-level-num">2 уровень</div>
        <div className="ref-percent">3%</div>
        <p>от пополнений рефералов ваших рефералов</p>
      </div>
      <div className="ref-arrow">→</div>
      <div className="ref-level">
        <div className="ref-level-num">3 уровень</div>
        <div className="ref-percent">2%</div>
        <p>от пополнений на третьей линии</p>
      </div>
    </div>
    <p className="referral-note">💰 Доход начисляется на баланс автоматически. Выводите или тратьте на продвижение.</p>
  </div>
</section>

      {/* Отзывы */}
      <section className="reviews">
        <div className="container">
          <h2>Что говорят <span className="highlight">клиенты</span></h2>
          <div className="reviews-grid">
            <div className="review-card">
              <div className="stars">★★★★★</div>
              <p>Boostix реально шарит. Кинул ссылку, он сам всё подобрал. За неделю канал с 200 до 3500 подписчиков. Автопродвижение — пушка!</p>
              <span className="author">@digital_misha</span>
            </div>
            <div className="review-card">
              <div className="stars">★★★★★</div>
              <p>Реферальная система — огонь. Пригласил троих друзей, теперь каждый месяц капает пассивно по 2-3 тысячи на баланс.</p>
              <span className="author">Анна, SMM-менеджер</span>
            </div>
            <div className="review-card">
              <div className="stars">★★★★☆</div>
              <p>Понравилась гарантия от банов. Раньше боялся накручивать, а тут спокойно. Плюс аналитика детальная — видно каждый шаг.</p>
              <span className="author">Олег, блогер</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h2>Готовы к <span className="highlight">умному росту</span>?</h2>
          <p>Присоединяйтесь к 15 000+ SMM-специалистов и блогеров, которые уже растут с Boostix</p>
          <a href="#" className="btn-hero">🤖 Запустить Boostix</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>🤖 Boostix — Умное продвижение в соцсетях</p>
          <p className="footer-small">Автопродвижение · Аналитика · Гарантия от банов · Реферальная система</p>
          <p className="footer-disclaimer">*Meta Platforms Inc. признана экстремистской организацией на территории РФ</p>
        </div>
      </footer>
    </div>
  )
}

export default App