import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export default function NotificationModal({ onClose }) {
  const { language, fetchUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const list = await api.getMyNotifications();
      setNotifications(list || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      fetchUnreadCount();
    } catch {
      // ignore
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Notifications</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={markAllRead}
              className="btn btn-sm"
              style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--primary-light)', color: 'var(--primary)' }}
            >
              <CheckCheck size={14} />
              <span>Mark all read</span>
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', maxHeight: '420px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '14px' }}>
              No notifications yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map(notif => {
                const text = (language === 'te' && notif.messageTe) ? notif.messageTe : notif.messageEn;
                const timeStr = notif.createdAt ? new Date(notif.createdAt).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : '';

                return (
                  <div
                    key={notif.id}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: notif.isRead ? 'var(--surface-alt)' : '#EFF6FF',
                      borderLeft: `4px solid ${notif.isRead ? 'var(--border)' : 'var(--primary)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: notif.isRead ? 400 : 600 }}>
                      {text}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>{timeStr}</span>
                      {notif.report && (
                        <Link
                          to={`/reports/${notif.report.id}`}
                          onClick={onClose}
                          style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <span>View Report #{notif.report.id}</span>
                          <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
