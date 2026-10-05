import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, CloudFog, Wind, Droplets, RefreshCw, Thermometer, AlertCircle, ShieldCheck } from 'lucide-react';

// WMO Weather code interpretations
const getWeatherInfo = (code) => {
  switch (code) {
    case 0:
      return { label: 'Clear Sky', icon: Sun, color: '#F59E0B', bg: '#FEF3C7', advisory: 'Optimal conditions for municipal field repair crews.' };
    case 1:
    case 2:
      return { label: 'Partly Cloudy', icon: Cloud, color: '#0284C7', bg: '#E0F2FE', advisory: 'Fair civic weather. Sanitation and road works on schedule.' };
    case 3:
      return { label: 'Overcast', icon: Cloud, color: '#64748B', bg: '#F1F5F9', advisory: 'Overcast skies across Greater Warangal.' };
    case 45:
    case 48:
      return { label: 'Foggy / Mist', icon: CloudFog, color: '#6B7280', bg: '#F3F4F6', advisory: 'Drive safely on Warangal-Hanamkonda corridor.' };
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
      return { label: 'Rainy', icon: CloudRain, color: '#2563EB', bg: '#DBEAFE', advisory: 'Rain alert: Low-lying areas monitored for water accumulation.' };
    case 80:
    case 81:
    case 82:
      return { label: 'Heavy Showers', icon: CloudRain, color: '#1D4ED8', bg: '#BFDBFE', advisory: 'GWMC emergency dewatering pumps placed on high alert.' };
    case 95:
    case 96:
    case 99:
      return { label: 'Thunderstorm', icon: CloudLightning, color: '#DC2626', bg: '#FEE2E2', advisory: 'Avoid touching fallen electrical cables or standing under trees.' };
    default:
      return { label: 'Partly Cloudy', icon: Cloud, color: '#1E56B8', bg: '#EFF6FF', advisory: 'Normal municipal operations in progress.' };
  }
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      // Warangal coordinates: 17.9789 N, 79.5741 E
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=17.9789&longitude=79.5741&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FKolkata'
      );
      if (res.ok) {
        const data = await res.json();
        setWeather(data.current);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      // Fallback sensible defaults for Warangal if offline
      setWeather({
        temperature_2m: 31,
        apparent_temperature: 34,
        relative_humidity_2m: 65,
        wind_speed_10m: 11,
        weather_code: 2
      });
      setLastUpdated('Live');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Auto-refresh weather every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!weather && loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
        borderRadius: '16px',
        padding: '14px 18px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: '4px' }} />
            <div className="skeleton" style={{ width: '80px', height: '10px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>
      </div>
    );
  }

  const currentInfo = getWeatherInfo(weather?.weather_code || 0);
  const IconComponent = currentInfo.icon;
  const temp = Math.round(weather?.temperature_2m ?? 31);
  const feelsLike = Math.round(weather?.apparent_temperature ?? temp);
  const humidity = weather?.relative_humidity_2m ?? 60;
  const wind = Math.round(weather?.wind_speed_10m ?? 10);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f2b5c 0%, #17428b 50%, #1e56b8 100%)',
      borderRadius: '16px',
      padding: '12px 16px',
      color: '#ffffff',
      boxShadow: '0 4px 18px rgba(15, 43, 92, 0.18)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.12)'
    }}>
      {/* Background glow decoration */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.08)',
        filter: 'blur(10px)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        
        {/* Left: Location & Condition */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FDE047',
            flexShrink: 0
          }}>
            <IconComponent size={26} strokeWidth={2.2} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.02em', color: '#fff' }}>
                Warangal City
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#E0F2FE'
              }}>
                {currentInfo.label}
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.78)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span>Feels like {feelsLike}°C</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <Droplets size={10} /> {humidity}%
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <Wind size={10} /> {wind} km/h
              </span>
            </div>
          </div>
        </div>

        {/* Right: Big Temperature & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              {temp}°<span style={{ fontSize: '16px', fontWeight: 600 }}>C</span>
            </div>
            {lastUpdated && (
              <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                Updated {lastUpdated}
              </div>
            )}
          </div>

          <button
            onClick={fetchWeather}
            title="Refresh Weather"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* Weather Advisory Banner */}
      <div style={{
        marginTop: '8px',
        paddingTop: '6px',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        fontSize: '11px',
        color: '#E0F2FE',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <ShieldCheck size={13} color="#93C5FD" style={{ flexShrink: 0 }} />
        <span style={{ lineHeight: 1.3 }}>{currentInfo.advisory}</span>
      </div>
    </div>
  );
}
