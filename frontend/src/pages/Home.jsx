import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, Map, PhoneCall, CheckCircle2, Clock, AlertCircle, 
  Sparkles, ChevronRight, Zap, Droplets, Trash2, Lightbulb, 
  Car, Shield, Info, Building2, Bell, Compass, ArrowRight, UserCheck
} from 'lucide-react';
import WeatherWidget from '../components/WeatherWidget';
import NoticeBanner from '../components/NoticeBanner';
import ReportCard from '../components/ReportCard';
import { api } from '../services/api';

const QUICK_CATEGORIES = [
  { id: 'GARBAGE', label: 'Garbage Dump', icon: Trash2, color: '#059669', bg: '#ECFDF5' },
  { id: 'ROADS', label: 'Pothole & Roads', icon: Car, color: '#EA580C', bg: '#FFF7ED' },
  { id: 'ELECTRICAL_HAZARD', label: 'Electric Wire', icon: Zap, color: '#DC2626', bg: '#FEF2F2' },
  { id: 'WATER_LEAKAGE', label: 'Water Leak', icon: Droplets, color: '#0284C7', bg: '#F0F9FF' },
  { id: 'STREETLIGHT', label: 'Streetlight', icon: Lightbulb, color: '#D97706', bg: '#FFFBEB' },
  { id: 'WATERLOGGING', label: 'Waterlogging', icon: Compass, color: '#4F46E5', bg: '#EEF2FF' },
];

export default function Home({ onOpenReport }) {
  const { t, user, isCitizen, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeNotices, setActiveNotices] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [cityReports, setCityReports] = useState([]);
  const [activeTab, setActiveTab] = useState(isCitizen ? 'mine' : 'city');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [noticesRes, myReportsRes, cityReportsRes] = await Promise.all([
        api.getActiveNotices().catch(() => []),
        isAuthenticated && isCitizen ? api.getMyReports().catch(() => []) : Promise.resolve([]),
        api.getPublicMapReports().catch(() => [])
      ]);
      setActiveNotices(Array.isArray(noticesRes) ? noticesRes : []);
      setMyReports(Array.isArray(myReportsRes) ? myReportsRes : []);
      setCityReports(Array.isArray(cityReportsRes) ? cityReportsRes : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const myStats = {
    total: myReports.length,
    inProgress: myReports.filter(r => r.status === 'IN_PROGRESS' || r.status === 'ACKNOWLEDGED').length,
    resolved: myReports.filter(r => r.status === 'RESOLVED').length,
  };

  const displayedReports = activeTab === 'mine' && myReports.length > 0 
    ? myReports.slice(0, 4) 
    : cityReports.slice(0, 4);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── 1. Top Weather Widget (For Every Person) ────── */}
      <WeatherWidget />

      {/* ── 2. Personalized User Greeting (If Logged In) ── */}
      {isAuthenticated && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '14px 18px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E56B8 0%, #0B2A5B 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 800
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Namaste, {user?.name?.split(' ')[0] || 'Citizen'}! 👋
                </h3>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: isCitizen ? '#059669' : '#1E56B8',
                  fontWeight: 700
                }}>
                  <UserCheck size={12} />
                  {isCitizen ? 'Warangal Active Citizen' : (user?.departmentName || 'Civic Official')}
                </span>
                <span>•</span>
                <span>{user?.phone}</span>
              </div>
            </div>
          </div>

          {isCitizen && (
            <button
              onClick={onOpenReport}
              className="btn btn-sm btn-primary"
              style={{
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                height: '34px',
                gap: '4px'
              }}
            >
              <Camera size={14} />
              <span>Report</span>
            </button>
          )}
        </div>
      )}

      {/* ── 3. Active Emergency / Public Notices ────────── */}
      {activeNotices.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeNotices.map((notice) => (
            <NoticeBanner key={notice.id} notice={notice} />
          ))}
        </div>
      )}

      {/* ── 4. Hero CTA Banner ─────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0B2A5B 0%, #1E56B8 60%, #2563EB 100%)',
        borderRadius: '20px',
        padding: '24px 20px 20px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(11, 42, 91, 0.2)'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute', top: '-25px', right: '-25px',
          width: '130px', height: '130px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', right: '50px',
          width: '90px', height: '90px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(4px)',
          borderRadius: '100px', padding: '4px 12px',
          fontSize: '11px', fontWeight: 800, marginBottom: '12px',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          <Sparkles size={12} color="#FDE047" />
          Live Geo-Tag · AI Auto Routing · SLA Tracked
        </div>

        <h1 style={{ fontSize: '21px', fontWeight: 900, lineHeight: 1.25, marginBottom: '6px' }}>
          {t('reportProblem')}
        </h1>
        <p style={{ fontSize: '13px', opacity: 0.88, lineHeight: 1.45, marginBottom: '18px', maxWidth: '420px' }}>
          {t('reportSubtitle')}
        </p>

        <button
          id="btn-hero-report"
          onClick={onOpenReport}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: '#ffffff',
            color: '#0B2A5B',
            fontWeight: 800,
            fontSize: '15px',
            padding: '0 22px',
            height: '50px',
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
            transition: 'all 0.2s ease',
            width: '100%',
            maxWidth: '320px',
            justifyContent: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.22)'; }}
        >
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #1E56B8 0%, #0B2A5B 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={16} color="#fff" strokeWidth={2.5} />
          </div>
          {t('startCamera')}
        </button>
      </div>

      {/* ── 5. Quick Problem Category Shortcuts ────────── */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Quick Issue Reporting</span>
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tap to snap & report</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {QUICK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={onOpenReport}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 6px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--surface-alt)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = cat.color; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: cat.bg,
                  color: cat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '6px'
                }}>
                  <Icon size={20} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 6. Key Quick Actions Grid ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <Link
          to="/map"
          className="card card-hover"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Map size={20} color="#1E56B8" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>City Map</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cityReports.length} issues pinned</div>
          </div>
        </Link>

        <Link
          to="/contacts"
          className="card card-hover"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', textDecoration: 'none', color: 'inherit' }}
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <PhoneCall size={20} color="#DC2626" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>Emergency Helplines</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>100 · 108 · 1912</div>
          </div>
        </Link>
      </div>

      {/* ── 7. My Citizen Stats (if logged in citizen) ──── */}
      {isCitizen && myReports.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'My Reports', value: myStats.total, color: '#1E56B8', bg: '#EFF6FF' },
            { label: 'In Progress', value: myStats.inProgress, color: '#D97706', bg: '#FFFBEB' },
            { label: 'Resolved', value: myStats.resolved, color: '#059669', bg: '#ECFDF5' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: '12px 8px', backgroundColor: bg, border: `1px solid ${color}30` }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── 8. Onboarding Card (If 0 user reports) ──────── */}
      {isCitizen && myReports.length === 0 && !loading && (
        <div style={{
          backgroundColor: '#F0F9FF',
          border: '1.5px dashed #38BDF8',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#0284C7" />
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0369A1', margin: 0 }}>
              Welcome to Warangal 360 Citizen Portal
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#0F172A', lineHeight: 1.5, margin: 0 }}>
            Spot a civic problem in your ward? Take a quick photo. Our AI automatically classifies the issue, calculates severity, sets a strict municipal SLA deadline, and notifies the responsible department.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
            <button onClick={onOpenReport} className="btn btn-sm btn-primary" style={{ height: '36px', fontSize: '12px', borderRadius: '8px' }}>
              <Camera size={14} />
              <span>Submit Your First Report</span>
            </button>
            <Link to="/map" className="btn btn-sm btn-secondary" style={{ height: '36px', fontSize: '12px', borderRadius: '8px', textDecoration: 'none' }}>
              <Map size={14} />
              <span>Explore City Map</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── 9. Feed Section (Tabbed: My Reports / City Reports) */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '8px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isAuthenticated && isCitizen && myReports.length > 0 && (
              <button
                onClick={() => setActiveTab('mine')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: activeTab === 'mine' ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'mine' ? '2.5px solid var(--primary)' : 'none',
                  paddingBottom: '4px',
                  cursor: 'pointer'
                }}
              >
                My Reports ({myReports.length})
              </button>
            )}

            <button
              onClick={() => setActiveTab('city')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '14px',
                fontWeight: 800,
                color: activeTab === 'city' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'city' ? '2.5px solid var(--primary)' : 'none',
                paddingBottom: '4px',
                cursor: 'pointer'
              }}
            >
              Recent Issues in Warangal ({cityReports.length})
            </button>
          </div>

          <Link
            to={activeTab === 'mine' ? '/my-reports' : '/map'}
            style={{
              fontSize: '12px', fontWeight: 700, color: 'var(--primary)',
              display: 'flex', alignItems: 'center', gap: '2px',
              textDecoration: 'none'
            }}
          >
            <span>View all</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2].map(i => (
              <div key={i} className="card" style={{ padding: '16px' }}>
                <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '10px' }} />
                <div className="skeleton" style={{ height: '11px', width: '40%' }} />
              </div>
            ))}
          </div>
        ) : displayedReports.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {activeTab === 'mine' ? t('noReportsYet') : 'No civic issues reported yet.'}
            </p>
            <button onClick={onOpenReport} className="btn btn-sm btn-primary">
              <Camera size={14} />
              {t('reportProblem')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}

            <Link
              to={activeTab === 'mine' ? '/my-reports' : '/map'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '12px', borderRadius: '12px',
                border: '1.5px dashed var(--border)',
                color: 'var(--primary)', fontWeight: 700, fontSize: '13px', gap: '6px',
                textDecoration: 'none', backgroundColor: '#fff'
              }}
            >
              <span>Explore all {activeTab === 'mine' ? myReports.length : cityReports.length} reports</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}

