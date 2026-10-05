import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { Filter, Layers, MapPin, ExternalLink, AlertTriangle, Compass, Navigation, RefreshCw, Eye, CheckCircle2, Clock } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityTag from '../components/PriorityTag';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Custom colored pin factory
const createColoredPin = (color, isEmergency = false) => {
  return L.divIcon({
    className: `custom-pin ${isEmergency ? 'custom-pin-pulse' : ''}`,
    html: `<div style="
      background: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: #FFFFFF;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const pinIcons = {
  emergency: createColoredPin('#DC2626', true),
  high: createColoredPin('#EA580C', false),
  medium: createColoredPin('#D97706', false),
  low: createColoredPin('#059669', false),
};

// Map helper component to control view programmatically
function MapController({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, bounds, map]);

  return null;
}

export default function PublicMap() {
  const { t } = useAuth();
  const [reports, setReports] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE'); // default: hide resolved
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([17.9789, 79.5741]);
  const [mapZoom, setMapZoom] = useState(13);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const [reportsData, noticesData] = await Promise.all([
        api.getPublicMapReports().catch(() => []),
        api.getActiveNotices().catch(() => [])
      ]);
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setNotices(Array.isArray(noticesData) ? noticesData : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    const lat = parseFloat(r.latitude);
    const lng = parseFloat(r.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return false;
    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
    // 'ACTIVE' = all non-resolved statuses (default)
    if (selectedStatus === 'ACTIVE') {
      if (r.status === 'RESOLVED' || r.status === 'REJECTED') return false;
    } else if (selectedStatus !== 'ALL' && r.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const getPinIcon = (report) => {
    if (report.isEmergency || report.priorityScore >= 120) return pinIcons.emergency;
    if (report.priorityScore >= 80) return pinIcons.high;
    if (report.priorityScore >= 50) return pinIcons.medium;
    return pinIcons.low;
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/uploads/${url}`;
    return `${API_BASE_URL}${path}`;
  };

  const handleLocateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
          setMapZoom(15);
        },
        () => {
          alert('Could not access current location. Centering on Warangal.');
          setMapCenter([17.9789, 79.5741]);
          setMapZoom(13);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleRecenter = () => {
    setMapCenter([17.9789, 79.5741]);
    setMapZoom(13);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', position: 'relative', gap: '8px' }}>
      
      {/* Top Filter Chips Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center', paddingBottom: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            <Filter size={13} />
            <span>Category:</span>
          </span>

          {['ALL', 'GARBAGE', 'ROADS', 'ELECTRICAL_HAZARD', 'WATER_LEAKAGE', 'WATERLOGGING', 'STREETLIGHT', 'FALLEN_TREE', 'OTHER'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                border: selectedCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: selectedCategory === cat ? 'var(--primary)' : 'var(--surface-alt)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-main)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat === 'ALL' ? 'All Categories' : t(cat)}
            </button>
          ))}
        </div>

        {/* Status Filters & Live Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Status:</span>
            {['ACTIVE', 'ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: selectedStatus === st ? '1px solid var(--primary-dark)' : '1px solid var(--border)',
                  backgroundColor: selectedStatus === st ? 'var(--primary-dark)' : '#fff',
                  color: selectedStatus === st ? '#fff' : 'var(--text-sub)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {st === 'ACTIVE' ? '🟢 Active Issues' : st === 'ALL' ? 'All (incl. Resolved)' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--primary-dark)' }}>
            <span>📍 {filteredReports.length} Problems on Map</span>
            <button
              onClick={loadMapData}
              title="Refresh Map"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--primary)',
                padding: '2px'
              }}
            >
              <RefreshCw size={12} className={loading ? 'spin-anim' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Map Area */}
      <div style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: '100%', height: '100%' }}
        >
          <MapController center={mapCenter} zoom={mapZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Active Notice Geofenced Zones */}
          {notices.map((notice) => {
            const lat = parseFloat(notice.latitude);
            const lng = parseFloat(notice.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;
            const isEmergency = notice.type === 'EMERGENCY';
            return (
              <Circle
                key={`notice-zone-${notice.id}`}
                center={[lat, lng]}
                radius={notice.radiusMeters || 2000}
                pathOptions={{
                  color: isEmergency ? '#EF4444' : '#3B82F6',
                  fillColor: isEmergency ? '#EF4444' : '#3B82F6',
                  fillOpacity: 0.18,
                  dashArray: '6, 6'
                }}
              >
                <Popup>
                  <div style={{ padding: '6px', maxWidth: '220px' }}>
                    <div style={{ fontWeight: 800, color: isEmergency ? '#B91C1C' : 'var(--primary)', fontSize: '13px', marginBottom: '4px' }}>
                      {isEmergency ? '🚨 Emergency Notice' : '📢 Public Notice'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>{notice.title}</div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-sub)' }}>{notice.messageEn}</p>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* User GPS location pin if tracked */}
          {userLocation && (
            <Circle
              center={userLocation}
              radius={80}
              pathOptions={{ color: '#2563EB', fillColor: '#3B82F6', fillOpacity: 0.5 }}
            />
          )}

          {/* Report Markers */}
          {filteredReports.map((report) => {
            const lat = parseFloat(report.latitude);
            const lng = parseFloat(report.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker
                key={`report-pin-${report.id}`}
                position={[lat, lng]}
                icon={getPinIcon(report)}
                eventHandlers={{
                  click: () => setSelectedReport(report)
                }}
              >
                <Popup>
                  <div style={{ width: '230px', padding: '4px' }}>
                    {report.photoUrl && (
                      <div style={{
                        width: '100%',
                        height: '115px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '8px',
                        backgroundColor: '#E2E8F0'
                      }}>
                        <img
                          src={getFullImageUrl(report.photoUrl)}
                          alt={report.category}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)' }}>
                        {t(report.category)}
                      </span>
                      <StatusBadge status={report.status} />
                    </div>

                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '3px 0', lineHeight: 1.3, color: 'var(--text-main)' }}>
                      {report.aiSummary || report.description || 'Civic Issue'}
                    </h4>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      📍 {report.address || 'Warangal locality'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '6px' }}>
                      <PriorityTag score={report.priorityScore} isEmergency={report.isEmergency} />

                      <Link
                        to={`/reports/${report.id}`}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          textDecoration: 'none'
                        }}
                      >
                        <span>Details</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Quick Action Buttons on Map */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button
            onClick={handleLocateMe}
            title="My Location"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--primary)'
            }}
          >
            <Navigation size={18} />
          </button>

          <button
            onClick={handleRecenter}
            title="Recenter Warangal"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--primary-dark)'
            }}
          >
            <Compass size={18} />
          </button>
        </div>

        {/* Legend Overlay at bottom left */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(4px)',
          borderRadius: '8px',
          padding: '6px 10px',
          border: '1px solid var(--border)',
          fontSize: '10px',
          fontWeight: 600,
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }}></span>
            <span>Emergency</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EA580C' }}></span>
            <span>High</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706' }}></span>
            <span>Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span>
            <span>Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

