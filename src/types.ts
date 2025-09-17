export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  pressure: number;
  visibility: number;
  cloudiness: number;
  feelsLike: number;
  dewPoint?: number;
  description: string;
  icon: string;
}

export interface ForecastDay {
  dayName: string;
  date: string;
  temperature: {
    max: number;
    min: number;
  };
  humidity: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  pressure: number;
  description: string;
  icon: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MonitoredArea {
  id: string;
  name: string;
  type: string;
  coordinates: [number, number];
  population?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  bounds?: any;
}