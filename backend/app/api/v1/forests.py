from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

import json

from app.database import get_db
from app.schemas.forest import ForestCreate, SensorCreate

router = APIRouter()


@router.get("/forests")
async def list_forests(db: AsyncSession = Depends(get_db)):
    query = text("""
        SELECT
            id, name, description, total_area,
            ST_AsGeoJSON(geom)::json AS geojson
        FROM forests
        ORDER BY id
    """)
    result = await db.execute(query)
    rows = result.fetchall()
    return [
        {
            "id": row.id,
            "name": row.name,
            "description": row.description,
            "total_area": row.total_area,
            "geojson": row.geojson,
        }
        for row in rows
    ]


@router.get("/forests/{forest_id}")
async def get_forest(forest_id: int, db: AsyncSession = Depends(get_db)):
    forest_query = text("""
        SELECT id, name, description, total_area,
               ST_AsGeoJSON(geom)::json AS geojson
        FROM forests WHERE id = :id
    """)
    result = await db.execute(forest_query, {"id": forest_id})
    forest = result.fetchone()
    if not forest:
        raise HTTPException(status_code=404, detail="Forest not found")

    sensors_query = text("""
        SELECT
            s.id, s.uid, s.status, s.last_seen, s.sensor_type_id,
            ST_Y(s.location::geometry) AS lat,
            ST_X(s.location::geometry) AS lng,
            (
                SELECT sd.battery_level FROM sensor_data sd
                WHERE sd.sensor_id = s.id
                ORDER BY sd.time DESC LIMIT 1
            ) AS battery_level
        FROM sensors s
        WHERE s.forest_id = :forest_id
        ORDER BY s.id
    """)
    sensors_result = await db.execute(sensors_query, {"forest_id": forest_id})
    sensors = sensors_result.fetchall()

    return {
        "id": forest.id,
        "name": forest.name,
        "description": forest.description,
        "total_area": forest.total_area,
        "geojson": forest.geojson,
        "sensors": [
            {
                "id": s.id,
                "uid": s.uid,
                "status": s.status,
                "last_seen": s.last_seen.isoformat() if s.last_seen else None,
                "sensor_type_id": s.sensor_type_id,
                "lat": s.lat,
                "lng": s.lng,
                "battery_level": s.battery_level,
            }
            for s in sensors
        ],
    }


@router.post("/forests")
async def create_forest(payload: ForestCreate, db: AsyncSession = Depends(get_db)):
    geojson = {
        "type": "MultiPolygon",
        "coordinates": [payload.coordinates],
    }
    query = text("""
        INSERT INTO forests (name, description, total_area, geom)
        VALUES (
            :name, :description, :total_area,
            ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326)
        )
        RETURNING id, name, description, total_area,
                  ST_AsGeoJSON(geom)::json AS geojson
    """)
    result = await db.execute(query, {
        "name": payload.name,
        "description": payload.description,
        "total_area": payload.total_area,
        "geom": json.dumps(geojson),
    })
    await db.commit()
    row = result.fetchone()
    return {
        "id": row.id,
        "name": row.name,
        "description": row.description,
        "total_area": row.total_area,
        "geojson": row.geojson,
    }


@router.delete("/forests/{forest_id}")
async def delete_forest(forest_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(text("DELETE FROM forests WHERE id = :id"), {"id": forest_id})
    await db.commit()
    return {"message": "Forest deleted"}


@router.post("/sensors")
async def create_sensor(payload: SensorCreate, db: AsyncSession = Depends(get_db)):
    check = text("""
        SELECT ST_Contains(
            geom,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        ) AS inside
        FROM forests WHERE id = :forest_id
    """)
    result = await db.execute(check, {
        "lat": payload.lat,
        "lng": payload.lng,
        "forest_id": payload.forest_id,
    })
    row = result.fetchone()
    if row and not row.inside:
        raise HTTPException(
            status_code=400,
            detail="The sensor must be placed inside the forest",
        )

    query = text("""
        INSERT INTO sensors
            (uid, sensor_type_id, forest_id, zone_id, location, status, notes)
        VALUES (
            :uid, :sensor_type_id, :forest_id, :zone_id,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
            'active', :notes
        )
        RETURNING id, uid, status,
                  ST_Y(location::geometry) AS lat,
                  ST_X(location::geometry) AS lng
    """)
    result = await db.execute(query, {
        "uid": payload.uid,
        "sensor_type_id": payload.sensor_type_id,
        "forest_id": payload.forest_id,
        "zone_id": payload.zone_id,
        "lat": payload.lat,
        "lng": payload.lng,
        "notes": payload.notes,
    })
    await db.commit()
    row = result.fetchone()
    return {
        "id": row.id,
        "uid": row.uid,
        "status": row.status,
        "lat": row.lat,
        "lng": row.lng,
    }


@router.post("/forests/{forest_id}/simulate-fire")
async def simulate_fire(forest_id: int, db: AsyncSession = Depends(get_db)):
    forest_result = await db.execute(
        text("SELECT id, name FROM forests WHERE id = :id"),
        {"id": forest_id}
    )
    forest = forest_result.fetchone()
    if not forest:
        raise HTTPException(status_code=404, detail="Forest not found")

    sensors_result = await db.execute(
        text("""
            SELECT id, uid, zone_id
            FROM sensors
            WHERE forest_id = :forest_id
            ORDER BY id
        """),
        {"forest_id": forest_id}
    )
    sensors = sensors_result.fetchall()
    if not sensors:
        raise HTTPException(status_code=400, detail="No sensors available in this forest")

    detection_radius_m = 1500.0

    point_result = await db.execute(
        text("""
            SELECT ST_AsGeoJSON(
                ST_SetSRID(
                    COALESCE(
                        ST_GeometryN(ST_GeneratePoints(geom, 1), 1),
                        ST_PointOnSurface(geom)
                    ),
                    4326
                )
            )::json AS fire_point_geojson
            FROM forests
            WHERE id = :forest_id
        """),
        {"forest_id": forest_id}
    )
    point_row = point_result.fetchone()
    if not point_row or not point_row.fire_point_geojson:
        raise HTTPException(status_code=500, detail="Unable to generate fire point")

    fire_point_geojson = point_row.fire_point_geojson
    fire_point_lng, fire_point_lat = fire_point_geojson["coordinates"]
    fire_point_json = json.dumps({"type": "Point", "coordinates": [fire_point_lng, fire_point_lat]})

    affected_sensors_result = await db.execute(
        text("""
            SELECT
                s.id,
                s.uid,
                s.zone_id,
                ST_Distance(
                    s.location::geography,
                    ST_SetSRID(ST_GeomFromGeoJSON(:fire_point_geojson), 4326)::geography
                ) AS distance_m
            FROM sensors s
            WHERE s.forest_id = :forest_id
              AND ST_DWithin(
                  s.location::geography,
                  ST_SetSRID(ST_GeomFromGeoJSON(:fire_point_geojson), 4326)::geography,
                  :radius_m
              )
            ORDER BY distance_m ASC
        """),
        {
            "forest_id": forest_id,
            "fire_point_geojson": fire_point_json,
            "radius_m": detection_radius_m,
        }
    )
    affected_sensors = affected_sensors_result.fetchall()

    rule_result = await db.execute(
        text("""
            SELECT id
            FROM alert_rules
            WHERE metric = 'smoke_level'
              AND severity = 'critical'
              AND is_active = TRUE
            ORDER BY id
            LIMIT 1
        """)
    )
    smoke_rule = rule_result.fetchone()

    for sensor in affected_sensors:
        await db.execute(
            text("""
                INSERT INTO sensor_data (
                    time, sensor_id, temperature, air_humidity,
                    soil_moisture, smoke_level, battery_level,
                    signal_strength, data_quality, raw_data
                ) VALUES (
                    NOW(), :sensor_id, :temperature, :air_humidity,
                    :soil_moisture, :smoke_level, :battery_level,
                    :signal_strength, :data_quality, :raw_data
                )
            """),
            {
                "sensor_id": sensor.id,
                "temperature": 48.0,
                "air_humidity": 18.0,
                "soil_moisture": 8.0,
                "smoke_level": 92.0,
                "battery_level": 84.0,
                "signal_strength": -52,
                "data_quality": 100.0,
                "raw_data": json.dumps({
                    "simulation": "fire",
                    "forest_id": forest_id,
                    "sensor_uid": sensor.uid,
                    "fire_radius_m": detection_radius_m,
                    "distance_m": sensor.distance_m,
                })
            }
        )
        await db.execute(
            text("""
                UPDATE sensors
                SET status = 'alert', last_seen = NOW()
                WHERE id = :sensor_id
            """),
            {"sensor_id": sensor.id}
        )
        await db.execute(
            text("""
                INSERT INTO alerts (
                    sensor_id, zone_id, alert_rule_id, severity,
                    message, metric_value, status
                ) VALUES (
                    :sensor_id, :zone_id, :alert_rule_id, 'critical',
                    :message, :metric_value, 'active'
                )
            """),
            {
                "sensor_id": sensor.id,
                "zone_id": sensor.zone_id,
                "alert_rule_id": smoke_rule.id if smoke_rule else None,
                "message": f"Fire simulation detected on sensor {sensor.uid}",
                "metric_value": 92.0,
            }
        )

    await db.commit()

    return {
        "forest_id": forest.id,
        "forest_name": forest.name,
        "affected_sensors": len(affected_sensors),
        "affected_sensor_ids": [sensor.id for sensor in affected_sensors],
        "status": "simulated_fire_triggered",
        "temperature": 48.0,
        "smoke_level": 92.0,
        "air_humidity": 18.0,
        "soil_moisture": 8.0,
        "radius_m": detection_radius_m,
        "fire_point": {
            "lat": fire_point_lat,
            "lng": fire_point_lng,
        },
    }


@router.post("/forests/{forest_id}/stop-fire-simulation")
async def stop_fire_simulation(forest_id: int, db: AsyncSession = Depends(get_db)):
    forest_result = await db.execute(
        text("SELECT id, name FROM forests WHERE id = :id"),
        {"id": forest_id}
    )
    forest = forest_result.fetchone()
    if not forest:
        raise HTTPException(status_code=404, detail="Forest not found")

    sensors_result = await db.execute(
        text("""
            SELECT DISTINCT s.id, s.uid, s.zone_id
            FROM sensors s
            JOIN alerts a ON a.sensor_id = s.id
            WHERE s.forest_id = :forest_id
              AND a.status = 'active'
              AND a.message LIKE 'Fire simulation detected on sensor %'
            ORDER BY s.id
        """),
        {"forest_id": forest_id}
    )
    sensors = sensors_result.fetchall()

    restored_count = 0
    for sensor in sensors:
        restored_count += 1
        await db.execute(
            text("""
                INSERT INTO sensor_data (
                    time, sensor_id, temperature, air_humidity,
                    soil_moisture, smoke_level, battery_level,
                    signal_strength, data_quality, raw_data
                ) VALUES (
                    NOW(), :sensor_id, :temperature, :air_humidity,
                    :soil_moisture, :smoke_level, :battery_level,
                    :signal_strength, :data_quality, :raw_data
                )
            """),
            {
                "sensor_id": sensor.id,
                "temperature": 24.0,
                "air_humidity": 62.0,
                "soil_moisture": 28.0,
                "smoke_level": 2.0,
                "battery_level": 83.0,
                "signal_strength": -45,
                "data_quality": 100.0,
                "raw_data": json.dumps({
                    "simulation": "fire_stop",
                    "forest_id": forest_id,
                    "sensor_uid": sensor.uid
                })
            }
        )
        await db.execute(
            text("""
                UPDATE sensors
                SET status = 'active', last_seen = NOW()
                WHERE id = :sensor_id
            """),
            {"sensor_id": sensor.id}
        )

    await db.execute(
        text("""
            UPDATE alerts
            SET status = 'resolved', resolved_at = NOW()
            WHERE status = 'active'
              AND sensor_id IN (
                  SELECT id FROM sensors WHERE forest_id = :forest_id
              )
              AND message LIKE 'Fire simulation detected on sensor %'
        """),
        {"forest_id": forest_id}
    )

    await db.commit()

    return {
        "forest_id": forest.id,
        "forest_name": forest.name,
        "restored_sensors": restored_count,
        "status": "simulation_stopped"
    }
