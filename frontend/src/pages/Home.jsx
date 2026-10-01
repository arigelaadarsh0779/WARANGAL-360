import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Map, PhoneCall, Bell, CloudRain, Sun, ChevronRight, PlusCircle, Sparkles } from 'lucide-react';
import NoticeBanner from '../components/NoticeBanner';
import ReportCard from '../components/ReportCard';
import { api } from '../services/api';

export default function Home({ onOpenReport }) {
  const { t, user, isCitizen } = useAuth();

  const [activeNotices, setActiveNotices] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [noticesRes, reportsRes] = await Promise.all([
        api.getActiveNotices().catch(() => []),
        isCitizen ? api.getMyReports().catch(() => []) : api.getPublicMapReports().catch(() => [])
      ]);

      setActiveNotices(noticesRes || []);
      setRecentReports((reportsRes || []).slice(0, 5));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Active Notices Section */}
      {activeNotices.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {activeNotices.map((notice) => (
            <NoticeBanner key={notice.id} notice={notice} />
          ))}
        </div>
      )}

      {/* Hero Report Trigger Card (Mobile-First) */}
      <div style={{
        background: 'linear-gradient(135deg, #0B2A5B 0%, #1E56B8 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 20px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          right: '-20px',
          bottom: '-20px',
          opacity: 0.1,
          pointerEvents: 'none'
        }}>
          <Camera size={180} />
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '10px'
          }}>
            <Sparkles size={14} color="#FDE047" />
            <span>AI Verification & SLA Guaranteed</span>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
            {t('reportProblem')}
          </h2>

          <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '20px', lineHeight: 1.4 }}>
            {t('reportSubtitle')}
          </p>

          <button
            onClick={onOpenReport}
            className="btn"
            style={{
              backgroundColor: '#ffffff',
              color: 'var(--primary-dark)',
              height: '52px',
              padding: '0 24px',
              fontSize: '16px',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}
          >
            <Camera size={22} color="var(--primary)" />
            <span>{t('startCamera')}</span>
          </button>
        </div>
      </div>

      {/* Quick Access Action Grid */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <Link to="/map" className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#EFF6FF',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Map size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{t('navMap')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Live civic issues pins</div>
          </div>
        </Link>

        <Link to="/notices" className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bell size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{t('navNotices')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Planned work alerts</div>
          </div>
        </Link>

        <Link to="/contacts" className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <PhoneCall size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>{t('navContacts')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Emergency helplines</div>
          </div>
        </Link>
      </div>

      {/* Recent Reports Stream */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary-dark)' }}>
            {isCitizen ? t('myRecentReports') : 'Recent Civic Reports'}
          </h3>

          <Link to={isCitizen ? "/my-reports" : "/map"} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span>{t('viewAll')}</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading reports...</div>
        ) : recentReports.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '14px', fontSize: '14px' }}>{t('noReportsYet')}</p>
            <button onClick={onOpenReport} className="btn btn-sm btn-primary">
              <PlusCircle size={16} />
              <span>{t('reportProblem')}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
