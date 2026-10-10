import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CameraModal from './components/CameraModal';
import ChatbotWidget from './components/ChatbotWidget';
import { Camera, LogIn, X, AlertTriangle } from 'lucide-react';
import { api } from './services/api';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import MyReports from './pages/MyReports';
import ReportDetail from './pages/ReportDetail';
import PublicMap from './pages/PublicMap';
import NoticesPage from './pages/NoticesPage';
import EmergencyContacts from './pages/EmergencyContacts';
import OfficialDashboard from './pages/OfficialDashboard';
import DeptHeadDashboard from './pages/DeptHeadDashboard';
import AdminPanel from './pages/AdminPanel';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainLayout() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = user?.preferredLanguage || 'en';

  // Gate camera access — guests see a "please login" prompt
  const handleOpenReport = () => {
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      setIsCameraOpen(true);
    }
  };

  const [emergencyNotices, setEmergencyNotices] = useState([]);

  React.useEffect(() => {
    // Poll for active emergency notices
    const fetchNotices = async () => {
      try {
        const notices = await api.getActiveNotices();
        if (notices) {
          setEmergencyNotices(notices.filter(n => n.type === 'EMERGENCY'));
        }
      } catch (err) {
        // ignore
      }
    };
    fetchNotices();
    const interval = setInterval(fetchNotices, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {emergencyNotices.length > 0 && (
        <div style={{
          backgroundColor: '#DC2626',
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 9999,
          position: 'sticky',
          top: 0
        }}>
          {emergencyNotices.map(notice => (
            <div key={notice.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>EMERGENCY: {notice.title}</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>{notice.messageEn}</div>
              </div>
              <button 
                onClick={() => setEmergencyNotices(prev => prev.filter(n => n.id !== notice.id))}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <Navbar onOpenReport={handleOpenReport} />
      <ChatbotWidget lang={lang} />

      <main className="main-content page-enter">
        <Routes>
          <Route path="/" element={<Home onOpenReport={handleOpenReport} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/map" element={<PublicMap />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/contacts" element={<EmergencyContacts />} />
          <Route path="/reports/:id" element={<ReportDetail />} />

          {/* Protected routes */}
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute allowedRoles={['ROLE_CITIZEN', 'ROLE_OFFICIAL', 'ROLE_DEPT_HEAD', 'ROLE_ADMIN']}>
                <MyReports onOpenReport={handleOpenReport} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/official"
            element={
              <ProtectedRoute allowedRoles={['ROLE_OFFICIAL', 'ROLE_DEPT_HEAD', 'ROLE_ADMIN']}>
                <OfficialDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dept-head"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DEPT_HEAD', 'ROLE_ADMIN']}>
                <DeptHeadDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile-first bottom navigation bar */}
      <BottomNav onOpenReport={handleOpenReport} />

      {/* Global In-App Camera Reporting Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onSubmitted={() => {
          // Can refresh or redirect to my-reports
        }}
      />

      {/* Login Required Prompt — shown when unauthenticated users try to report */}
      {showLoginPrompt && (
        <div
          onClick={() => setShowLoginPrompt(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px', padding: '32px 24px',
              maxWidth: '360px', width: '100%', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'modalSlideUp 0.25s ease',
              position: 'relative',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setShowLoginPrompt(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'var(--surface-alt)', border: 'none',
                borderRadius: '8px', width: '32px', height: '32px',
                cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #0B2A5B 0%, #1E56B8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(30,86,184,0.35)',
            }}>
              <Camera size={30} color="#fff" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '8px' }}>
              Login to Report an Issue
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '24px' }}>
              Only registered citizens can capture and submit civic issues.
              Create a free account in under 30 seconds!
            </p>

            <button
              id="btn-login-prompt-go"
              onClick={() => { setShowLoginPrompt(false); navigate('/login'); }}
              style={{
                width: '100%', height: '48px',
                background: 'linear-gradient(135deg, #1E56B8, #0B2A5B)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '10px',
                boxShadow: '0 4px 16px rgba(30,86,184,0.35)',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <LogIn size={18} /> Login / Register
            </button>

            <button
              onClick={() => setShowLoginPrompt(false)}
              style={{
                width: '100%', height: '40px', background: 'none',
                border: '1.5px solid var(--border)', borderRadius: '10px',
                color: 'var(--text-muted)', fontWeight: 600, fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}
