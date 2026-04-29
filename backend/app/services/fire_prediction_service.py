from __future__ import annotations

from dataclasses import dataclass


def _normalize_degrees(value: float) -> float:
    return value % 360


def _direction_label(degrees: float) -> str:
    sectors = [
        (22.5, "N"),
        (67.5, "NE"),
        (112.5, "E"),
        (157.5, "SE"),
        (202.5, "S"),
        (247.5, "SO"),
        (292.5, "O"),
        (337.5, "NO"),
    ]
    for boundary, label in sectors:
        if degrees < boundary:
            return label
    return "N"


def _weather_factor(weather: str) -> float:
    normalized = weather.strip().lower()
    factors = {
        "clear": 1.05,
        "sunny": 1.05,
        "dry": 1.18,
        "windy": 1.15,
        "cloudy": 0.92,
        "overcast": 0.88,
        "rain": 0.58,
        "rainy": 0.58,
        "storm": 0.72,
        "humid": 0.82,
        "fog": 0.78,
    }
    return factors.get(normalized, 1.0)


def _temperature_factor(temperature_c: float | None) -> float:
    if temperature_c is None:
        return 1.0
    if temperature_c >= 38:
        return 1.16
    if temperature_c >= 30:
        return 1.1
    if temperature_c >= 22:
        return 1.03
    if temperature_c >= 10:
        return 0.98
    return 0.92


def _forest_factor(forest_type: str | None) -> float:
    if not forest_type:
        return 1.0

    normalized = forest_type.strip().lower()
    factors = {
        "coniferes": 1.22,
        "pin": 1.18,
        "sapin": 1.18,
        "feuillus": 0.96,
        "mixte": 1.04,
        "taiga": 1.16,
        "temperee": 0.97,
        "mediterraneenne": 1.12,
        "tropicale": 1.05,
        "landes": 1.08,
    }
    return factors.get(normalized, 1.0)


@dataclass(frozen=True)
class FirePredictionInput:
    forest_type: str | None
    wind_speed_kmh: float
    wind_direction_deg: float
    weather: str
    temperature_c: float | None
    forest_humidity_pct: float
    origin_zone: str
    time_horizon_minutes: int
    fuel_moisture_pct: float | None = None


class FirePredictionService:
    @staticmethod
    def predict(payload: FirePredictionInput) -> dict:
        humidity_pressure = max(0.2, (100.0 - payload.forest_humidity_pct) / 100.0)
        fuel_pressure = 1.0
        if payload.fuel_moisture_pct is not None:
            fuel_pressure = max(0.15, (100.0 - payload.fuel_moisture_pct) / 100.0)

        wind_pressure = min(0.25, payload.wind_speed_kmh / 180.0)
        spread_speed = 1.25 + wind_pressure + (humidity_pressure * 0.12) + (fuel_pressure * 0.08)
        spread_speed *= _weather_factor(payload.weather)
        spread_speed *= _temperature_factor(payload.temperature_c)
        spread_speed *= _forest_factor(payload.forest_type)
        spread_speed = round(max(1.0, min(1.8, spread_speed)), 1)

        spread_direction = _normalize_degrees(
            payload.wind_direction_deg + (12.0 if humidity_pressure > 0.45 else 5.0)
        )
        spread_direction_label = _direction_label(spread_direction)

        estimated_distance = round(
            spread_speed * (payload.time_horizon_minutes / 60.0),
            1,
        )

        risk_score = (
            (payload.wind_speed_kmh / 40.0)
            + humidity_pressure
            + (0.2 if payload.fuel_moisture_pct is not None else 0.0)
            + (_forest_factor(payload.forest_type) - 0.9)
        ) * _weather_factor(payload.weather)
        if payload.temperature_c is not None and payload.temperature_c >= 30:
            risk_score += 0.15
        if payload.temperature_c is not None and payload.temperature_c <= 10:
            risk_score -= 0.1

        if risk_score >= 2.2:
            risk_level = "critical"
        elif risk_score >= 1.6:
            risk_level = "high"
        elif risk_score >= 1.1:
            risk_level = "moderate"
        else:
            risk_level = "low"

        return {
            "predicted_spread_direction_deg": round(spread_direction, 1),
            "predicted_spread_direction_label": spread_direction_label,
            "predicted_spread_speed_kmh": spread_speed,
            "predicted_spread_speed_m_per_h": round(spread_speed * 1000.0, 1),
            "estimated_distance_m": round(estimated_distance * 1000, 1),
            "predicted_affected_zone": f"Zone sous le vent vers {spread_direction_label}",
            "risk_level": risk_level,
            "explanation": (
                f"La propagation est estimée depuis {payload.origin_zone} vers {spread_direction_label} "
                f"en tenant compte du vent, de l'humidité et du type de forêt."
            ),
        }