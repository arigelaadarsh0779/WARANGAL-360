import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Globe, Bell, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import NotificationModal from './NotificationModal';

export default function Navbar({ onOpenReport }) {
  const { user, logout, t, language, toggleLanguage, unreadCount, isCitizen, isOfficial, isDeptHead, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-brand">
          <div style={{
            background: '#ffffff',
            color: 'var(--primary-dark)',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={20} color="var(--primary)" />
          </div>
          <div>
            <div style={{ letterSpacing: '0.5px' }}>{t('appName')}</div>
            <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>Warangal Civic Grid</div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links-desktop">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            {t('navHome')}
          </Link>
          <Link to="/map" className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}>
            {t('navMap')}
          </Link>
          <Link to="/notices" className={`nav-link ${location.pathname === '/notices' ? 'active' : ''}`}>
            {t('navNotices')}
          </Link>
          <Link to="/contacts" className={`nav-link ${location.pathname === '/contacts' ? 'active' : ''}`}>
            {t('navContacts')}
          </Link>

          {isCitizen && (
            <Link to="/my-reports" className={`nav-link ${location.pathname === '/my-reports' ? 'active' : ''}`}>
              {t('navMyReports')}
            </Link>
          )}

          {isOfficial && (
            <Link to="/official" className={`nav-link ${location.pathname === '/official' ? 'active' : ''}`}>
              {t('navOfficial')}
            </Link>
          )}

          {isDeptHead && (
            <Link to="/dept-head" className={`nav-link ${location.pathname === '/dept-head' ? 'active' : ''}`}>
              {t('navDeptHead')}
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              {t('navAdmin')}
            </Link>
          )}
        </nav>

        {/* Actions & Language switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="btn btn-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '4px 10px',
              fontSize: '12px'
            }}
            title="Switch Language"
          >
            <Globe size={14} />
            <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
          </button>

          {user ? (
            <>
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: '6px'
                }}
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'var(--prio-emergency)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--primary-dark)'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User badge */}
              <div style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px'
              }} className="user-pill-desktop">
                <UserIcon size={14} />
                <span>{user.name}</span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={t('logout')}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-sm btn-secondary" style={{ color: '#ffffff', borderColor: '#ffffff', backgroundColor: 'transparent' }}>
              {t('login')}
            </Link>
          )}
        </div>
      </div>

      {showNotifications && (
        <NotificationModal onClose={() => setShowNotifications(false)} />
      )}
    </header>
  );
}
