import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Map, Camera, Newspaper, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ onOpenReport }) {
  const { user, isCitizen } = useAuth();
  const navigate = useNavigate();

  // Role-aware navigation items
  // Left pair + FAB + Right pair = 5 slots
  // For citizen: Home | Map | [Camera FAB] | Notices | Emergency
  // For guest/public: Home | Map | [Camera FAB] | Notices | Emergency
  // For official: Home | Map | [Camera FAB - hidden] | Dashboard

  const leftItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/map', icon: Map, label: 'Map' },
  ];

  const rightItems = isCitizen
    ? [
        { to: '/notices', icon: Newspaper, label: 'Notices' },
        { to: '/contacts', icon: PhoneCall, label: 'Emergency' },
      ]
    : [
        { to: '/notices', icon: Newspaper, label: 'Notices' },
        { to: '/contacts', icon: PhoneCall, label: 'Emergency' },
      ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
      {/* Left items */}
      {leftItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          aria-label={label}
        >
          <div className="nav-icon-wrap">
            <Icon size={20} strokeWidth={2} />
          </div>
          <span>{label}</span>
        </NavLink>
      ))}

      {/* Central FAB — camera report button */}
      <button
        onClick={isCitizen ? onOpenReport : () => navigate('/login')}
        className="bottom-nav-fab"
        aria-label="Report an issue"
        title="Report a civic issue"
      >
        <Camera size={24} strokeWidth={2.5} />
      </button>

      {/* Right items */}
      {rightItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          aria-label={label}
        >
          <div className="nav-icon-wrap">
            <Icon size={20} strokeWidth={2} />
          </div>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
