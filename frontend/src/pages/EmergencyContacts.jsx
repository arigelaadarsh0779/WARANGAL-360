import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PhoneCall, ShieldAlert, HeartPulse, Flame, Phone, Building2, Zap, Droplets, Mail, ChevronRight, Shield, Activity, Users } from 'lucide-react';
import { api } from '../services/api';

export default function EmergencyContacts() {
  const { t, language } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState('emergency'); // 'emergency' | 'departments'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDirectoryData();
  }, []);

  const loadDirectoryData = async () => {
    try {
      setLoading(true);
      const [contactsRes, deptsRes] = await Promise.all([
        api.getEmergencyContacts().catch(() => []),
        api.getDepartments().catch(() => [])
      ]);
      setContacts(Array.isArray(contactsRes) ? contactsRes : []);
      setDepartments(Array.isArray(deptsRes) ? deptsRes : []);
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

  const getDeptColor = (name) => {
    const n = (name || '').toLowerCase();
    if (n.contains?.('health') || n.includes('health')) return '#059669';
    if (n.contains?.('electric') || n.includes('electric')) return '#CA8A04';
    if (n.contains?.('police') || n.includes('police')) return '#1E40AF';
    if (n.contains?.('fire') || n.includes('fire')) return '#DC2626';
    if (n.contains?.('water') || n.includes('water')) return '#0284C7';
    if (n.contains?.('road') || n.includes('road')) return '#EA580C';
    if (n.contains?.('sanit') || n.includes('sanit')) return '#10B981';
    return 'var(--primary)';
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>
          {t('navContacts')} & Civic Directory
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Official contacts and municipal departments for Greater Warangal
        </p>
      </div>

      {/* Directory Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '16px',
        paddingBottom: '4px'
      }}>
        <button
          onClick={() => setActiveTab('emergency')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: 800,
            color: activeTab === 'emergency' ? '#DC2626' : 'var(--text-muted)',
            borderBottom: activeTab === 'emergency' ? '2.5px solid #DC2626' : 'none',
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Flame size={16} />
          <span>Emergency Helplines ({contacts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: 800,
            color: activeTab === 'departments' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'departments' ? '2.5px solid var(--primary)' : 'none',
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Building2 size={16} />
          <span>Civic Departments ({departments.length})</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading directory...
        </div>
      ) : activeTab === 'emergency' ? (
        /* Emergency Helplines Grid */
        <div className="grid-2">
          {contacts.map((c) => {
            const Icon = getCategoryIcon(c.categoryTag);
            const color = getCategoryColor(c.categoryTag);
            const title = (language === 'te' && c.nameTe) ? c.nameTe : c.nameEn;

            return (
              <div
                key={c.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: `${color}15`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={22} />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2px' }}>
                      {title}
                    </h3>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: color }}>
                      {c.phone}
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${c.phone}`}
                  className="btn btn-sm"
                  style={{
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    backgroundColor: color,
                    borderColor: color,
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '12px'
                  }}
                >
                  <PhoneCall size={14} />
                  <span>Call</span>
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        /* Civic Departments Directory */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {departments.map((dept) => {
            const color = getDeptColor(dept.name);
            return (
              <div
                key={dept.id}
                className="card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderLeft: `4px solid ${color}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: `${color}15`,
                      color: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Building2 size={18} />
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {dept.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {dept.contactPhone && (
                      <a
                        href={`tel:${dept.contactPhone}`}
                        className="btn btn-sm btn-primary"
                        style={{
                          borderRadius: '8px',
                          padding: '4px 12px',
                          height: '32px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: color,
                          borderColor: color,
                          textDecoration: 'none'
                        }}
                      >
                        <Phone size={12} />
                        <span>{dept.contactPhone}</span>
                      </a>
                    )}
                    {dept.contactEmail && (
                      <a
                        href={`mailto:${dept.contactEmail}`}
                        className="btn btn-sm btn-secondary"
                        style={{
                          borderRadius: '8px',
                          padding: '4px 10px',
                          height: '32px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <Mail size={12} />
                      </a>
                    )}
                  </div>
                </div>

                {dept.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-sub)', margin: 0, lineHeight: 1.45 }}>
                    {dept.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

