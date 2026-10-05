import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, AlertTriangle, RefreshCw, XCircle, Camera, PauseCircle, PlayCircle, Eye, Wrench, Layers, Bell, BellOff, Trash2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityTag from '../components/PriorityTag';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function OfficialDashboard() {
  const { user, t } = useAuth();
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE' | 'NOTIFS'
  const [loading, setLoading] = useState(true);

  // Status Action Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionStatus, setActionStatus] = useState('ACKNOWLEDGED');
  const [comment, setComment] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // After-photo capture via in-app camera
  const [afterPhotoBlob, setAfterPhotoBlob] = useState(null);
  const [afterPhotoPreview, setAfterPhotoPreview] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  useEffect(() => {
    loadDepartmentReports();
  }, [user]);

  const loadDepartmentReports = async () => {
    if (!user?.departmentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [res, notifsRes] = await Promise.all([
        api.getDepartmentReports(user.departmentId).catch(() => []),
        api.getMyNotifications().catch(() => []),
      ]);
      setReports(res || []);
      setNotifications(notifsRes || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (report, targetStatus) => {
    setSelectedReport(report);
    setActionStatus(targetStatus);
    setComment('');
    setPauseReason('');
    setAfterPhotoBlob(null);
    setAfterPhotoPreview(null);
    setCameraActive(false);
  };

  const startAfterCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Could not access camera for resolution photo.");
      setCameraActive(false);
    }
  };

  const captureAfterPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Overlay watermark
    ctx.fillStyle = 'rgba(11, 42, 91, 0.85)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`OFFICIAL RESOLUTION PHOTO • ${user.name} • ${new Date().toLocaleString()}`, 12, canvas.height - 15);

    canvas.toBlob((blob) => {
      setAfterPhotoBlob(blob);
      setAfterPhotoPreview(canvas.toDataURL('image/jpeg', 0.85));
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
      setCameraActive(false);
    }, 'image/jpeg', 0.85);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    const formData = new FormData();
    formData.append('status', actionStatus);
    if (comment) formData.append('comment', comment);
    if (pauseReason) formData.append('pauseReason', pauseReason);
    if (afterPhotoBlob) formData.append('afterPhoto', afterPhotoBlob, 'after_resolution.jpg');

    setUpdating(true);
    try {
      await api.updateReportStatus(selectedReport.id, formData);
      setSelectedReport(null);
      loadDepartmentReports();
    } catch (err) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };


  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/uploads/${url}`;
    return `${API_BASE_URL}${path}`;
  };

  // Summary Metrics
  const submittedCount = reports.filter(r => r.status === 'SUBMITTED').length;
  const inProgressCount = reports.filter(r => r.status === 'IN_PROGRESS' || r.status === 'ACKNOWLEDGED').length;
  const overdueCount = reports.filter(r => r.escalationLevel && r.escalationLevel >= 1 && r.status !== 'RESOLVED' && r.status !== 'REJECTED').length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;
  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  // Sort: emergency/overdue first, then by priority score descending
  const sortedReports = [...reports].sort((a, b) => {
    const aUrgent = a.isEmergency || (a.escalationLevel >= 1);
    const bUrgent = b.isEmergency || (b.escalationLevel >= 1);
    if (aUrgent && !bUrgent) return -1;
    if (!aUrgent && bUrgent) return 1;
    return (b.priorityScore || 0) - (a.priorityScore || 0);
  });

  // Filter list
  const filtered = filterStatus === 'ALL' ? sortedReports
    : filterStatus === 'OVERDUE' ? sortedReports.filter(r => r.escalationLevel >= 1 && r.status !== 'RESOLVED' && r.status !== 'REJECTED')
    : sortedReports.filter(r => r.status === filterStatus);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)' }}>
            {user?.departmentName || 'Department'} Queue
          </h2>
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
            Official Desk
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Assigned field issues sorted strictly by priority score and SLA countdown
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px', borderLeft: '4px solid #6B7280' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>New / Unhandled</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#374151' }}>{submittedCount}</div>
        </div>

        <div className="card" style={{ padding: '14px', borderLeft: '4px solid #D98A00' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Progress</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#D98A00' }}>{inProgressCount}</div>
        </div>

        <div className="card" style={{ padding: '14px', borderLeft: '4px solid #C0392B', backgroundColor: overdueCount > 0 ? '#FEF2F2' : '#ffffff' }}>
          <div style={{ fontSize: '12px', color: '#991B1B' }}>Overdue (Escalated)</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#C0392B' }}>{overdueCount}</div>
        </div>

        <div className="card" style={{ padding: '14px', borderLeft: '4px solid #1F8A4C' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Resolved</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#1F8A4C' }}>{resolvedCount}</div>
        </div>
      </div>

      {/* Top Tab Bar: Queue | Notifications */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('QUEUE')}
          style={{ padding: '7px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: activeTab === 'QUEUE' ? 'var(--primary)' : '#fff', color: activeTab === 'QUEUE' ? '#fff' : 'var(--text-main)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          📋 My Queue
        </button>
        <button
          onClick={() => setActiveTab('NOTIFS')}
          style={{ padding: '7px 14px', borderRadius: 'var(--radius-md)', border: `1px solid ${unreadNotifCount > 0 ? '#F59E0B' : 'var(--border)'}`, backgroundColor: activeTab === 'NOTIFS' ? '#F59E0B' : '#fff', color: activeTab === 'NOTIFS' ? '#fff' : 'var(--text-main)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Bell size={14} />
          Notifications
          {unreadNotifCount > 0 && <span style={{ background: '#DC2626', color: '#fff', borderRadius: '9999px', padding: '1px 6px', fontSize: '11px' }}>{unreadNotifCount}</span>}
        </button>
        <button
          onClick={loadDepartmentReports}
          style={{ padding: '7px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--primary)' }}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Notifications Panel */}
      {activeTab === 'NOTIFS' && (
        <div>
          {notifications.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button
                onClick={async () => { try { await api.clearAllNotifications(); setNotifications([]); } catch {} }}
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
                <p style={{ margin: 0 }}>No notifications yet.</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className="card" style={{
                padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px',
                backgroundColor: n.isRead ? '#fff' : '#EFF6FF',
                borderLeft: `3px solid ${n.isRead ? 'var(--border)' : 'var(--primary)'}`,
              }}>
                <Bell size={15} style={{ flexShrink: 0, marginTop: '2px', color: n.isRead ? 'var(--text-muted)' : 'var(--primary)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.4 }}>{n.messageEn}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : ''}</p>
                </div>
                <button
                  onClick={async () => { try { await api.deleteNotification(n.id); setNotifications(prev => prev.filter(x => x.id !== n.id)); } catch {} }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', flexShrink: 0 }}
                ><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue: Filter tabs + Cards */}
      {activeTab === 'QUEUE' && (
        <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        {['ALL', 'OVERDUE', 'SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: filterStatus === st ? 'var(--primary)' : '#ffffff',
              color: filterStatus === st ? '#ffffff' : 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {st === 'ALL' ? 'All Priority Queue' : st === 'OVERDUE' ? '⚠️ Overdue SLA Only' : t(st)}
          </button>
        ))}
      </div>

      {/* Queue Table / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading queue...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No reports in this queue.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((r) => {
            const isOverdue = r.escalationLevel && r.escalationLevel >= 1 && r.status !== 'RESOLVED';
            const deadlineStr = r.responseDeadline ? new Date(r.responseDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <div
                key={r.id}
                className="card card-hover"
                style={{
                  backgroundColor: r.isEmergency ? '#FFF5F5' : (isOverdue ? '#FFF5F5' : '#ffffff'),
                  border: r.isEmergency ? '2px solid #DC2626' : (isOverdue ? '1.5px solid #FCA5A5' : '1px solid var(--border)'),
                  padding: '16px'
                }}
              >
                {r.isEmergency && (
                  <div style={{ background: '#DC2626', color: '#fff', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>
                    🚨 EMERGENCY — Immediate Action Required
                  </div>
                )}
                <div style={{ display: 'flex', gap: '14px' }}>
                  {/* Thumbnail */}
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

                  {/* Main Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                          #{r.id} • {t(r.category)}
                        </span>
                        <PriorityTag score={r.priorityScore} isEmergency={r.isEmergency} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOverdue && (
                          <span style={{
                            backgroundColor: '#FEE2E2',
                            color: '#B91C1C',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            OVERDUE (ESCALATED)
                          </span>
                        )}
                        <StatusBadge status={r.status} />
                      </div>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                      {r.aiSummary || r.description}
                    </h4>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      📍 {r.address || 'Warangal'}
                    </div>

                    {r.aiCrewEstimate && (
                      <div style={{ fontSize: '12px', color: '#15803D', backgroundColor: '#F0FDF4', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
                        <strong>AI Estimate:</strong> {r.aiCrewEstimate}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      {r.status === 'SUBMITTED' && (
                        <button
                          onClick={() => openStatusModal(r, 'ACKNOWLEDGED')}
                          className="btn btn-sm btn-primary"
                        >
                          Acknowledge
                        </button>
                      )}

                      {(r.status === 'SUBMITTED' || r.status === 'ACKNOWLEDGED') && (
                        <button
                          onClick={() => openStatusModal(r, 'IN_PROGRESS')}
                          className="btn btn-sm"
                          style={{ backgroundColor: '#D98A00', color: '#ffffff' }}
                        >
                          Start Work
                        </button>
                      )}

                      {r.status !== 'RESOLVED' && r.status !== 'REJECTED' && (
                        <button
                          onClick={() => openStatusModal(r, 'RESOLVED')}
                          className="btn btn-sm"
                          style={{ backgroundColor: '#1F8A4C', color: '#ffffff' }}
                        >
                          <Camera size={14} />
                          <span>Mark Resolved</span>
                        </button>
                      )}

                      {r.status !== 'REJECTED' && r.status !== 'RESOLVED' && (
                        <button
                          onClick={() => openStatusModal(r, 'REJECTED')}
                          className="btn btn-sm btn-secondary"
                          style={{ color: '#C0392B', borderColor: '#FCA5A5' }}
                        >
                          Reject
                        </button>
                      )}

                      <Link
                        to={`/reports/${r.id}`}
                        className="btn btn-sm btn-secondary"
                        style={{ marginLeft: 'auto' }}
                      >
                        <Eye size={14} />
                        <span>View Details</span>
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
      )}

      {/* Action Status Update Modal */}
      {selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '20px', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>
              Update Report #{selectedReport.id} Status
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Setting status to: <strong style={{ color: 'var(--primary)' }}>{actionStatus}</strong>
            </p>

            <form onSubmit={handleStatusSubmit}>
              <div className="form-group">
                <label className="form-label">{t('addComment')}</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  required={actionStatus === 'REJECTED'}
                  placeholder={actionStatus === 'REJECTED' ? 'Mandatory rejection reason...' : 'Optional comment for the citizen...'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {/* Resolution Photo capture */}
              {actionStatus === 'RESOLVED' && (
                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">Live 'After' Resolution Photo</label>

                  {afterPhotoPreview ? (
                    <div style={{ position: 'relative', height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#000' }}>
                      <img src={afterPhotoPreview} alt="After fix" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <button
                        type="button"
                        onClick={() => { setAfterPhotoPreview(null); setAfterPhotoBlob(null); }}
                        className="btn btn-sm btn-secondary"
                        style={{ position: 'absolute', top: '8px', right: '8px' }}
                      >
                        Retake Photo
                      </button>
                    </div>
                  ) : cameraActive ? (
                    <div>
                      <div style={{ height: '200px', backgroundColor: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '8px' }}>
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <button type="button" onClick={captureAfterPhoto} className="btn btn-sm btn-primary" style={{ width: '100%' }}>
                        <Camera size={16} />
                        <span>Snap 'After' Photo</span>
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={startAfterCamera} className="btn btn-sm btn-secondary" style={{ width: '100%' }}>
                      <Camera size={16} />
                      <span>Open Camera for Resolution Proof</span>
                    </button>
                  )}
                </div>
              )}

              {/* Pause SLA timer option */}
              <div className="form-group">
                <label className="form-label">Pause SLA Clock (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="State reason (e.g. Waiting for asphalt supply)..."
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="btn btn-sm btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn btn-sm btn-primary"
                >
                  {updating ? 'Saving...' : 'Confirm Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
