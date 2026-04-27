CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('garde_forestier', 'pompier', 'proprietaire')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE forests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    description TEXT,
    total_area FLOAT,
    geom GEOMETRY(MULTIPOLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_forests_geom ON forests USING GIST(geom);

CREATE TABLE forest_zones (
    id SERIAL PRIMARY KEY,
    forest_id INTEGER REFERENCES forests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tree_species VARCHAR(100),
    density VARCHAR(50),
    fire_risk_level VARCHAR(50) DEFAULT 'low',
    area FLOAT,
    geom GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_forest_zones_geom ON forest_zones USING GIST(geom);
CREATE INDEX idx_forest_zones_forest ON forest_zones(forest_id);

CREATE TABLE sensor_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    measures JSONB
);
INSERT INTO sensor_types (name, description, measures) VALUES
('METEO_COMPLETE', 'Station météo complète', '["temperature","air_humidity","soil_moisture","battery_level"]'::jsonb),
('SMOKE_DETECTOR', 'Détecteur de fumée incendie', '["smoke_level","temperature","battery_level"]'::jsonb),
('SOIL_SENSOR', 'Capteur humidité sol', '["soil_moisture","temperature","battery_level"]'::jsonb),
('WEATHER_BASIC', 'Station météo basique', '["temperature","air_humidity","battery_level"]'::jsonb);

CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(100) UNIQUE NOT NULL,
    sensor_type_id INTEGER REFERENCES sensor_types(id),
    zone_id INTEGER REFERENCES forest_zones(id) ON DELETE SET NULL,
    forest_id INTEGER REFERENCES forests(id) ON DELETE CASCADE,
    installation_date DATE,
    location GEOMETRY(POINT, 4326),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active','maintenance','alert','offline','stolen')),
    last_seen TIMESTAMPTZ,
    battery_alert_threshold FLOAT DEFAULT 20.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sensors_location ON sensors USING GIST(location);
CREATE INDEX idx_sensors_zone ON sensors(zone_id);
CREATE INDEX idx_sensors_status ON sensors(status);
CREATE INDEX idx_sensors_uid ON sensors(uid);

CREATE TABLE sensor_data (
    time TIMESTAMPTZ NOT NULL,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    temperature FLOAT,
    air_humidity FLOAT,
    soil_moisture FLOAT,
    smoke_level FLOAT,
    battery_level FLOAT,
    signal_strength INTEGER,
    data_quality FLOAT DEFAULT 100.0,
    raw_data JSONB
);
SELECT create_hypertable('sensor_data', 'time');
CREATE INDEX idx_sensor_data_sensor_time ON sensor_data(sensor_id, time DESC);
CREATE INDEX idx_sensor_data_time ON sensor_data(time DESC);
SELECT add_retention_policy('sensor_data', INTERVAL '365 days');

CREATE MATERIALIZED VIEW sensor_data_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS hour,
    sensor_id,
    AVG(temperature) as avg_temperature,
    AVG(air_humidity) as avg_air_humidity,
    AVG(soil_moisture) as avg_soil_moisture,
    AVG(smoke_level) as avg_smoke_level,
    MIN(battery_level) as min_battery_level,
    COUNT(*) as num_readings
FROM sensor_data
GROUP BY hour, sensor_id;

SELECT add_continuous_aggregate_policy('sensor_data_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

CREATE MATERIALIZED VIEW zone_data_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', sd.time) AS day,
    s.zone_id,
    AVG(sd.temperature) as avg_temperature,
    AVG(sd.air_humidity) as avg_air_humidity,
    AVG(sd.soil_moisture) as avg_soil_moisture,
    MAX(sd.smoke_level) as max_smoke_level,
    MIN(sd.battery_level) as min_battery_level,
    COUNT(*) as num_readings
FROM sensor_data sd
JOIN sensors s ON sd.sensor_id = s.id
WHERE s.zone_id IS NOT NULL
GROUP BY day, s.zone_id;

CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metric VARCHAR(100),
    condition VARCHAR(50),
    threshold FLOAT,
    severity VARCHAR(50) CHECK (severity IN ('info','warning','critical')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO alert_rules (name, description, metric, condition, threshold, severity) VALUES
('Température critique', 'Détection de chaleur excessive', 'temperature', '>', 35.0, 'critical'),
('Batterie faible', 'Niveau de batterie critique', 'battery_level', '<', 20.0, 'warning'),
('Fumée détectée', 'Détection de fumée possible incendie', 'smoke_level', '>', 50.0, 'critical'),
('Sécheresse sol', 'Humidité du sol très basse', 'soil_moisture', '<', 15.0, 'warning');

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id) ON DELETE CASCADE,
    zone_id INTEGER REFERENCES forest_zones(id),
    alert_rule_id INTEGER REFERENCES alert_rules(id),
    severity VARCHAR(50),
    message TEXT,
    metric_value FLOAT,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active','acknowledged','resolved'))
);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_triggered ON alerts(triggered_at DESC);
CREATE INDEX idx_alerts_sensor ON alerts(sensor_id);

CREATE TABLE network_gateways (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    forest_id INTEGER REFERENCES forests(id),
    location GEOMETRY(POINT, 4326),
    status VARCHAR(50) DEFAULT 'online',
    last_seen TIMESTAMPTZ,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE network_metrics (
    time TIMESTAMPTZ NOT NULL,
    gateway_id INTEGER NOT NULL REFERENCES network_gateways(id),
    latency_ms INTEGER,
    packet_loss FLOAT,
    data_transferred_mb FLOAT,
    connected_sensors INTEGER,
    cost_estimate FLOAT
);
SELECT create_hypertable('network_metrics', 'time');

CREATE TABLE weather_forecasts (
    id SERIAL PRIMARY KEY,
    forest_id INTEGER REFERENCES forests(id),
    forecast_time TIMESTAMPTZ NOT NULL,
    temperature FLOAT,
    humidity FLOAT,
    precipitation_prob FLOAT,
    wind_speed FLOAT,
    fire_risk_index FLOAT,
    retrieved_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_weather_forest_time ON weather_forecasts(forest_id, forecast_time);

CREATE TABLE user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    forest_id INTEGER REFERENCES forests(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, forest_id)
);

CREATE TABLE user_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    forest_id INTEGER REFERENCES forests(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_history_user_time ON user_history(user_id, visited_at DESC);

CREATE TABLE risk_predictions (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER REFERENCES forest_zones(id),
    prediction_date DATE,
    fire_risk_score FLOAT,
    drought_risk_score FLOAT,
    factors JSONB,
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_predictions_zone_date ON risk_predictions(zone_id, prediction_date);
