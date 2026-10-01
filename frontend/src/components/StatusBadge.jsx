import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  const { t } = useAuth();

  const configs = {
    SUBMITTED: {
      color: '#6B7280',
      bg: '#F3F4F6',
      icon: Clock,
      label: t('SUBMITTED')
    },
    ACKNOWLEDGED: {
      color: '#1E56B8',
      bg: '#E6EEFA',
      icon: AlertCircle,
      label: t('ACKNOWLEDGED')
    },
    IN_PROGRESS: {
      color: '#D98A00',
      bg: '#FEF3C7',
      icon: RefreshCw,
      label: t('IN_PROGRESS')
    },
    RESOLVED: {
      color: '#1F8A4C',
      bg: '#DCFCE7',
      icon: CheckCircle2,
      label: t('RESOLVED')
    },
    REJECTED: {
      color: '#C0392B',
      bg: '#FEE2E2',
      icon: XCircle,
      label: t('REJECTED')
    }
  };

  const current = configs[status] || configs.SUBMITTED;
  const Icon = current.icon;

  return (
    <span
      className="badge"
      style={{
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.color}40`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        padding: '3px 8px',
        borderRadius: '9999px',
        fontWeight: 600
      }}
    >
      <Icon size={12} strokeWidth={2.5} />
      <span>{current.label}</span>
    </span>
  );
}
