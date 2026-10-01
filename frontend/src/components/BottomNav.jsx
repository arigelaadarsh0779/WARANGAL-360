import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, Camera, BellRing, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ onOpenReport }) {
  const { t, isCitizen } = useAuth();

  return (
    <div className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Home size={20} />
        <span>{t('navHome')}</span>
      </NavLink>

      <NavLink to="/map" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Map size={20} />
        <span>{t('navMap')}</span>
      </NavLink>

      {/* Central Report Camera Button */}
      {isCitizen ? (
        <button
          onClick={onOpenReport}
          className="bottom-nav-camera-btn"
          title={t('reportProblem')}
          aria-label={t('reportProblem')}
        >
          <Camera size={26} />
        </button>
      ) : (
        <NavLink to="/notices" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <BellRing size={20} />
          <span>{t('navNotices')}</span>
        </NavLink>
      )}

      {isCitizen && (
        <NavLink to="/notices" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <BellRing size={20} />
          <span>{t('navNotices')}</span>
        </NavLink>
      )}

      <NavLink to="/contacts" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <PhoneCall size={20} />
        <span>{t('navContacts')}</span>
      </NavLink>
    </div>
  );
}
