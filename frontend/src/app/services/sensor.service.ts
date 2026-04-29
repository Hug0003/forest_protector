import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";

export interface Sensor {
  id: number;
  uid: string;
  status: string;
  last_seen: string;
  lat: number;
  lng: number;
  zone_id: number;
  forest_id: number;
  sensor_type_id: number;
  battery_level?: number;
}

export interface SensorData {
  time: string;
  avg_temperature: number;
  avg_air_humidity: number;
  avg_soil_moisture: number;
  avg_smoke_level: number;
  min_battery_level: number;
  num_readings: number;
}

@Injectable({ providedIn: "root" })
export class SensorService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async getSensors(filters?: any): Promise<Sensor[]> {
    const params: any = {};
    if (filters?.sensorType && filters.sensorType !== "all") {
      params.sensor_type = filters.sensorType;
    }
    if (filters?.showAlerts) {
      params.status = "alert";
    }
    return firstValueFrom(
      this.http.get<Sensor[]>(`${this.api}/api/v1/sensors`, { params })
    );
  }

  async getSensorData(sensorId: number, interval = "1h"): Promise<SensorData[]> {
    return firstValueFrom(
      this.http.get<SensorData[]>(
        `${this.api}/api/v1/sensors/${sensorId}/data?interval=${interval}`
      )
    );
  }

  async getTechnicalDashboard(): Promise<any> {
    return firstValueFrom(
      this.http.get(`${this.api}/api/v1/sensors/status/technical`)
    );
  }

  async getZoneAverage(zoneId: number, metric: string): Promise<any> {
    return firstValueFrom(
      this.http.get(`${this.api}/api/v1/zones/${zoneId}/average?metric=${metric}`)
    );
  }
}
