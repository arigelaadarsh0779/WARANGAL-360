import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, ShieldAlert, MapPin, Calendar, PlusCircle, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function NoticesPage() {
  const { t, language, isOfficial, isDeptHead, isAdmin, user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [tab, setTab] = useState('ALL'); // 'ALL' | 'PLANNED' | 'EMERGENCY'
  const [loading, setLoading] = useState(true);

  // Post Notice Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageTe, setMessageTe] = useState('');
  const [areaName, setAreaName] = useState('');
  const [noticeType, setNoticeType] = useState('PLANNED');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [translating, setTranslating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const res = await api.getAllNotices();
      setNotices(res || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleTranslateAi = async () => {
    if (!messageEn) return;
    setTranslating(true);
    try {
      const res = await api.previewNoticeTranslation(messageEn);
      if (res && res.translationTe) {
        setMessageTe(res.translationTe);
      }
    } catch {
      // ignore
    } finally {
      setTranslating(false);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setPublishing(true);
    try {
      await api.createNotice({
        departmentId: user.departmentId || 1,
        title,
        messageEn,
        messageTe,
        areaName,
        type: noticeType,
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        reason
      });
      setShowModal(false);
      // Reset
      setTitle('');
      setMessageEn('');
      setMessageTe('');
      setAreaName('');
      loadNotices();
    } catch (err) {
      alert(err.message || "Failed to publish notice");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await api.deleteNotice(id);
      setNotices(notices.filter(n => n.id !== id));
    } catch (err) {
      alert("Failed to delete notice: " + err.message);
    }
  };

  const filtered = notices.filter(n => {
    if (tab === 'PLANNED') return n.type === 'PLANNED';
    if (tab === 'EMERGENCY') return n.type === 'EMERGENCY';
    return true;
  });

  const canPostNotice = isOfficial || isDeptHead || isAdmin;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)' }}>{t('navNotices')}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Official alerts, power shutdowns, and road maintenance advisories</p>
        </div>

        {canPostNotice && (
          <button onClick={() => setShowModal(true)} className="btn btn-sm btn-primary">
            <PlusCircle size={16} />
            <span>{t('postNotice')}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['ALL', 'PLANNED', 'EMERGENCY'].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: tab === item ? 'var(--primary)' : '#ffffff',
              color: tab === item ? '#ffffff' : 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {item === 'ALL' ? 'All Notices' : item === 'PLANNED' ? 'Planned Works' : 'Emergency Alerts'}
          </button>
        ))}
      </div>

      {/* Notices List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading notices...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No announcements under this category.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((notice) => {
            const isEmergency = notice.type === 'EMERGENCY';
            const displayMessage = (language === 'te' && notice.messageTe) ? notice.messageTe : notice.messageEn;
            const startStr = notice.startTime ? new Date(notice.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
            const endStr = notice.endTime ? new Date(notice.endTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <div
                key={notice.id}
                className="card"
                style={{
                  borderLeft: `5px solid ${isEmergency ? 'var(--prio-emergency)' : 'var(--primary)'}`,
                  backgroundColor: isEmergency ? '#FEF2F2' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: isEmergency ? 'var(--prio-emergency)' : 'var(--primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {isEmergency ? <ShieldAlert size={12} /> : <Zap size={12} />}
                      <span>{notice.department?.name || 'Municipal'}</span>
                    </span>

                    {notice.areaName && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <MapPin size={12} />
                        <span>{notice.areaName}</span>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: notice.status === 'ACTIVE' ? '#DCFCE7' : '#F3F4F6',
                      color: notice.status === 'ACTIVE' ? '#166534' : '#6B7280'
                    }}>
                      {notice.status}
                    </span>
                    {(isAdmin || isDeptHead) && (
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete Notice"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                  {notice.title}
                </h3>

                <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.4, marginBottom: '12px' }}>
                  {displayMessage}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    <span>Active: {startStr} - {endStr}</span>
                  </span>

                  {notice.reason && (
                    <span>Reason: {notice.reason}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Notice Modal for Officials */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px' }}>{t('postNotice')}</h3>

            <form onSubmit={handleCreateNotice}>
              <div className="form-group">
                <label className="form-label">Notice Type</label>
                <select
                  className="form-select"
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value)}
                >
                  <option value="PLANNED">Planned Maintenance (e.g. Power/Water Cut)</option>
                  <option value="EMERGENCY">Emergency Hazard / Flood Alert</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notice Title</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Planned Feeder Shutdown in Kazipet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Affected Area / Locality</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Subedari, Hanamkonda"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message in English</label>
                <textarea
                  className="form-textarea"
                  required
                  rows={2}
                  placeholder="Write clear announcement in English..."
                  value={messageEn}
                  onChange={(e) => setMessageEn(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={handleTranslateAi}
                  disabled={translating || !messageEn}
                  className="btn btn-sm btn-secondary"
                  style={{ width: '100%', marginBottom: '8px' }}
                >
                  <Sparkles size={14} color="var(--primary)" />
                  <span>{translating ? 'Translating to Telugu with AI...' : 'AI Translate to Telugu (తెలుగు అనువాదం)'}</span>
                </button>

                <label className="form-label">Telugu Translation (Editable)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="తెలుగు ప్రకటన..."
                  value={messageTe}
                  onChange={(e) => setMessageTe(e.target.value)}
                />
              </div>

              <div className="grid-2" style={{ marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">End Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-sm btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="btn btn-sm btn-primary"
                >
                  {publishing ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
