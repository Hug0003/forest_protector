from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime

class AggregationService:

    @staticmethod
    async def get_sensor_timeseries(db, sensor_id, start_time, end_time, interval):
        bucket_map = {
            "1m": "1 minute", "5m": "5 minutes", "15m": "15 minutes",
            "1h": "1 hour", "6h": "6 hours", "1d": "1 day"
        }
        bucket = bucket_map.get(interval, "1 hour")
        query = text(f"""
            SELECT
                time_bucket('{bucket}', time) AS bucket,
                AVG(temperature)   AS avg_temperature,
                AVG(air_humidity)  AS avg_air_humidity,
                AVG(soil_moisture) AS avg_soil_moisture,
                AVG(smoke_level)   AS avg_smoke_level,
                MIN(battery_level) AS min_battery_level,
                COUNT(*)           AS num_readings
            FROM sensor_data
            WHERE sensor_id = :sensor_id
              AND time BETWEEN :start_time AND :end_time
            GROUP BY bucket
            ORDER BY bucket DESC
        """)
        result = await db.execute(query, {
            "sensor_id": sensor_id,
            "start_time": start_time,
            "end_time": end_time
        })
        rows = result.fetchall()
        return [
            {
                "time": row.bucket.isoformat(),
                "avg_temperature": row.avg_temperature,
                "avg_air_humidity": row.avg_air_humidity,
                "avg_soil_moisture": row.avg_soil_moisture,
                "avg_smoke_level": row.avg_smoke_level,
                "min_battery_level": row.min_battery_level,
                "num_readings": row.num_readings
            }
            for row in rows
        ]

    @staticmethod
    async def get_zone_average(db, zone_id, metric):
        allowed = ["temperature", "air_humidity", "soil_moisture"]
        if metric not in allowed:
            return {"error": "Metrique invalide"}
        query = text(f"""
            SELECT
                AVG(sd.{metric}) AS average,
                MIN(sd.{metric}) AS minimum,
                MAX(sd.{metric}) AS maximum,
                COUNT(*)         AS num_readings,
                COUNT(DISTINCT sd.sensor_id) AS num_sensors
            FROM sensor_data sd
            JOIN sensors s ON sd.sensor_id = s.id
            WHERE s.zone_id = :zone_id
              AND sd.time > NOW() - INTERVAL '24 hours'
        """)
        result = await db.execute(query, {"zone_id": zone_id})
        row = result.fetchone()
        return {
            "zone_id": zone_id,
            "metric": metric,
            "average": row.average,
            "minimum": row.minimum,
            "maximum": row.maximum,
            "num_readings": row.num_readings,
            "num_sensors": row.num_sensors,
            "period": "24h"
        }

    @staticmethod
    async def get_offline_sensors(db):
        query = text("""
            SELECT
                s.id,
                s.uid,
                s.last_seen,
                s.status,
                EXTRACT(EPOCH FROM (NOW() - s.last_seen))/3600 AS hours_offline
            FROM sensors s
            WHERE s.last_seen < NOW() - INTERVAL '2 hours'
               OR s.last_seen IS NULL
            ORDER BY s.last_seen ASC NULLS FIRST
        """)
        result = await db.execute(query)
        rows = result.fetchall()
        return [
            {
                "id": row.id,
                "uid": row.uid,
                "last_seen": row.last_seen.isoformat() if row.last_seen else None,
                "status": row.status,
                "hours_offline": round(row.hours_offline, 1) if row.hours_offline else None
            }
            for row in rows
        ]

    @staticmethod
    async def get_low_battery_sensors(db):
        query = text("""
            SELECT
                s.id,
                s.uid,
                s.last_seen,
                fz.name AS zone_name,
                MIN(sd.battery_level) AS battery_level
            FROM sensors s
            LEFT JOIN forest_zones fz ON s.zone_id = fz.id
            LEFT JOIN sensor_data sd ON sd.sensor_id = s.id
            WHERE sd.time > NOW() - INTERVAL '24 hours'
            GROUP BY s.id, s.uid, s.last_seen, fz.name
            HAVING MIN(sd.battery_level) < 20
            ORDER BY battery_level ASC
        """)
        result = await db.execute(query)
        rows = result.fetchall()
        return [
            {
                "id": row.id,
                "uid": row.uid,
                "battery_level": row.battery_level,
                "last_seen": row.last_seen.isoformat() if row.last_seen else None,
                "zone_name": row.zone_name
            }
            for row in rows
        ]
