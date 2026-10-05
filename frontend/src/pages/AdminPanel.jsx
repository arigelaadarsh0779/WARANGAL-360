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
  Eye,
  Trash2,
  Lock,
  Key,
  ShieldCheck
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
  const [offPassword, setOffPassword] = useState('');
  const [offMustChange, setOffMustChange] = useState(false);
  const [offDeptId, setOffDeptId] = useState('');
  const [offLevel, setOffLevel] = useState('0'); // 0: Officer (L0), 1: Dept Head (L1)
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
    if (offPassword && offPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    setCreatingOfficial(true);
    try {
      await api.createOfficial({
        name: offName,
        phone: offPhone,
        departmentId: parseInt(offDeptId, 10),
        designationLevel: parseInt(offLevel, 10),
        password: offPassword || 'Warangal@123',
        mustChangePassword: offMustChange
      });
      alert(`✓ Official "${offName}" created successfully with role ${offLevel === '1' ? 'Department Head (L1)' : 'Officer (L0)'}!`);
      setShowOfficialModal(false);
      setOffName('');
      setOffPhone('');
      setOffPassword('');
      setOffMustChange(false);
      loadAllAdminData();
    } catch (err) {
      alert("Failed to create official: " + err.message);
    } finally {
      setCreatingOfficial(false);
    }
  };

  const handleDeleteOfficial = async (officialId, officialName) => {
    if (!window.confirm(`Are you sure you want to delete officer "${officialName}"? This account will be completely removed.`)) {
      return;
    }
    try {
      await api.deleteOfficial(officialId);
      alert(`✓ Officer "${officialName}" deleted successfully.`);
      loadAllAdminData();
    } catch (err) {
      alert("Failed to delete official: " + err.message);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-dark)' }}>
              Admin Console
            </h1>
            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', backgroundColor: '#0B2A5B', color: '#fff', fontWeight: 700, letterSpacing: '0.03em' }}>
              SUPER ADMIN
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Greater Warangal Municipal Corporation</p>
        </div>

        {/* Live Demo Trigger Button */}
        <button
          onClick={handleTriggerSlaDemo}
          className="btn btn-sm"
          style={{ background: '#FFFBEB', color: '#B45309', borderColor: '#F59E0B', fontWeight: 700, border: '1px solid #F59E0B' }}
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
        background: 'var(--surface-alt)',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '20px',
        overflowX: 'auto',
        gap: '2px',
      }}>
        {[
          { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
          { id: 'OFFICIALS', label: 'Officials', icon: Users },
          { id: 'USERS', label: 'Citizens', icon: Ban },
          { id: 'SLA', label: 'SLA', icon: Clock },
          { id: 'AUDIT', label: 'Audit', icon: FileText }
        ].map((tItem) => {
          const Icon = tItem.icon;
          const isActive = activeTab === tItem.id;
          return (
            <button
              key={tItem.id}
              onClick={() => setActiveTab(tItem.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 14px',
                borderRadius: '9px',
                border: 'none',
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? 'var(--primary-dark)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
                flex: '1 1 auto',
                justifyContent: 'center',
              }}
            >
              <Icon size={14} />
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--primary-dark)' }}>
                Department Officers & Heads Directory
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Manage Level 0 (Field Officers) and Level 1 (Department Heads) across all municipal departments.
              </p>
            </div>
            <button onClick={() => setShowOfficialModal(true)} className="btn btn-sm btn-primary">
              <PlusCircle size={16} />
              <span>Create Official (L0 / L1)</span>
            </button>
          </div>

          {usersList.filter(u => u.role !== 'ROLE_CITIZEN').length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
              <Users size={36} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>No Department Officials Added Yet</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', maxWidth: '400px', margin: '0 auto 16px' }}>
                All seeded demo officers have been removed. Tap the button below to add your municipal department officers (L0) and heads (L1) with your own custom passwords.
              </p>
              <button onClick={() => setShowOfficialModal(true)} className="btn btn-sm btn-primary">
                <PlusCircle size={15} />
                <span>Add First Officer</span>
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Name</th>
                    <th style={{ padding: '12px 16px' }}>Phone / Login ID</th>
                    <th style={{ padding: '12px 16px' }}>Department</th>
                    <th style={{ padding: '12px 16px' }}>Role / Level</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.filter(u => u.role !== 'ROLE_CITIZEN').map((off) => {
                    const isSuperAdmin = off.role === 'ROLE_ADMIN';
                    const isDeptHead = off.designationLevel === 1 || off.role === 'ROLE_DEPT_HEAD';
                    return (
                      <tr key={off.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {off.name}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>
                          {off.phone}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                            {off.department?.name || 'All Municipal Administration'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            backgroundColor: isSuperAdmin ? '#EDE9FE' : isDeptHead ? '#FEF3C7' : '#EFF6FF',
                            color: isSuperAdmin ? '#6D28D9' : isDeptHead ? '#B45309' : '#1E56B8',
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'inline-block'
                          }}>
                            {isSuperAdmin ? '👑 Super Admin' : isDeptHead ? '👔 Department Head (L1)' : '👷 Field Officer (L0)'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            color: off.accountStatus === 'ACTIVE' ? '#166534' : '#991B1B',
                            backgroundColor: off.accountStatus === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}>
                            {off.accountStatus}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {!isSuperAdmin && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleToggleUserSuspension(off.id, off.accountStatus)}
                                className="btn btn-xs btn-secondary"
                                title={off.accountStatus === 'ACTIVE' ? 'Suspend Officer' : 'Activate Officer'}
                                style={{ padding: '4px 8px', fontSize: '11px', height: '28px' }}
                              >
                                {off.accountStatus === 'ACTIVE' ? <Ban size={13} color="#DC2626" /> : <CheckCircle size={13} color="#166534" />}
                                <span>{off.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteOfficial(off.id, off.name)}
                                className="btn btn-xs"
                                title="Delete Officer"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  height: '28px',
                                  backgroundColor: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 600
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
          <div className="modal-content" style={{ padding: '24px', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Add New Official</h3>
              <button
                type="button"
                onClick={() => setShowOfficialModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOfficial}>
              <div className="form-group">
                <label className="form-label">Official's Full Name *</label>
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
                <label className="form-label">Phone Number (Login ID) *</label>
                <input
                  type="tel"
                  className="form-input"
                  required
                  placeholder="e.g. 9888812345 or +919888812345"
                  value={offPhone}
                  onChange={(e) => setOffPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign Password *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Set login password (min 6 characters)"
                  value={offPassword}
                  onChange={(e) => setOffPassword(e.target.value)}
                  minLength={6}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  The official will log in using their Phone Number and this Password.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Department *</label>
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
                <label className="form-label">Designation / Role Level *</label>
                <select
                  className="form-select"
                  value={offLevel}
                  onChange={(e) => setOffLevel(e.target.value)}
                >
                  <option value="0">👷 Field Officer / Inspector (Level 0 - Resolves reports with photos)</option>
                  <option value="1">👔 Department Head / Superintending Engineer (Level 1 - Escalations & Oversight)</option>
                </select>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)' }}>
                  <input
                    type="checkbox"
                    checked={offMustChange}
                    onChange={(e) => setOffMustChange(e.target.checked)}
                  />
                  Require officer to change password on first login
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
                  {creatingOfficial ? 'Creating Official...' : '✓ Create Official Account'}
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
