-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    photo_url TEXT,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    role VARCHAR(20) DEFAULT 'user',
    is_blocked BOOLEAN DEFAULT FALSE,
    referred_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица категорий услуг
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    icon VARCHAR(10),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица услуг (синхронизируется с провайдером)
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    provider_id VARCHAR(100) NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(500) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    type VARCHAR(100),
    provider_price DECIMAL(10, 4) NOT NULL,
    our_price DECIMAL(10, 4) NOT NULL,
    markup_percent INT DEFAULT 50,
    min_order INT DEFAULT 10,
    max_order INT DEFAULT 1000000,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    service_id INT REFERENCES services(id) ON DELETE SET NULL,
    provider_order_id VARCHAR(255),
    link TEXT NOT NULL,
    quantity INT NOT NULL,
    amount DECIMAL(10, 2),
    provider_amount DECIMAL(10, 2),
    profit DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    start_count INT,
    current_count INT,
    remains INT,
    provider_response TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Таблица транзакций
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance_before DECIMAL(10, 2),
    balance_after DECIMAL(10, 2),
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица промокодов
CREATE TABLE promocodes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    min_amount DECIMAL(10, 2) DEFAULT 0,
    max_uses INT DEFAULT 0,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица использования промокодов
CREATE TABLE promocode_uses (
    id SERIAL PRIMARY KEY,
    promocode_id INT REFERENCES promocodes(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица логов API провайдера
CREATE TABLE api_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    request_data TEXT,
    response_data TEXT,
    status VARCHAR(20),
    error_message TEXT,
    duration_ms INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица настроек
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица сессий (для статистики)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    action VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица планов автопродвижения
CREATE TABLE auto_plans (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    link TEXT NOT NULL DEFAULT '',
    goal INT NOT NULL,
    daily_budget DECIMAL(10, 2) NOT NULL,
    spent DECIMAL(10, 2) DEFAULT 0,
    completed INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрой работы
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_services_platform ON services(platform);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_api_logs_action ON api_logs(action);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_auto_plans_user_id ON auto_plans(user_id);
CREATE INDEX idx_auto_plans_status ON auto_plans(status);
CREATE INDEX idx_users_referred_by ON users(referred_by);

-- Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_services_timestamp BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_auto_plans_timestamp BEFORE UPDATE ON auto_plans
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Начальные данные
INSERT INTO categories (name, platform, icon, sort_order) VALUES
    ('Telegram', 'telegram', '✈️', 1),
    ('YouTube', 'youtube', '▶️', 2),
    ('Instagram', 'instagram', '📷', 3),
    ('TikTok', 'tiktok', '🎵', 4),
    ('ВКонтакте', 'vkontakte', '📱', 5);

INSERT INTO settings (key, value, description) VALUES
    ('site_name', 'Boostix', 'Название сайта'),
    ('default_markup', '50', 'Стандартная наценка в %'),
    ('min_deposit', '10', 'Минимальный депозит'),
    ('max_deposit', '50000', 'Максимальный депозит'),
    ('telegram_channel', '', 'Канал для уведомлений'),
    ('support_link', '', 'Ссылка на поддержку');