import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReportCard from '../components/ReportCard';
import { Filter, PlusCircle } from 'lucide-react';
import { api } from '../services/api';

export default function MyReports({ onOpenReport }) {
  const { t } = useAuth();
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyReports();
  }, []);

  const loadMyReports = async () => {
    try {
      setLoading(true);
      const res = await api.getMyReports();
      setReports(res || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-dark)' }}>{t('navMyReports')}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Track progress and feedback on your reported issues</p>
        </div>

        <button onClick={onOpenReport} className="btn btn-sm btn-primary">
          <PlusCircle size={16} />
          <span>New Report</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '16px'
      }}>
        {['ALL', 'SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--border)',
              backgroundColor: filterStatus === status ? 'var(--primary)' : '#ffffff',
              color: filterStatus === status ? '#ffffff' : 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {status === 'ALL' ? 'All Issues' : t(status)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '14px', marginBottom: '14px' }}>No reports found under this filter.</p>
          <button onClick={onOpenReport} className="btn btn-sm btn-primary">
            <PlusCircle size={16} />
            <span>{t('reportProblem')}</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
