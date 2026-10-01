import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Zap, ShieldAlert, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NoticeBanner({ notice }) {
  const { language } = useAuth();
  if (!notice) return null;

  const isEmergency = notice.type === 'EMERGENCY';
  const message = (language === 'te' && notice.messageTe) ? notice.messageTe : notice.messageEn;

  return (
    <div
      style={{
        backgroundColor: isEmergency ? '#FEF2F2' : 'var(--primary-light)',
        border: `1px solid ${isEmergency ? '#F87171' : '#BFDBFE'}`,
        borderLeft: `5px solid ${isEmergency ? 'var(--prio-emergency)' : 'var(--primary)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ color: isEmergency ? 'var(--prio-emergency)' : 'var(--primary)', marginTop: '2px' }}>
        {isEmergency ? <ShieldAlert size={22} /> : <Zap size={22} />}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            backgroundColor: isEmergency ? 'var(--prio-emergency)' : 'var(--primary)',
            color: '#ffffff',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {notice.department?.name || 'Municipal'} Notice
          </span>

          {notice.areaName && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <MapPin size={12} />
              {notice.areaName}
            </span>
          )}
        </div>

        <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '4px 0 2px 0', color: 'var(--text-main)' }}>
          {notice.title}
        </h4>

        <p style={{ fontSize: '13px', color: 'var(--text-main)', opacity: 0.9 }}>
          {message}
        </p>
      </div>

      <Link
        to="/notices"
        style={{
          color: isEmergency ? 'var(--prio-emergency)' : 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          alignSelf: 'center',
          fontWeight: 600,
          fontSize: '13px'
        }}
      >
        <ChevronRight size={20} />
      </Link>
    </div>
  );
}
