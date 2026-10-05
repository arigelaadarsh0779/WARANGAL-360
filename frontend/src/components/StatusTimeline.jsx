import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle, UserCheck } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function StatusTimeline({ history = [] }) {
  const { t } = useAuth();

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/uploads/${url}`;
    return `${API_BASE_URL}${path}`;
  };

  const statusIcons = {
    SUBMITTED: Clock,
    ACKNOWLEDGED: AlertCircle,
    IN_PROGRESS: RefreshCw,
    RESOLVED: CheckCircle2,
    REJECTED: XCircle,
  };

  const statusColors = {
    SUBMITTED: '#6B7280',
    ACKNOWLEDGED: '#1E56B8',
    IN_PROGRESS: '#D98A00',
    RESOLVED: '#1F8A4C',
    REJECTED: '#C0392B',
  };

  if (!history || history.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No updates recorded yet.</div>;
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '24px', margin: '16px 0' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute',
        left: '10px',
        top: '10px',
        bottom: '10px',
        width: '2px',
        backgroundColor: 'var(--border)'
      }} />

      {history.map((item, index) => {
        const Icon = statusIcons[item.status] || Clock;
        const color = statusColors[item.status] || 'var(--primary)';
        const dateStr = item.createdAt
          ? new Date(item.createdAt).toLocaleString(undefined, {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
          : '';

        return (
          <div key={item.id || index} style={{ position: 'relative', marginBottom: '20px' }}>
            {/* Step circle */}
            <div style={{
              position: 'absolute',
              left: '-24px',
              top: '0px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: `2px solid ${color}`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}>
              <Icon size={12} strokeWidth={2.5} />
            </div>

            {/* Content */}
            <div className="card" style={{ padding: '12px 14px', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: color }}>
                  {t(item.status)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dateStr}</span>
              </div>

              {item.updatedBy && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <UserCheck size={13} />
                  <span>{item.updatedBy.name} ({item.updatedBy.department?.name || 'Officer'})</span>
                </div>
              )}

              {item.comment && (
                <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: '4px 0' }}>
                  "{item.comment}"
                </p>
              )}

              {/* After Photo if resolved */}
              {item.afterPhotoUrl && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-resolved)', marginBottom: '4px' }}>
                    ✓ Official 'After' Resolution Photo
                  </div>
                  <img
                    src={getFullImageUrl(item.afterPhotoUrl)}
                    alt="Resolution photo"
                    style={{
                      width: '100%',
                      maxHeight: '180px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
