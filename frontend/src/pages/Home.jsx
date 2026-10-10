import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Camera, Map, PhoneCall, CheckCircle2, Clock, AlertCircle, 
  Sparkles, ChevronRight, Zap, Droplets, Trash2, Lightbulb, 
  Car, Shield, Info, Building2, Bell, Compass, ArrowRight, UserCheck,
  Flame, Phone, HeartPulse
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

const WARANGAL_LANDMARKS = [
  {
    id: 'thoranam',
    title: 'Kakatiya Kala Thoranam',
    teluguTitle: 'కాకతీయ కళాతోరణం',
    category: 'Historic Landmark',
    image: '/images/warangal_hero.jpg',
    desc: 'Iconic 12th-century triumphal arch & official emblem of Telangana.',
  },
  {
    id: 'thousand_pillars',
    title: 'Thousand Pillar Temple',
    teluguTitle: 'వేయి స్తంభాల గుడి',
    category: '12th C. Architectural Marvel',
    image: '/images/thousand_pillars.jpg',
    desc: 'Ancient Rudreshwara Swamy temple in Hanamkonda with monolithic Nandi.',
  },
  {
    id: 'bhadrakali',
    title: 'Bhadrakali Lake Promenade',
    teluguTitle: 'భద్రకాళి బండ్ & గుడి',
    category: 'Civic Waterfront & Shrine',
    image: '/images/bhadrakali_lake.jpg',
    desc: 'Scenic waterfront lake promenade and sacred Chalukya-Kakatiya shrine.',
  },
  {
    id: 'fort',
    title: 'Warangal Fort (Khila)',
    teluguTitle: 'ఖిలా వరంగల్',
    category: 'Medieval Citadel',
    image: '/images/warangal_fort.jpg',
    desc: 'Grand ruins of the medieval Kakatiya kingdom capital citadel.',
  },
];

export default function Home({ onOpenReport }) {
  const { t, user, isCitizen, isAuthenticated, language } = useAuth();
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
    ? myReports.slice(0, 6) 
    : cityReports.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* ── 1. Full-Bleed Immersive Warangal Hero Header ── */}
      <div style={{
        position: 'relative',
        borderRadius: '24px',
        overflow: 'hidden',
        minHeight: '340px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 24px',
        backgroundImage: `linear-gradient(135deg, rgba(11, 42, 91, 0.94) 0%, rgba(30, 86, 184, 0.84) 55%, rgba(15, 23, 42, 0.95) 100%), url('/images/warangal_hero.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
        boxShadow: '0 12px 36px rgba(11, 42, 91, 0.35)',
        border: '1.5px solid rgba(56, 189, 248, 0.35)',
        color: '#ffffff'
      }}>
        {/* Background glow circle */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-40px',
          width: '260px', height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Top Header Badge Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '100px', padding: '6px 14px',
            fontSize: '11px', fontWeight: 800,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <Sparkles size={13} color="#FDE047" />
            Greater Warangal Municipal Corporation (GWMC)
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(11, 42, 91, 0.7)',
            backdropFilter: 'blur(6px)',
            borderRadius: '100px', padding: '5px 12px',
            fontSize: '11px', fontWeight: 700,
            border: '1px solid rgba(56, 189, 248, 0.4)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }} />
            24x7 Civic Control Room Active
          </div>
        </div>

        {/* Hero Title & Identity with Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '20px 0', flexWrap: 'wrap', zIndex: 1 }}>
          <img
            src="/images/warangal_logo.jpg"
            alt="Warangal 360 Official Emblem"
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '20px',
              objectFit: 'cover',
              border: '2px solid rgba(56, 189, 248, 0.8)',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.45)',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, lineHeight: 1.15, margin: 0, letterSpacing: '-0.5px' }}>
              WARANGAL 360
            </h1>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#38BDF8', marginTop: '4px' }}>
              {language === 'te' ? 'గ్రేటర్ వరంగల్ స్మార్ట్ పౌర సేవా పోర్టల్' : 'Greater Warangal Smart Civic Engagement Portal'}
            </div>
            <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.45, marginTop: '6px', maxWidth: '620px' }}>
              {language === 'te'
                ? 'వరంగల్, హనుమకొండ మరియు కాజీపేట అంతటా సమస్యలను ఫోటో తీసి నివేదించండి. AI ఆటో-రూటింగ్ & మున్సిపల్ SLA సమయపరిమితిలో పరిష్కారం.'
                : 'Spot potholes, garbage, streetlights, or water leaks across Warangal, Hanamkonda & Kazipet. Snap a photo with GPS for strict SLA municipal resolution.'}
            </p>
          </div>
        </div>

        {/* Hero Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', zIndex: 1 }}>
          <button
            id="btn-hero-report"
            onClick={onOpenReport}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: '#ffffff',
              color: '#0B2A5B',
              fontWeight: 800,
              fontSize: '15px',
              padding: '0 24px',
              height: '50px',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.38)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #1E56B8 0%, #0B2A5B 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <span>{language === 'te' ? 'ఫోటో తీసి నివేదించండి (Report)' : 'Snap & Report Civic Issue'}</span>
          </button>

          <Link
            to="/map"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              padding: '0 20px',
              height: '50px',
              borderRadius: '14px',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'; e.currentTarget.style.transform = ''; }}
          >
            <Map size={16} />
            <span>{language === 'te' ? 'లైవ్ సిటీ మ్యాప్' : 'Explore Live City Map'}</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Responsive 2-Column Content Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>

        {/* ── LEFT / MAIN DASHBOARD COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Top Weather & Air Quality */}
          <WeatherWidget />

          {/* User Personalized Greeting (If Logged In) */}
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
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1E56B8 0%, #0B2A5B 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px',
                  fontWeight: 800
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Namaste, {user?.name?.split(' ')[0] || 'Citizen'}! 👋
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: isCitizen ? '#059669' : '#1E56B8', fontWeight: 700 }}>
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
                  style={{ borderRadius: '9999px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, height: '34px', gap: '4px' }}
                >
                  <Camera size={14} />
                  <span>Report</span>
                </button>
              )}
            </div>
          )}

          {/* Active Public / Emergency Notices */}
          {activeNotices.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeNotices.map((notice) => (
                <NoticeBanner key={notice.id} notice={notice} />
              ))}
            </div>
          )}

          {/* Quick Problem Category Grid */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '16px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {language === 'te' ? 'త్వరిత సమస్యల ఎంపిక' : 'Quick Category Reporting'}
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

          {/* Citizen Stats */}
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

          {/* Feed Section: Tabbed My Reports / City Reports */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '16px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '8px'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
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
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  {activeTab === 'mine' ? t('noReportsYet') : 'No active civic issues reported yet.'}
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
                    textDecoration: 'none', backgroundColor: '#F8FAFD'
                  }}
                >
                  <span>Explore all {activeTab === 'mine' ? myReports.length : cityReports.length} reports</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT / WARANGAL CIVIC SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Warangal Heritage Landmark Cards */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '18px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '17px' }}>🏛️</span>
                  <h2 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--primary-dark)', margin: 0 }}>
                    {language === 'te' ? 'వరంగల్ వారసత్వ సంపద & పౌర సంరక్షణ' : 'Warangal Heritage & Civic Pride'}
                  </h2>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {language === 'te' ? 'మన చారిత్రక ఓరుగల్లు నగర సంరక్షణ మనందరి బాధ్యత' : 'Preserving the historic glory of Orugallu with smart civic care'}
                </p>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: 800, color: 'var(--primary)',
                background: 'var(--primary-light)', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase'
              }}>
                GWMC Zones
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {WARANGAL_LANDMARKS.map((lm) => (
                <div
                  key={lm.id}
                  style={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--surface-alt)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(11,42,91,0.04)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(11,42,91,0.04)'; }}
                >
                  <div style={{ position: 'relative', height: '115px', overflow: 'hidden' }}>
                    <img
                      src={lm.image}
                      alt={lm.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(11,42,91,0.88) 0%, rgba(11,42,91,0.15) 60%, transparent 100%)'
                    }} />
                    <span style={{
                      position: 'absolute', bottom: '6px', left: '8px',
                      fontSize: '9.5px', fontWeight: 800, color: '#fff',
                      background: 'rgba(30, 86, 184, 0.9)', padding: '2px 6px', borderRadius: '4px',
                      backdropFilter: 'blur(4px)', textTransform: 'uppercase'
                    }}>
                      {lm.category}
                    </span>
                  </div>
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                      {language === 'te' ? lm.teluguTitle : lm.title}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                      {lm.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GWMC 24x7 Control Room & Helplines Box */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '18px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#FEF2F2', color: '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <PhoneCall size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  GWMC 24x7 Emergency Helplines
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Direct municipal & emergency dial</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href="tel:18004251980"
                style={{
                  padding: '10px 12px', borderRadius: '10px', border: '1px solid #BFDBFE',
                  backgroundColor: '#EFF6FF', textDecoration: 'none', color: '#1E40AF',
                  display: 'flex', flexDirection: 'column', gap: '2px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#3B82F6' }}>GWMC Toll Free</span>
                <span style={{ fontSize: '13px', fontWeight: 900 }}>1800-425-1980</span>
              </a>

              <a
                href="tel:100"
                style={{
                  padding: '10px 12px', borderRadius: '10px', border: '1px solid #FECACA',
                  backgroundColor: '#FEF2F2', textDecoration: 'none', color: '#991B1B',
                  display: 'flex', flexDirection: 'column', gap: '2px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444' }}>Warangal Police</span>
                <span style={{ fontSize: '13px', fontWeight: 900 }}>100</span>
              </a>

              <a
                href="tel:108"
                style={{
                  padding: '10px 12px', borderRadius: '10px', border: '1px solid #FED7AA',
                  backgroundColor: '#FFF7ED', textDecoration: 'none', color: '#9A3412',
                  display: 'flex', flexDirection: 'column', gap: '2px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#F97316' }}>Ambulance</span>
                <span style={{ fontSize: '13px', fontWeight: 900 }}>108</span>
              </a>

              <a
                href="tel:1912"
                style={{
                  padding: '10px 12px', borderRadius: '10px', border: '1px solid #FEF08A',
                  backgroundColor: '#FEFCE8', textDecoration: 'none', color: '#854D0E',
                  display: 'flex', flexDirection: 'column', gap: '2px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#EAB308' }}>Electricity TSNPDCL</span>
                <span style={{ fontSize: '13px', fontWeight: 900 }}>1912</span>
              </a>
            </div>

            <Link
              to="/contacts"
              style={{
                marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: 'var(--primary)', gap: '4px', textDecoration: 'none'
              }}
            >
              <span>View complete municipal directory</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Live City Map Preview Card */}
          <Link
            to="/map"
            style={{
              display: 'block',
              borderRadius: '18px',
              overflow: 'hidden',
              position: 'relative',
              textDecoration: 'none',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            <div style={{ height: '140px', position: 'relative', overflow: 'hidden', background: '#0B2A5B' }}>
              <img
                src="/images/warangal_fort.jpg"
                alt="Warangal Map Background"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#fff', textAlign: 'center', padding: '16px'
              }}>
                <Map size={32} color="#38BDF8" style={{ marginBottom: '6px' }} />
                <span style={{ fontSize: '15px', fontWeight: 900 }}>Interactive Warangal Map</span>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>{cityReports.length} Active Ward Issues Pinned</span>
              </div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>Open Full City Map View</span>
              <ArrowRight size={16} color="var(--primary)" />
            </div>
          </Link>

        </div>

      </div>

    </div>
  );
}
