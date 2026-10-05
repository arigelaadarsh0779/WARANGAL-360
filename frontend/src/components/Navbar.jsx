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
        <Link to="/" className="nav-brand">
          <div className="nav-brand-icon">
            <MapPin size={17} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="nav-brand-text">
            <div className="nav-brand-title">{t('appName')}</div>
            <div className="nav-brand-sub">Warangal Civic Care</div>
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
