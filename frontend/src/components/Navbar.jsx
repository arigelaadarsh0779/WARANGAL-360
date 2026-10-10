import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Globe, Bell, LogOut, Shield, LayoutDashboard } from 'lucide-react';
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

        {/* Brand */}
        <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img
            src="/images/warangal_logo.jpg"
            alt="Warangal 360 Logo"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              objectFit: 'cover',
              border: '1.5px solid rgba(56, 189, 248, 0.6)',
              boxShadow: '0 0 10px rgba(30, 86, 184, 0.4)',
            }}
          />
          <div className="nav-brand-text">
            <div className="nav-brand-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>WARANGAL 360</span>
            </div>
            <div className="nav-brand-sub" style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
              GWMC Smart City Portal
            </div>
          </div>
        </Link>

        {/* Desktop nav links - only for officials */}
        <nav className="nav-links-desktop">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/map" className={`nav-link ${location.pathname === '/map' ? 'active' : ''}`}>Map</Link>
          <Link to="/notices" className={`nav-link ${location.pathname === '/notices' ? 'active' : ''}`}>Notices</Link>
          {(isOfficial || isDeptHead) && (
            <Link to="/official" className={`nav-link ${location.pathname === '/official' ? 'active' : ''}`}>
              <LayoutDashboard size={14} />
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              <Shield size={14} />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Language Toggle */}
          <button onClick={toggleLanguage} className="nav-pill-btn" title="Switch Language">
            <Globe size={13} />
            <span>{language === 'en' ? 'తెలుగు' : 'EN'}</span>
          </button>

          {/* Notifications */}
          {user && (
            <button
              id="btn-notifications"
              onClick={() => setShowNotifications(true)}
              className="nav-icon-btn"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          )}

          {/* Auth */}
          {user ? (
            <button onClick={handleLogout} className="nav-icon-btn" title={t('logout')} aria-label="Logout">
              <LogOut size={16} />
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn-sm btn-primary"
              style={{ height: '34px', fontSize: '13px', borderRadius: '8px' }}
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>

      {showNotifications && <NotificationModal onClose={() => setShowNotifications(false)} />}
    </header>
  );
}
