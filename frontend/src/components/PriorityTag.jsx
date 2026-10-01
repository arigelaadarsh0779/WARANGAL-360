import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function PriorityTag({ score, isEmergency, level }) {
  const { t } = useAuth();

  let prioConfig = {
    color: '#1F8A4C',
    bg: '#DCFCE7',
    label: t('priorityLow')
  };

  if (isEmergency || score >= 120 || level === 'EMERGENCY') {
    prioConfig = {
      color: '#C0392B',
      bg: '#FEE2E2',
      label: t('priorityEmergency'),
      icon: ShieldAlert
    };
  } else if (score >= 80 || level === 'HIGH') {
    prioConfig = {
      color: '#E0601A',
      bg: '#FFEDD5',
      label: t('priorityHigh'),
      icon: Flame
    };
  } else if (score >= 50 || level === 'MEDIUM') {
    prioConfig = {
      color: '#D98A00',
      bg: '#FEF3C7',
      label: t('priorityMedium'),
      icon: AlertTriangle
    };
  }

  const Icon = prioConfig.icon;

  return (
    <span
      className="tag-prio"
      style={{
        backgroundColor: prioConfig.bg,
        color: prioConfig.color,
        border: `1px solid ${prioConfig.color}50`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        padding: '2px 6px',
        borderRadius: '4px',
        fontWeight: 700
      }}
    >
      {Icon && <Icon size={12} />}
      <span>{prioConfig.label}</span>
      {score !== undefined && score !== null && (
        <span style={{ opacity: 0.85, fontWeight: 500 }}>({score})</span>
      )}
    </span>
  );
}
