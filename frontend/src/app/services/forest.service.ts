import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";

export interface Forest {
  id: number;
  name: string;
  description?: string;
  total_area?: number;
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
  status: string;
  temperature: number;
  smoke_level: number;
  air_humidity: number;
  soil_moisture: number;
}

export interface StopFireSimulationResult {
  forest_id: number;
  forest_name: string;
  restored_sensors: number;
  status: string;
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
}
