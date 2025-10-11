import React from 'react';
import { Cloud, List, Settings } from 'lucide-react';

interface MobileNavProps {
  onToggleWeatherPanel: () => void;
  onToggleLegend: () => void;
  onToggleMarkerControls: () => void;
  isWeatherPanelOpen: boolean;
  isLegendOpen: boolean;
  isMarkerControlsOpen: boolean;
  isDarkTheme: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({
  onToggleWeatherPanel,
  onToggleLegend,
  onToggleMarkerControls,
  isWeatherPanelOpen,
  isLegendOpen,
  isMarkerControlsOpen,
  isDarkTheme,
}) => {
  const buttonClasses = isDarkTheme
    ? 'bg-gray-800/80 hover:bg-gray-700/80'
    : 'bg-white/10 hover:bg-white/20';
  const activeClasses = isDarkTheme
    ? 'bg-blue-600/70 hover:bg-blue-600/90'
    : 'bg-blue-500/60 hover:bg-blue-500/80';

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 md:hidden">
      <div className={`flex space-x-2 p-2 rounded-full shadow-lg ${isDarkTheme ? 'bg-gray-800/80' : 'bg-white/10'} backdrop-blur-md`}>
        <button
          onClick={onToggleWeatherPanel}
          className={`p-3 rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95 ${isWeatherPanelOpen ? activeClasses : buttonClasses}`}
          title="Toggle Weather Forecast"
        >
          <Cloud className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleLegend}
          className={`p-3 rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95 ${isLegendOpen ? activeClasses : buttonClasses}`}
          title="Toggle Legend"
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleMarkerControls}
          className={`p-3 rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95 ${isMarkerControlsOpen ? activeClasses : buttonClasses}`}
          title="Toggle Marker Size Controls"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MobileNav;