import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Lock, Phone, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Login() {
  const { t, loginUser } = useAuth();
  const navigate = useNavigate();

  const [isRegisterTab, setIsRegisterTab] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // First time password change state
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempOldPassword, setTempOldPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(phone, password);
      loginUser(res);

      if (res.mustChangePassword) {
        setMustChangePassword(true);
        setTempOldPassword(password);
      } else {
        redirectByRole(res.role);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.register(name, phone, password);
      loginUser(res);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(tempOldPassword, newPassword);
      setMustChangePassword(false);
      // Navigate to respective dashboard
      const user = JSON.parse(localStorage.getItem('w360_user') || '{}');
      redirectByRole(user.role);
    } catch (err) {
      setError(err.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    if (role === 'ROLE_ADMIN') {
      navigate('/admin');
    } else if (role === 'ROLE_DEPT_HEAD') {
      navigate('/dept-head');
    } else if (role === 'ROLE_OFFICIAL') {
      navigate('/official');
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{
      maxWidth: '440px',
      margin: '20px auto',
      padding: '24px 20px',
      backgroundColor: '#ffffff',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border)'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px auto'
        }}>
          <MapPin size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary-dark)', letterSpacing: '0.5px' }}>
          {t('appName')}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {t('tagline')}
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          color: '#B91C1C',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {mustChangePassword ? (
        /* First Login Password Change Modal */
        <form onSubmit={handleChangePasswordSubmit}>
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'var(--primary-dark)'
          }}>
            <ShieldCheck size={18} style={{ display: 'inline', marginRight: '6px' }} />
            {t('firstLoginPasswordChange')}
          </div>

          <div className="form-group">
            <label className="form-label">{t('newPassword')}</label>
            <input
              type="password"
              className="form-input"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('confirmPassword')}</label>
            <input
              type="password"
              className="form-input"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            {loading ? 'Updating...' : t('updatePassword')}
          </button>
        </form>
      ) : (
        /* Standard Tabs: Login / Register */
        <div>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => { setIsRegisterTab(false); setError(null); }}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: !isRegisterTab ? '2px solid var(--primary)' : '2px solid transparent',
                color: !isRegisterTab ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {t('login')}
            </button>
            <button
              onClick={() => { setIsRegisterTab(true); setError(null); }}
              style={{
                flex: 1,
                padding: '10px',
                background: 'none',
                border: 'none',
                borderBottom: isRegisterTab ? '2px solid var(--primary)' : '2px solid transparent',
                color: isRegisterTab ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {t('register')}
            </button>
          </div>

          {!isRegisterTab ? (
            /* Login Form */
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Phone Number / ఫోన్ నంబర్</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    placeholder="9876543210 or +919876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                <span>{loading ? 'Logging in...' : t('login')}</span>
                <ArrowRight size={18} />
              </button>

              {/* Demo Credentials Quick-Fill helper */}
              <div style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px dashed var(--border)',
                fontSize: '12px',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--primary)' }}>
                  Demo Accounts (One-Click Auto-Fill):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => { setPhone('+919876543210'); setPassword('Citizen@123'); }}
                    style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px' }}
                  >
                    👤 Citizen: <strong>9876543210</strong> (Pass: Citizen@123)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhone('+919888811001'); setPassword('Warangal@123'); }}
                    style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px' }}
                  >
                    🛠️ Official (Sanitation): <strong>9888811001</strong> (Pass: Warangal@123)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhone('+919888800001'); setPassword('Warangal@123'); }}
                    style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px' }}
                  >
                    🏛️ Dept Head (Sanitation): <strong>9888800001</strong> (Pass: Warangal@123)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhone('+919999999999'); setPassword('Admin@123'); }}
                    style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px' }}
                  >
                    👑 Municipal Admin: <strong>9999999999</strong> (Pass: Admin@123)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Citizen Registration Form */
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">{t('fullName')}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('phonePlaceholder')}</label>
                <input
                  type="tel"
                  className="form-input"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Your phone number acts as your citizen ID.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px' }}
              >
                <span>{loading ? 'Creating account...' : t('createAccount')}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
