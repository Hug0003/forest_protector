INSERT INTO sensors (uid, sensor_type_id, zone_id, forest_id, status, last_seen) VALUES
('SENSOR-001', 1, 1, 1, 'active', NOW()),
('SENSOR-002', 2, 1, 1, 'active', NOW() - INTERVAL '1 hour'),
('SENSOR-003', 1, 1, 1, 'offline', NOW() - INTERVAL '5 hours');

INSERT INTO sensor_data (time, sensor_id, temperature, air_humidity, soil_moisture, smoke_level, battery_level)
SELECT
    NOW() - (random() * INTERVAL '7 days'),
    (ARRAY[1,2])[floor(random()*2+1)::int],
    15 + random() * 25,
    30 + random() * 50,
    10 + random() * 40,
    random() * 20,
    10 + random() * 90
FROM generate_series(1, 100);
