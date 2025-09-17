import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  Settings, 
  Bell, 
  Sun, 
  Moon, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Activity,
  Calendar,
  FileText
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, firebaseService } from './firebase';
import FloodEventFormModal from './components/FloodEventFormModal';

// Types
interface WeatherData {
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

interface ForecastDay {
  dayName: string;
  date: string;
  temperature: { max: number; min: number };
  humidity: number;
  windSpeed: number;
  windDirection: string;
  precipitation: number;
  pressure: number;
  description: string;
  icon: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface MonitoredArea {
  id: string;
  name: string;
  type: string;
  coordinates: [number, number];
  population?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  bounds?: any;
  isSimulated?: boolean;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read?: boolean;
}

// Mock data
const mockWeatherData: WeatherData = {
  temperature: 28,
  humidity: 75,
  windSpeed: 12,
  windDirection: 'NE',
  precipitation: 2.5,
  pressure: 1013,
  visibility: 10,
  cloudiness: 60,
  feelsLike: 32,
  dewPoint: 22,
  description: 'Partly cloudy with light rain',
  icon: '🌦️'
};

const mockForecast: ForecastDay[] = [
  {
    dayName: 'Today',
    date: '2025-01-27',
    temperature: { max: 30, min: 24 },
    humidity: 75,
    windSpeed: 12,
    windDirection: 'NE',
    precipitation: 2.5,
    pressure: 1013,
    description: 'Light rain',
    icon: '🌦️',
    riskLevel: 'medium'
  },
  {
    dayName: 'Tomorrow',
    date: '2025-01-28',
    temperature: { max: 32, min: 26 },
    humidity: 80,
    windSpeed: 15,
    windDirection: 'E',
    precipitation: 5.2,
    pressure: 1010,
    description: 'Heavy rain',
    icon: '🌧️',
    riskLevel: 'high'
  },
  {
    dayName: 'Wednesday',
    date: '2025-01-29',
    temperature: { max: 29, min: 23 },
    humidity: 70,
    windSpeed: 8,
    windDirection: 'SE',
    precipitation: 0.8,
    pressure: 1015,
    description: 'Partly cloudy',
    icon: '⛅',
    riskLevel: 'low'
  }
];

function App() {
  // State management
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [monitoredAreas, setMonitoredAreas] = useState<MonitoredArea[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<MonitoredArea | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
    loadTheme();
  }, []);

  const loadInitialData = async () => {
    try {
      const areas = await firebaseService.loadMonitoredAreas();
      const notifs = await firebaseService.loadNotifications();
      setMonitoredAreas(areas);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadTheme = async () => {
    try {
      const savedTheme = await firebaseService.loadThemePreference();
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await firebaseService.saveThemePreference(newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const clearNotifications = async () => {
    setNotifications([]);
    try {
      await firebaseService.clearNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  // Initialize map
  useEffect(() => {
    if (typeof window !== 'undefined' && !mapLoaded) {
      initializeMap();
    }
  }, [mapLoaded]);

  const initializeMap = async () => {
    try {
      // Dynamically import Leaflet
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      await import('leaflet-draw');
      await import('leaflet-draw/dist/leaflet.draw.css');

      // Fix default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Initialize map
      const map = L.map('map').setView([11.1271, 125.0072], 10);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Initialize draw controls
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      const drawControl = new (L.Control as any).Draw({
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
      setMapLoaded(true);

      // Handle draw events
      map.on((L.Draw as any).Event.CREATED, (event: any) => {
        const layer = event.layer;
        drawnItems.addLayer(layer);
        
        // Create area from drawn shape
        const bounds = layer.getBounds ? layer.getBounds() : null;
        const center = bounds ? bounds.getCenter() : layer.getLatLng();
        
        const newArea: MonitoredArea = {
          id: Date.now().toString(),
          name: `Area ${monitoredAreas.length + 1}`,
          type: event.layerType,
          coordinates: [center.lat, center.lng],
          bounds: bounds,
          riskLevel: 'low'
        };
        
        setMonitoredAreas(prev => [...prev, newArea]);
        addNotification(`New ${event.layerType} area added`, 'success');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const toggleDrawing = () => {
    setDrawingMode(!drawingMode);
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      if (!drawingMode) {
        mapContainer.classList.add('show-draw-controls');
      } else {
        mapContainer.classList.remove('show-draw-controls');
      }
    }
  };

  const deleteArea = async (areaId: string) => {
    setMonitoredAreas(prev => prev.filter(area => area.id !== areaId));
    try {
      const updatedAreas = monitoredAreas.filter(area => area.id !== areaId);
      await firebaseService.saveMonitoredAreas(updatedAreas);
      addNotification('Area deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting area:', error);
      addNotification('Error deleting area', 'error');
    }
  };

  const openFloodEventForm = (area: MonitoredArea) => {
    setSelectedArea(area);
    setIsFormModalOpen(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-white to-slate-100 text-slate-900'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-900/80 border-slate-700/50' 
          : 'bg-white/80 border-slate-200/50'
      }`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors hidden lg:flex ${
                isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors lg:hidden ${
                isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
              }`}>
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Kalaw FloodMap
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Flood Monitoring System
                </p>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg transition-colors relative ${
                  isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                }`}
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border z-50 ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <button
                        onClick={clearNotifications}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div key={notification.id} className={`p-3 border-b border-slate-700/50 ${
                          !notification.read ? 'bg-blue-500/5' : ''
                        }`}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                }`}
              >
                <User className="w-5 h-5" />
              </button>

              {userMenuOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl border z-50 ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="p-2">
                    <button
                      onClick={handleSignOut}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 transition-all duration-300 ${
          sidebarOpen ? 'w-80' : 'w-0 lg:w-16'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className={`h-full overflow-hidden backdrop-blur-xl border-r transition-all duration-300 ${
            isDarkMode 
              ? 'bg-slate-900/50 border-slate-700/50' 
              : 'bg-white/50 border-slate-200/50'
          }`}>
            {/* Weather Section */}
            <div className="p-4">
              <div className={`rounded-2xl p-4 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30' 
                  : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Current Weather</h3>
                  <span className="text-2xl">{mockWeatherData.icon}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-2xl font-bold">{mockWeatherData.temperature}°C</span>
                    <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Feels like {mockWeatherData.feelsLike}°C
                    </span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {mockWeatherData.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Humidity: {mockWeatherData.humidity}%</div>
                    <div>Wind: {mockWeatherData.windSpeed} km/h</div>
                    <div>Pressure: {mockWeatherData.pressure} hPa</div>
                    <div>Rain: {mockWeatherData.precipitation} mm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast */}
            <div className="px-4 pb-4">
              <h3 className="font-semibold mb-3">3-Day Forecast</h3>
              <div className="space-y-2">
                {mockForecast.map((day, index) => (
                  <div key={index} className={`p-3 rounded-xl ${
                    isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{day.dayName}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {day.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg">{day.icon}</span>
                        <p className="text-sm font-medium">
                          {day.temperature.max}°/{day.temperature.min}°
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(day.riskLevel)}`}>
                          {day.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monitored Areas */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Monitored Areas</h3>
                <button
                  onClick={toggleDrawing}
                  className={`p-1.5 rounded-lg transition-colors ${
                    drawingMode 
                      ? 'bg-blue-500 text-white' 
                      : isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {monitoredAreas.map(area => (
                  <div key={area.id} className={`p-3 rounded-xl transition-all duration-200 ${
                    isDarkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-100/50 hover:bg-slate-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="font-medium text-sm">{area.name}</p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {area.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(area.riskLevel || 'low')}`}>
                          {area.riskLevel || 'low'}
                        </span>
                        <button
                          onClick={() => openFloodEventForm(area)}
                          className={`p-1 rounded transition-colors ${
                            isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteArea(area.id)}
                          className="p-1 rounded transition-colors hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {monitoredAreas.length === 0 && (
                  <div className={`p-4 text-center rounded-xl ${
                    isDarkMode ? 'bg-slate-800/30' : 'bg-slate-100/30'
                  }`}>
                    <MapPin className={`w-8 h-8 mx-auto mb-2 ${
                      isDarkMode ? 'text-slate-600' : 'text-slate-400'
                    }`} />
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      No areas monitored yet
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      Click + to add areas
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Map Container */}
          <div className="relative h-screen">
            <div id="map" className="w-full h-full"></div>
            
            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={toggleDrawing}
                className={`p-3 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-200 ${
                  drawingMode
                    ? 'bg-blue-500 text-white shadow-blue-500/25'
                    : isDarkMode 
                      ? 'bg-slate-800/80 hover:bg-slate-700 text-white' 
                      : 'bg-white/80 hover:bg-white text-slate-900'
                }`}
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>

            {/* Status Bar */}
            <div className={`absolute bottom-4 left-4 right-4 rounded-xl backdrop-blur-xl border ${
              isDarkMode 
                ? 'bg-slate-900/80 border-slate-700/50' 
                : 'bg-white/80 border-slate-200/50'
            }`}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">System Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{monitoredAreas.length} Areas</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Flood Event Form Modal */}
      <FloodEventFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        area={selectedArea}
        firebaseService={firebaseService}
      />
    </div>
  );
}

export default App;