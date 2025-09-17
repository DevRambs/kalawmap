import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth, firebaseService } from './firebase';
import FloodEventFormModal from './components/FloodEventFormModal';
import { WeatherData, ForecastDay, MonitoredArea } from './types';

// Weather API configuration
const WEATHER_API_KEY = '8f1b8b5c8e8f4a5b9c2d3e4f5a6b7c8d';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

const App: React.FC = () => {
  // State management
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [monitoredAreas, setMonitoredAreas] = useState<MonitoredArea[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedArea, setSelectedArea] = useState<MonitoredArea | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [floodRecords, setFloodRecords] = useState<any[]>([]);
  const [disregardRecords, setDisregardRecords] = useState<any[]>([]);

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);

  // Initialize map and load data
  useEffect(() => {
    initializeMap();
    loadInitialData();
    
    // Set up real-time listeners
    const unsubscribeAreas = firebaseService.onMonitoredAreasChange(setMonitoredAreas);
    const unsubscribeRecords = firebaseService.onFloodRecordsChange(setFloodRecords);
    
    return () => {
      unsubscribeAreas();
      unsubscribeRecords();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [areas, records, disregards, notifications, theme] = await Promise.all([
        firebaseService.loadMonitoredAreas(),
        firebaseService.loadFloodRecords(),
        firebaseService.loadDisregardRecords(),
        firebaseService.loadNotifications(),
        firebaseService.loadThemePreference()
      ]);

      setMonitoredAreas(areas);
      setFloodRecords(records);
      setDisregardRecords(disregards);
      setNotifications(notifications);
      
      if (theme) {
        setIsDarkMode(theme === 'dark');
      }

      // Load weather for default location (Oras, Eastern Samar)
      await fetchWeatherData(11.6031, 125.4461);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const initializeMap = async () => {
    try {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      await import("leaflet-draw");
      await import("leaflet-draw/dist/leaflet.draw.css");

      if (!mapRef.current || mapInstanceRef.current) return;

      // Initialize map
      const map = L.map(mapRef.current).setView([11.6031, 125.4461], 13);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Initialize drawing controls
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      const drawControl = new (L as any).Control.Draw({
        position: 'topright',
        draw: {
          polygon: true,
          marker: true,
          circle: false,
          rectangle: true,
          polyline: false,
          circlemarker: false
        },
        edit: {
          featureGroup: drawnItems,
          remove: true
        }
      });

      map.addControl(drawControl);
      mapInstanceRef.current = map;

      // Handle drawing events
      map.on((L as any).Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        drawnItems.addLayer(layer);
        
        if (event.layerType === 'marker') {
          handleMarkerCreated(layer);
        } else if (event.layerType === 'polygon' || event.layerType === 'rectangle') {
          handlePolygonCreated(layer);
        }
      });

      // Load existing areas on map
      loadAreasOnMap();

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const handleMarkerCreated = (layer: any) => {
    const latlng = layer.getLatLng();
    const areaName = prompt('Enter area name:');
    
    if (areaName) {
      const newArea: MonitoredArea = {
        id: Date.now().toString(),
        name: areaName,
        type: 'point',
        coordinates: [latlng.lat, latlng.lng],
        riskLevel: 'low'
      };
      
      const updatedAreas = [...monitoredAreas, newArea];
      setMonitoredAreas(updatedAreas);
      firebaseService.saveMonitoredAreas(updatedAreas);
    }
  };

  const handlePolygonCreated = (layer: any) => {
    const bounds = layer.getBounds();
    const areaName = prompt('Enter area name:');
    
    if (areaName) {
      const newArea: MonitoredArea = {
        id: Date.now().toString(),
        name: areaName,
        type: 'polygon',
        coordinates: [bounds.getCenter().lat, bounds.getCenter().lng],
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        },
        riskLevel: 'low'
      };
      
      const updatedAreas = [...monitoredAreas, newArea];
      setMonitoredAreas(updatedAreas);
      firebaseService.saveMonitoredAreas(updatedAreas);
    }
  };

  const loadAreasOnMap = async () => {
    if (!mapInstanceRef.current) return;
    
    const L = (await import("leaflet")).default;
    
    monitoredAreas.forEach(area => {
      if (area.type === 'point') {
        const marker = L.marker(area.coordinates).addTo(mapInstanceRef.current);
        marker.bindPopup(`<b>${area.name}</b><br>Risk: ${area.riskLevel}`);
      } else if (area.type === 'polygon' && area.bounds) {
        const bounds = L.latLngBounds(
          [area.bounds.south, area.bounds.west],
          [area.bounds.north, area.bounds.east]
        );
        const rectangle = L.rectangle(bounds, {
          color: area.riskLevel === 'high' ? '#dc2626' : 
                 area.riskLevel === 'medium' ? '#f59e0b' : '#10b981'
        }).addTo(mapInstanceRef.current);
        rectangle.bindPopup(`<b>${area.name}</b><br>Risk: ${area.riskLevel}`);
      }
    });
  };

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(`${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`),
        fetch(`${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`)
      ]);

      if (currentResponse.ok && forecastResponse.ok) {
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        setCurrentWeather({
          temperature: Math.round(currentData.main.temp),
          humidity: currentData.main.humidity,
          windSpeed: currentData.wind.speed,
          windDirection: getWindDirection(currentData.wind.deg),
          precipitation: currentData.rain?.['1h'] || 0,
          pressure: currentData.main.pressure,
          visibility: currentData.visibility / 1000,
          cloudiness: currentData.clouds.all,
          feelsLike: Math.round(currentData.main.feels_like),
          description: currentData.weather[0].description,
          icon: currentData.weather[0].icon
        });

        const processedForecast = processForecastData(forecastData.list);
        setForecast(processedForecast);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const processForecastData = (forecastList: any[]): ForecastDay[] => {
    const dailyData: { [key: string]: any[] } = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(item);
    });

    return Object.keys(dailyData).slice(0, 5).map(date => {
      const dayData = dailyData[date];
      const temps = dayData.map(d => d.main.temp);
      const precipitation = dayData.reduce((sum, d) => sum + (d.rain?.['3h'] || 0), 0);
      
      return {
        dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        temperature: {
          max: Math.round(Math.max(...temps)),
          min: Math.round(Math.min(...temps))
        },
        humidity: Math.round(dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length),
        windSpeed: Math.round(dayData.reduce((sum, d) => sum + d.wind.speed, 0) / dayData.length),
        windDirection: getWindDirection(dayData[0].wind.deg),
        precipitation: Math.round(precipitation),
        pressure: Math.round(dayData.reduce((sum, d) => sum + d.main.pressure, 0) / dayData.length),
        description: dayData[0].weather[0].description,
        icon: dayData[0].weather[0].icon,
        riskLevel: calculateRiskLevel(precipitation, Math.max(...temps), dayData.reduce((sum, d) => sum + d.wind.speed, 0) / dayData.length)
      };
    });
  };

  const calculateRiskLevel = (precipitation: number, temperature: number, windSpeed: number): 'low' | 'medium' | 'high' => {
    if (precipitation > 50 || windSpeed > 15) return 'high';
    if (precipitation > 20 || windSpeed > 10) return 'medium';
    return 'low';
  };

  const handleAreaClick = (area: MonitoredArea) => {
    setSelectedArea(area);
    setIsFormModalOpen(true);
  };

  const handleDeleteArea = async (areaId: string) => {
    const updatedAreas = monitoredAreas.filter(area => area.id !== areaId);
    setMonitoredAreas(updatedAreas);
    await firebaseService.saveMonitoredAreas(updatedAreas);
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await firebaseService.saveThemePreference(newTheme ? 'dark' : 'light');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    await firebaseService.clearNotifications();
  };

  return (
    <div className={`main-app-container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">🌊</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Flood Monitoring System</h1>
              <p className="text-blue-200 text-sm">Oras, Eastern Samar</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors relative"
              >
                <span className="text-xl">🔔</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-gray-500 text-center">No notifications</p>
                    ) : (
                      notifications.map(notification => (
                        <div key={notification.id} className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                          <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold">👤</span>
                </div>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 text-white p-4 overflow-y-auto">
          {/* Weather Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">🌤️</span>
              Current Weather
            </h2>
            {currentWeather ? (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{currentWeather.temperature}°C</span>
                  <span className="text-sm capitalize">{currentWeather.description}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Humidity: {currentWeather.humidity}%</div>
                  <div>Wind: {currentWeather.windSpeed} m/s</div>
                  <div>Pressure: {currentWeather.pressure} hPa</div>
                  <div>Visibility: {currentWeather.visibility} km</div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                Loading weather data...
              </div>
            )}
          </div>

          {/* Forecast Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">📅</span>
              5-Day Forecast
            </h2>
            <div className="space-y-2">
              {forecast.map((day, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{day.dayName}</div>
                      <div className="text-sm text-gray-400">{day.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{day.temperature.max}°/{day.temperature.min}°</div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        day.riskLevel === 'high' ? 'bg-red-600' :
                        day.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                      }`}>
                        {day.riskLevel} risk
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monitored Areas */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
              <span className="mr-2">📍</span>
              Monitored Areas ({monitoredAreas.length})
            </h2>
            <div className="space-y-2">
              {monitoredAreas.map(area => (
                <div key={area.id} className="area-item">
                  <div className="area-header">
                    <div 
                      className="area-title"
                      onClick={() => handleAreaClick(area)}
                    >
                      <span className="area-icon">📍</span>
                      {area.name}
                    </div>
                    <button
                      onClick={() => handleDeleteArea(area.id)}
                      className="delete-area-btn"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="area-details">
                    <div className="risk-row">
                      Risk Level: 
                      <span className={`risk-badge risk-${area.riskLevel}`}>
                        {area.riskLevel}
                      </span>
                    </div>
                    {area.population && (
                      <div className="text-xs text-gray-400 mt-1">
                        Population: {area.population.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {monitoredAreas.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  <p>No monitored areas yet</p>
                  <p className="text-sm">Use the map to add areas</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <button
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`w-full p-3 rounded-lg font-medium transition-colors ${
                isDrawingMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isDrawingMode ? '🎯 Drawing Mode ON' : '📍 Enable Drawing'}
            </button>
            
            <button
              onClick={() => setIsSimulationMode(!isSimulationMode)}
              className={`w-full p-3 rounded-lg font-medium transition-colors ${
                isSimulationMode 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isSimulationMode ? '⚡ Simulation ON' : '🔬 Start Simulation'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
          <div ref={mapRef} id="map" className="w-full h-full"></div>
        </div>
      </div>

      {/* Flood Event Form Modal */}
      <FloodEventFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        area={selectedArea}
        firebaseService={firebaseService}
      />
    </div>
  );
};

export default App;