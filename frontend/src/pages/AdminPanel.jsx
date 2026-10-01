import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import {
  ShieldAlert,
  BarChart3,
  Users,
  Clock,
  FileText,
  PlusCircle,
  Play,
  CheckCircle,
  Ban,
  RefreshCw,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminPanel() {
  const { t } = useAuth();
  const [activeTab, setActiveTab] = useState('ANALYTICS'); // 'ANALYTICS' | 'OFFICIALS' | 'USERS' | 'SLA' | 'AUDIT'
  const [analytics, setAnalytics] = useState(null);
  const [criticallyOverdue, setCriticallyOverdue] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [slaSettings, setSlaSettings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Official Modal
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [offName, setOffName] = useState('');
  const [offPhone, setOffPhone] = useState('');
  const [offDeptId, setOffDeptId] = useState('');
  const [offLevel, setOffLevel] = useState('0'); // 0: Officer, 1: Dept Head
  const [creatingOfficial, setCreatingOfficial] = useState(false);

  // Edit SLA Modal
  const [editingSla, setEditingSla] = useState(null);
  const [slaRespHours, setSlaRespHours] = useState(24);
  const [slaResolHours, setSlaResolHours] = useState(72);

  // User search
  const [searchPhone, setSearchPhone] = useState('');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [analyticsData, critData, usersData, deptData, slaData, auditData] = await Promise.all([
        api.getAdminAnalytics().catch(() => null),
        api.getCriticallyOverdue().catch(() => []),
        api.getAllUsers().catch(() => []),
        api.getDepartments().catch(() => []),
        api.getSlaSettings().catch(() => []),
        api.getAuditLogs().catch(() => [])
      ]);

      setAnalytics(analyticsData);
      setCriticallyOverdue(critData || []);
      setUsersList(usersData || []);
      setDepartments(deptData || []);
      setSlaSettings(slaData || []);
      setAuditLogs(auditData || []);
      if (deptData && deptData.length > 0) {
        setOffDeptId(deptData[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSlaDemo = async () => {
    try {
      await api.triggerSlaCheck();
      alert("✓ SLA Scheduler Triggered! All overdue reports escalated according to policy.");
      loadAllAdminData();
    } catch (err) {
      alert("SLA trigger failed: " + err.message);
    }
  };

  const handleCreateOfficial = async (e) => {
    e.preventDefault();
    setCreatingOfficial(true);
    try {
      await api.createOfficial({
        name: offName,
        phone: offPhone,
        departmentId: parseInt(offDeptId, 10),
        designationLevel: parseInt(offLevel, 10),
        tempPassword: 'Warangal@123'
      });
      alert(`Official created successfully! Temporary password: Warangal@123`);
      setShowOfficialModal(false);
      setOffName('');
      setOffPhone('');
      loadAllAdminData();
    } catch (err) {
      alert("Failed to create official: " + err.message);
    } finally {
      setCreatingOfficial(false);
    }
  };

  const handleToggleUserSuspension = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      await api.updateUserStatus(userId, newStatus);
      loadAllAdminData();
    } catch (err) {
      alert("Failed to change user status: " + err.message);
    }
  };

  const handleSaveSlaSetting = async (e) => {
    e.preventDefault();
    if (!editingSla) return;
    try {
      await api.updateSlaSetting(editingSla.id, {
        responseHours: parseInt(slaRespHours, 10),
        resolutionHours: parseInt(slaResolHours, 10)
      });
      setEditingSla(null);
      loadAllAdminData();
    } catch (err) {
      alert("Failed to update SLA setting: " + err.message);
    }
  };

  // Chart data setup
  const categoryChartData = {
    labels: analytics?.byCategory ? Object.keys(analytics.byCategory) : [],
    datasets: [
      {
        label: 'Reports by Category',
        data: analytics?.byCategory ? Object.values(analytics.byCategory) : [],
        backgroundColor: [
          '#1E56B8', '#1F8A4C', '#D98A00', '#E0601A',
          '#C0392B', '#0891B2', '#7C3AED', '#64748B'
        ],
        borderRadius: 6
      }
    ]
  };

  const statusChartData = {
    labels: analytics?.byStatus ? Object.keys(analytics.byStatus) : [],
    datasets: [
      {
        data: analytics?.byStatus ? Object.values(analytics.byStatus) : [],
        backgroundColor: ['#6B7280', '#1E56B8', '#D98A00', '#1F8A4C', '#C0392B']
      }
    ]
  };

  const filteredUsers = usersList.filter(u =>
    searchPhone === '' || u.phone?.includes(searchPhone) || u.name?.toLowerCase().includes(searchPhone.toLowerCase())
  );

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)' }}>
              Municipal Administration Console
            </h2>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--primary-dark)', color: '#ffffff', fontWeight: 700 }}>
              Super Admin
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Greater Warangal Municipal Corporation (GWMC) Control Hub</p>
        </div>

        {/* Live Demo Trigger Button */}
        <button
          onClick={handleTriggerSlaDemo}
          className="btn btn-sm btn-secondary"
          style={{ backgroundColor: '#FEF3C7', color: '#B45309', borderColor: '#F59E0B', fontWeight: 700 }}
          title="Simulate background cron execution immediately for live presentation"
        >
          <Play size={14} fill="currentColor" />
          <span>Trigger Live SLA Check (Demo)</span>
        </button>
      </div>

      {/* Critically Overdue Top Alert (if any) */}
      {criticallyOverdue.length > 0 && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '2px solid #EF4444',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontWeight: 700, marginBottom: '8px' }}>
            <ShieldAlert size={20} />
            <span>CRITICALLY OVERDUE GRIEVANCES ({criticallyOverdue.length} Action Required)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {criticallyOverdue.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #FCA5A5'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#B91C1C', marginRight: '8px' }}>#{r.id} {r.category}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{r.aiSummary || r.description}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 {r.address} • Dept: {r.department?.name}</div>
                </div>

                <Link to={`/reports/${r.id}`} className="btn btn-sm btn-danger">
                  Inspect
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Stat Tiles */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Submissions</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>{analytics?.totalReports || 0}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #D98A00' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active / Open</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#D98A00' }}>{analytics?.openReports || 0}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #1F8A4C' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Resolved</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1F8A4C' }}>{analytics?.resolvedReports || 0}</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #C0392B', backgroundColor: (analytics?.overdueReports || 0) > 0 ? '#FFF5F5' : '#ffffff' }}>
          <div style={{ fontSize: '12px', color: '#991B1B' }}>Overdue Escalations</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#C0392B' }}>{analytics?.overdueReports || 0}</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '10px',
        marginBottom: '20px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'ANALYTICS', label: 'Civic Analytics', icon: BarChart3 },
          { id: 'OFFICIALS', label: 'Department Officials', icon: Users },
          { id: 'USERS', label: 'Citizen Moderation', icon: Ban },
          { id: 'SLA', label: 'SLA Target Settings', icon: Clock },
          { id: 'AUDIT', label: 'Audit Trail', icon: FileText }
        ].map((tItem) => {
          const Icon = tItem.icon;
          return (
            <button
              key={tItem.id}
              onClick={() => setActiveTab(tItem.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: activeTab === tItem.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tItem.id ? '#ffffff' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS CHARTS */}
      {activeTab === 'ANALYTICS' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--primary-dark)' }}>
              Reports Breakdown by Category
            </h3>
            <div style={{ height: '260px' }}>
              <Bar data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--primary-dark)' }}>
              Status Distribution
            </h3>
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={statusChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OFFICIALS MANAGEMENT */}
      {activeTab === 'OFFICIALS' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
            <button onClick={() => setShowOfficialModal(true)} className="btn btn-sm btn-primary">
              <PlusCircle size={16} />
              <span>Create Official Account</span>
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Name</th>
                  <th style={{ padding: '12px 16px' }}>Phone / Login ID</th>
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Role / Level</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {usersList.filter(u => u.role !== 'ROLE_CITIZEN').map((off) => (
                  <tr key={off.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{off.name}</td>
                    <td style={{ padding: '12px 16px' }}>{off.phone}</td>
                    <td style={{ padding: '12px 16px' }}>{off.department?.name || 'All Administration'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: off.designationLevel === 1 ? '#FEF3C7' : '#EFF6FF',
                        color: off.designationLevel === 1 ? '#B45309' : 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {off.designationLevel === 1 ? 'Department Head (L1)' : off.role === 'ROLE_ADMIN' ? 'Super Admin' : 'Officer (L0)'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: off.accountStatus === 'ACTIVE' ? '#166534' : '#991B1B', fontWeight: 600 }}>
                        {off.accountStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CITIZEN MODERATION */}
      {activeTab === 'USERS' && (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: '360px' }}
              placeholder="Search citizens by name or phone..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
            />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Name</th>
                  <th style={{ padding: '12px 16px' }}>Phone Number</th>
                  <th style={{ padding: '12px 16px' }}>Rejected Submissions</th>
                  <th style={{ padding: '12px 16px' }}>Account Status</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.filter(u => u.role === 'ROLE_CITIZEN').map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '12px 16px' }}>{u.phone}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: u.rejectedCount > 3 ? '#DC2626' : 'inherit', fontWeight: u.rejectedCount > 0 ? 700 : 400 }}>
                        {u.rejectedCount || 0} / 5
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: u.accountStatus === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                        color: u.accountStatus === 'ACTIVE' ? '#166534' : '#991B1B',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleToggleUserSuspension(u.id, u.accountStatus)}
                        className={`btn btn-sm ${u.accountStatus === 'SUSPENDED' ? 'btn-primary' : 'btn-danger'}`}
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        {u.accountStatus === 'SUSPENDED' ? 'Restore Account' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SLA TARGET SETTINGS */}
      {activeTab === 'SLA' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Response Target</th>
                <th style={{ padding: '12px 16px' }}>Resolution Target</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {slaSettings.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary)' }}>
                    {t(s.category)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{s.responseHours} Hours</td>
                  <td style={{ padding: '12px 16px' }}>{s.resolutionHours} Hours</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => {
                        setEditingSla(s);
                        setSlaRespHours(s.responseHours);
                        setSlaResolHours(s.resolutionHours);
                      }}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      Edit SLA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '10px 14px' }}>Timestamp</th>
                <th style={{ padding: '10px 14px' }}>Actor</th>
                <th style={{ padding: '10px 14px' }}>Action</th>
                <th style={{ padding: '10px 14px' }}>Target</th>
                <th style={{ padding: '10px 14px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 30).map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{log.actor?.name || 'System'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--primary)', fontWeight: 700 }}>{log.action}</td>
                  <td style={{ padding: '10px 14px' }}>{log.target}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Official */}
      {showOfficialModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>Create Department Official</h3>

            <form onSubmit={handleCreateOfficial}>
              <div className="form-group">
                <label className="form-label">Official's Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Er. P. Suresh"
                  value={offName}
                  onChange={(e) => setOffName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Login ID)</label>
                <input
                  type="tel"
                  className="form-input"
                  required
                  placeholder="e.g. 9888812345"
                  value={offPhone}
                  onChange={(e) => setOffPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={offDeptId}
                  onChange={(e) => setOffDeptId(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Designation Level</label>
                <select
                  className="form-select"
                  value={offLevel}
                  onChange={(e) => setOffLevel(e.target.value)}
                >
                  <option value="0">Officer / Inspector (Level 0)</option>
                  <option value="1">Department Head / Superintending Engineer (Level 1 Escalation)</option>
                </select>
              </div>

              <div style={{ backgroundColor: '#EFF6FF', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--primary-dark)', marginBottom: '14px' }}>
                Default temporary password assigned: <strong>Warangal@123</strong> (Must change on first login).
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowOfficialModal(false)}
                  className="btn btn-sm btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOfficial}
                  className="btn btn-sm btn-primary"
                >
                  {creatingOfficial ? 'Creating...' : 'Create Official Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit SLA */}
      {editingSla && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '20px', maxWidth: '420px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
              Edit SLA Target: {t(editingSla.category)}
            </h3>

            <form onSubmit={handleSaveSlaSetting}>
              <div className="form-group">
                <label className="form-label">Response Time Target (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  className="form-input"
                  required
                  value={slaRespHours}
                  onChange={(e) => setSlaRespHours(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resolution Time Target (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  className="form-input"
                  required
                  value={slaResolHours}
                  onChange={(e) => setSlaResolHours(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingSla(null)}
                  className="btn btn-sm btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save SLA Targets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
