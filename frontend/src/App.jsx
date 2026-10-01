import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CameraModal from './components/CameraModal';

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
  const { user } = useAuth();

  return (
    <div className="app-container">
      <Navbar onOpenReport={() => setIsCameraOpen(true)} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home onOpenReport={() => setIsCameraOpen(true)} />} />
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
                <MyReports onOpenReport={() => setIsCameraOpen(true)} />
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
      <BottomNav onOpenReport={() => setIsCameraOpen(true)} />

      {/* Global In-App Camera Reporting Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onSubmitted={() => {
          // Can refresh or redirect to my-reports
        }}
      />
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
