import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { Filter, ThumbsUp, Layers, MapPin, ExternalLink, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityTag from '../components/PriorityTag';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Fix Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored pin factory
const createColoredPin = (color) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

const pinIcons = {
  emergency: createColoredPin('#C0392B'),
  high: createColoredPin('#E0601A'),
  medium: createColoredPin('#D98A00'),
  low: createColoredPin('#1F8A4C'),
};

export default function PublicMap() {
  const { t } = useAuth();
  const [reports, setReports] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Default coordinates: Warangal center
  const warangalCenter = [17.9789, 79.5741];

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
      setReports(reportsData || []);
      setNotices(noticesData || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!r.latitude || !r.longitude) return false;
    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
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
    return `${API_BASE_URL}${url}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', position: 'relative' }}>
      {/* Top Filter Chips Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
        marginBottom: '10px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={14} />
          <span>Category:</span>
        </span>

        {['ALL', 'GARBAGE', 'ROADS', 'ELECTRICAL_HAZARD', 'WATER_LEAKAGE', 'WATERLOGGING', 'STREETLIGHT', 'FALLEN_TREE'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: selectedCategory === cat ? 'var(--primary)' : 'var(--surface-alt)',
              color: selectedCategory === cat ? '#ffffff' : 'var(--text-main)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat === 'ALL' ? 'All Issues' : t(cat)}
          </button>
        ))}
      </div>

      {/* Interactive Map Area */}
      <div style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapContainer center={warangalCenter} zoom={13} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Active Notice Geofenced Zones */}
          {notices.map((notice) => {
            if (!notice.latitude || !notice.longitude) return null;
            const isEmergency = notice.type === 'EMERGENCY';
            return (
              <Circle
                key={`notice-zone-${notice.id}`}
                center={[notice.latitude, notice.longitude]}
                radius={notice.radiusMeters || 2000}
                pathOptions={{
                  color: isEmergency ? '#EF4444' : '#3B82F6',
                  fillColor: isEmergency ? '#EF4444' : '#3B82F6',
                  fillOpacity: 0.15,
                  dashArray: '6, 6'
                }}
              >
                <Popup>
                  <div style={{ padding: '4px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: isEmergency ? '#B91C1C' : 'var(--primary)', marginBottom: '4px' }}>
                      {notice.title}
                    </div>
                    <p style={{ margin: 0 }}>{notice.messageEn}</p>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* Report Markers */}
          {filteredReports.map((report) => (
            <Marker
              key={`report-pin-${report.id}`}
              position={[report.latitude, report.longitude]}
              icon={getPinIcon(report)}
            >
              <Popup>
                <div style={{ width: '220px', padding: '2px' }}>
                  <div style={{
                    width: '100%',
                    height: '110px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '8px',
                    backgroundColor: '#E2E8F0'
                  }}>
                    <img
                      src={getFullImageUrl(report.photoUrl)}
                      alt={report.category}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                      {t(report.category)}
                    </span>
                    <StatusBadge status={report.status} />
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '2px 0 4px 0', lineHeight: 1.2 }}>
                    {report.aiSummary || report.description || 'Civic Issue'}
                  </h4>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {report.address || 'Warangal'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <PriorityTag score={report.priorityScore} isEmergency={report.isEmergency} />

                    <Link
                      to={`/reports/${report.id}`}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>Details</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
