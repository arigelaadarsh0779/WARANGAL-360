import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PhoneCall, ShieldAlert, HeartPulse, Flame, Phone, Building2, Zap, Droplets } from 'lucide-react';
import { api } from '../services/api';

export default function EmergencyContacts() {
  const { t, language } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await api.getEmergencyContacts();
      setContacts(res || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (tag) => {
    switch (tag) {
      case 'POLICE': return ShieldAlert;
      case 'AMBULANCE': return HeartPulse;
      case 'FIRE': return Flame;
      case 'ELECTRICITY': return Zap;
      case 'WATER': return Droplets;
      default: return Building2;
    }
  };

  const getCategoryColor = (tag) => {
    switch (tag) {
      case 'POLICE': return '#1E40AF';
      case 'AMBULANCE': return '#DC2626';
      case 'FIRE': return '#EA580C';
      case 'ELECTRICITY': return '#CA8A04';
      case 'WATER': return '#0284C7';
      default: return 'var(--primary)';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)' }}>{t('navContacts')}</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tap-to-call direct municipal and emergency numbers for Greater Warangal</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading helpline directory...</div>
      ) : (
        <div className="grid-2">
          {contacts.map((c) => {
            const Icon = getCategoryIcon(c.categoryTag);
            const color = getCategoryColor(c.categoryTag);
            const title = (language === 'te' && c.nameTe) ? c.nameTe : c.nameEn;

            return (
              <div
                key={c.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: `${color}15`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={24} />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                      {title}
                    </h3>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {c.phone}
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${c.phone}`}
                  className="btn btn-sm btn-primary"
                  style={{
                    borderRadius: '9999px',
                    padding: '8px 16px',
                    backgroundColor: color,
                    borderColor: color,
                    textDecoration: 'none'
                  }}
                >
                  <PhoneCall size={16} />
                  <span>Call</span>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
