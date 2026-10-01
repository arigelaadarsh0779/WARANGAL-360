import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, AlertTriangle, Clock, Eye, Layers, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityTag from '../components/PriorityTag';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function DeptHeadDashboard() {
  const { user, t } = useAuth();
  const [escalatedReports, setEscalatedReports] = useState([]);
  const [allDeptReports, setAllDeptReports] = useState([]);
  const [activeTab, setActiveTab] = useState('ESCALATED'); // 'ESCALATED' | 'ALL'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeptHeadData();
  }, [user]);

  const loadDeptHeadData = async () => {
    if (!user?.departmentId) return;
    try {
      setLoading(true);
      const [escRes, allRes] = await Promise.all([
        api.getEscalatedReports().catch(() => []),
        api.getDepartmentReports(user.departmentId).catch(() => [])
      ]);
      setEscalatedReports(escRes || []);
      setAllDeptReports(allRes || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  const displayedList = activeTab === 'ESCALATED' ? escalatedReports : allDeptReports;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)' }}>
            {user?.departmentName || 'Department'} Executive Oversight
          </h2>
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontWeight: 700 }}>
            Department Head (Level 1 Escalation)
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Direct supervision of missed SLA deadlines and emergency citizen hazards
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('ESCALATED')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #F87171',
            backgroundColor: activeTab === 'ESCALATED' ? 'var(--prio-emergency)' : '#ffffff',
            color: activeTab === 'ESCALATED' ? '#ffffff' : '#B91C1C',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShieldAlert size={16} />
          <span>{t('escalatedToMe')} ({escalatedReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            backgroundColor: activeTab === 'ALL' ? 'var(--primary)' : '#ffffff',
            color: activeTab === 'ALL' ? '#ffffff' : 'var(--text-main)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <span>All Department Reports ({allDeptReports.length})</span>
        </button>
      </div>

      {/* Queue List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading executive queue...</div>
      ) : displayedList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          {activeTab === 'ESCALATED' ? '🎉 Great job! No overdue reports currently escalated.' : 'No reports recorded.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayedList.map((r) => {
            const isOverdue = r.escalationLevel && r.escalationLevel >= 1;

            return (
              <div
                key={r.id}
                className="card card-hover"
                style={{
                  backgroundColor: isOverdue ? '#FEF2F2' : '#ffffff',
                  border: isOverdue ? '2px solid #EF4444' : '1px solid var(--border)',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: '#E2E8F0',
                    flexShrink: 0
                  }}>
                    <img
                      src={getFullImageUrl(r.photoUrl)}
                      alt="Report"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
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
                          <span style={{
                            backgroundColor: 'var(--prio-emergency)',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            LEVEL 1 ESCALATION
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
                        SLA Deadline Passed: {r.responseDeadline ? new Date(r.responseDeadline).toLocaleString() : 'N/A'}
                      </span>

                      <Link
                        to={`/reports/${r.id}`}
                        className="btn btn-sm btn-primary"
                      >
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
      )}
    </div>
  );
}
