import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, AlertTriangle, Eye, Users, Bell, BellOff, Trash2, RefreshCw, User, Phone } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityTag from '../components/PriorityTag';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function DeptHeadDashboard() {
  const { user, t } = useAuth();
  const [escalatedReports, setEscalatedReports] = useState([]);
  const [allDeptReports, setAllDeptReports] = useState([]);
  const [l0Officers, setL0Officers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('ESCALATED'); // 'ESCALATED' | 'ALL' | 'OFFICERS' | 'NOTIFS'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeptHeadData();
  }, [user]);

  const loadDeptHeadData = async () => {
    if (!user?.departmentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [escRes, allRes, officersRes, notifsRes] = await Promise.all([
        api.getEscalatedReports().catch(() => []),
        api.getDepartmentReports(user.departmentId).catch(() => []),
        api.getDeptOfficers(user.departmentId).catch(() => []),
        api.getMyNotifications().catch(() => []),
      ]);
      // Sort: emergency first, then by priority score
      const sortFn = (a, b) => {
        if (a.isEmergency && !b.isEmergency) return -1;
        if (!a.isEmergency && b.isEmergency) return 1;
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      };
      setEscalatedReports((escRes || []).sort(sortFn));
      setAllDeptReports((allRes || []).sort(sortFn));
      setL0Officers(officersRes || []);
      setNotifications(notifsRes || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/uploads/${url}`;
    return `${API_BASE_URL}${path}`;
  };

  const handleDismissNotif = async (id) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* ignore */ }
  };

  const handleClearAllNotifs = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
    } catch { /* ignore */ }
  };

  const displayedList = activeTab === 'ESCALATED' ? escalatedReports : allDeptReports;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)', margin: 0 }}>
            {user?.departmentName || 'Department'} Executive Oversight
          </h2>
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontWeight: 700 }}>
            Department Head (L1)
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Direct supervision of missed SLA deadlines and emergency citizen hazards
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('ESCALATED')}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-md)',
            border: '1px solid #F87171',
            backgroundColor: activeTab === 'ESCALATED' ? 'var(--prio-emergency)' : '#ffffff',
            color: activeTab === 'ESCALATED' ? '#ffffff' : '#B91C1C',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <ShieldAlert size={16} />
          <span>{t('escalatedToMe')} ({escalatedReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            backgroundColor: activeTab === 'ALL' ? 'var(--primary)' : '#ffffff',
            color: activeTab === 'ALL' ? '#ffffff' : 'var(--text-main)',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer'
          }}
        >
          All Dept Reports ({allDeptReports.length})
        </button>

        <button
          onClick={() => setActiveTab('OFFICERS')}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            backgroundColor: activeTab === 'OFFICERS' ? 'var(--primary)' : '#ffffff',
            color: activeTab === 'OFFICERS' ? '#ffffff' : 'var(--text-main)',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Users size={15} />
          My L0 Officers ({l0Officers.length})
        </button>

        <button
          onClick={() => setActiveTab('NOTIFS')}
          style={{
            padding: '8px 14px', borderRadius: 'var(--radius-md)',
            border: `1px solid ${unreadCount > 0 ? '#F59E0B' : 'var(--border)'}`,
            backgroundColor: activeTab === 'NOTIFS' ? '#F59E0B' : '#ffffff',
            color: activeTab === 'NOTIFS' ? '#ffffff' : 'var(--text-main)',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Bell size={15} />
          Notifications {unreadCount > 0 && <span style={{ background: '#DC2626', color: '#fff', borderRadius: '9999px', padding: '1px 6px', fontSize: '11px' }}>{unreadCount}</span>}
        </button>

        <button
          onClick={loadDeptHeadData}
          style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--primary)' }}
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ── Officers Panel ── */}
      {activeTab === 'OFFICERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {l0Officers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Users size={36} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No L0 Field Officers assigned yet.</p>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>
                Ask the Super Admin to add officers to this department.
              </p>
            </div>
          ) : (
            l0Officers.map(off => (
              <div key={off.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #1E56B8, #0B2A5B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '18px', fontWeight: 800
                }}>
                  {off.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{off.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Phone size={12} />
                    {off.phone}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#EFF6FF', color: '#1E56B8' }}>
                    👷 Field Officer (L0)
                  </span>
                  <span style={{ fontSize: '11px', color: off.accountStatus === 'ACTIVE' ? '#059669' : '#DC2626', fontWeight: 600 }}>
                    {off.accountStatus === 'ACTIVE' ? '● Active' : '● Suspended'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Notifications Panel ── */}
      {activeTab === 'NOTIFS' && (
        <div>
          {notifications.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button
                onClick={handleClearAllNotifs}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #DC2626', background: '#fff', color: '#DC2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Trash2 size={13} /> Clear All
              </button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <BellOff size={36} style={{ marginBottom: '10px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="card" style={{
                  padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px',
                  backgroundColor: n.isRead ? '#fff' : '#EFF6FF',
                  borderLeft: `3px solid ${n.isRead ? 'var(--border)' : 'var(--primary)'}`,
                }}>
                  <Bell size={16} style={{ flexShrink: 0, marginTop: '2px', color: n.isRead ? 'var(--text-muted)' : 'var(--primary)' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.4 }}>{n.messageEn}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismissNotif(n.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '4px', flexShrink: 0 }}
                    title="Dismiss"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Reports Queue (ESCALATED / ALL) ── */}
      {(activeTab === 'ESCALATED' || activeTab === 'ALL') && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading executive queue...</div>
        ) : displayedList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            {activeTab === 'ESCALATED' ? '🎉 Great job! No overdue reports currently escalated.' : 'No reports recorded.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {displayedList.map((r) => {
              const isOverdue = r.escalationLevel && r.escalationLevel >= 1;
              const isEmergency = r.isEmergency;

              return (
                <div
                  key={r.id}
                  className="card card-hover"
                  style={{
                    backgroundColor: isEmergency ? '#FFF5F5' : (isOverdue ? '#FEF2F2' : '#ffffff'),
                    border: isEmergency ? '2px solid #DC2626' : (isOverdue ? '2px solid #EF4444' : '1px solid var(--border)'),
                    padding: '16px'
                  }}
                >
                  {/* Emergency banner */}
                  {isEmergency && (
                    <div style={{ background: '#DC2626', color: '#fff', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🚨 EMERGENCY — Immediate Action Required
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '14px' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#E2E8F0', flexShrink: 0 }}>
                      <img src={getFullImageUrl(r.photoUrl)} alt="Report" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                            #{r.id} • {t(r.category)}
                          </span>
                          <PriorityTag score={r.priorityScore} isEmergency={r.isEmergency} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isOverdue && (
                            <span style={{ backgroundColor: 'var(--prio-emergency)', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                              L1 ESCALATION
                            </span>
                          )}
                          <StatusBadge status={r.status} />
                        </div>
                      </div>

                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                        {r.aiSummary || r.description}
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        📍 {r.address || 'Warangal'}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#991B1B', fontWeight: 600 }}>
                          SLA Deadline: {r.resolutionDeadline ? new Date(r.resolutionDeadline).toLocaleString('en-IN') : 'N/A'}
                        </span>
                        <Link to={`/reports/${r.id}`} className="btn btn-sm btn-primary">
                          <Eye size={14} />
                          <span>Inspect & Intervene</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

