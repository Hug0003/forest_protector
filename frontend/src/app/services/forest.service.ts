import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";

export interface Forest {
  id: number;
  name: string;
  description?: string;
  total_area?: number;
  forest_type?: string;
  geojson?: any;
  sensors?: any[];
}

export interface SensorCreate {
  uid: string;
  sensor_type_id: number;
  forest_id: number;
  lat: number;
  lng: number;
  notes?: string;
}

export interface FireSimulationResult {
  forest_id: number;
  forest_name: string;
  affected_sensors: number;
  affected_sensor_ids: number[];
  status: string;
  temperature: number;
  smoke_level: number;
  air_humidity: number;
  soil_moisture: number;
  radius_m: number;
  fire_point: {
    lat: number;
    lng: number;
  };
}

export interface StopFireSimulationResult {
  forest_id: number;
  forest_name: string;
  restored_sensors: number;
  status: string;
}

export interface FireSpreadPredictionRequest {
  forest_type?: string;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  weather: string;
  temperature_c?: number;
  forest_humidity_pct: number;
  origin_zone: string;
  time_horizon_minutes?: number;
  fuel_moisture_pct?: number;
}

export interface FireSpreadPredictionResult {
  forest_id: number;
  forest_name: string;
  forest_type?: string;
  origin_zone: string;
  weather: string;
  temperature_c?: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  forest_humidity_pct: number;
  predicted_spread_direction_deg: number;
  predicted_spread_direction_label: string;
  predicted_spread_speed_kmh: number;
  predicted_spread_speed_m_per_h: number;
  estimated_distance_m: number;
  predicted_affected_zone: string;
  confidence: number;
  risk_level: string;
  time_horizon_minutes: number;
  explanation: string;
}

@Injectable({ providedIn: "root" })
export class ForestService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async getForests(): Promise<Forest[]> {
    return firstValueFrom(this.http.get<Forest[]>(`${this.api}/api/v1/forests`));
  }

  async getForest(id: number): Promise<Forest> {
    return firstValueFrom(this.http.get<Forest>(`${this.api}/api/v1/forests/${id}`));
  }

  async createForest(data: {
    name: string;
    description?: string;
    total_area?: number;
    forest_type?: string;
    coordinates: number[][][];
  }): Promise<Forest> {
    return firstValueFrom(this.http.post<Forest>(`${this.api}/api/v1/forests`, data));
  }

  async deleteForest(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/api/v1/forests/${id}`));
  }

  async createSensor(data: SensorCreate): Promise<any> {
    return firstValueFrom(this.http.post(`${this.api}/api/v1/sensors`, data));
  }

  async deleteSensor(id: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.api}/api/v1/sensors/${id}`));
  }

  async simulateFire(forestId: number): Promise<FireSimulationResult> {
    return firstValueFrom(
      this.http.post<FireSimulationResult>(`${this.api}/api/v1/forests/${forestId}/simulate-fire`, {})
    );
  }

  async stopFireSimulation(forestId: number): Promise<StopFireSimulationResult> {
    return firstValueFrom(
      this.http.post<StopFireSimulationResult>(`${this.api}/api/v1/forests/${forestId}/stop-fire-simulation`, {})
    );
  }

  async predictFireSpread(
    forestId: number,
    data: FireSpreadPredictionRequest
  ): Promise<FireSpreadPredictionResult> {
    return firstValueFrom(
      this.http.post<FireSpreadPredictionResult>(
        `${this.api}/api/v1/forests/${forestId}/predict-fire-spread`,
        {
          ...data,
          time_horizon_minutes: data.time_horizon_minutes ?? 60,
        }
      )
    );
  }
}
