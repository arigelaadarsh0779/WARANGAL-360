import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Eye, EyeOff, ArrowRight, ShieldCheck, Phone, Lock, User } from 'lucide-react';
import { api } from '../services/api';

const DEMO_ACCOUNTS = [
  { emoji: '👤', label: 'Citizen', phone: '+919876543210', pass: 'Citizen@123' },
  { emoji: '👑', label: 'Super Admin', phone: '+919999999999', pass: 'Admin@123' },
];

export default function Login() {
  const { t, loginUser } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // per-field validation errors

  // First-time password change flow
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempOldPassword, setTempOldPassword] = useState('');

  // Demo accordion
  const [showDemo, setShowDemo] = useState(false);

  const redirectByRole = (role) => {
    if (role === 'ROLE_ADMIN') navigate('/admin');
    else if (role === 'ROLE_DEPT_HEAD') navigate('/dept-head');
    else if (role === 'ROLE_OFFICIAL') navigate('/official');
    else navigate('/');
  };

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
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await api.register(name, phone, password);
      loginUser(res);
      navigate('/');
    } catch (err) {
      // If the error has per-field info, populate field highlights
      if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.changePassword(tempOldPassword, newPassword);
      setMustChangePassword(false);
      const user = JSON.parse(localStorage.getItem('w360_user') || '{}');
      redirectByRole(user.role);
    } catch (err) {
      setError(err.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - var(--navbar-height))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '62px', height: '62px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(30,86,184,0.35)',
          }}>
            <MapPin size={30} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: '-0.3px' }}>
            {t('appName')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{t('tagline')}</p>
        </div>

        {/* Card */}
        <div className="card card-bordered" style={{ padding: '24px' }}>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              color: '#B91C1C', borderRadius: '10px',
              padding: '10px 14px', fontSize: '13px', marginBottom: '16px',
              display: 'flex', alignItems: 'flex-start', gap: '8px'
            }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
            </div>
          )}

          {/* ── Password Change Screen ── */}
          {mustChangePassword ? (
            <form onSubmit={handleChangePassword}>
              <div style={{
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                borderRadius: '10px', padding: '12px 14px',
                marginBottom: '20px', fontSize: '13px', color: 'var(--primary-dark)',
                display: 'flex', gap: '8px', alignItems: 'flex-start'
              }}>
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{t('firstLoginPasswordChange')}</span>
              </div>

              <div className="form-group">
                <label className="form-label">{t('newPassword')}</label>
                <input type="password" className="form-input" required
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('confirmPassword')}</label>
                <input type="password" className="form-input" required
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password" />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-full">
                {loading ? <span className="spinner" /> : t('updatePassword')}
              </button>
            </form>

          ) : (
            <>
              {/* ── Tabs ── */}
              <div style={{
                display: 'flex', borderRadius: '10px',
                background: 'var(--surface-alt)', padding: '4px',
                marginBottom: '20px',
              }}>
                {['login', 'register'].map(tabKey => (
                  <button
                    key={tabKey}
                    id={`btn-tab-${tabKey}`}
                    onClick={() => { setTab(tabKey); setError(null); setFieldErrors({}); }}
                    style={{
                      flex: 1, height: '36px', border: 'none', cursor: 'pointer',
                      borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                      background: tab === tabKey ? '#fff' : 'transparent',
                      color: tab === tabKey ? 'var(--primary-dark)' : 'var(--text-muted)',
                      boxShadow: tab === tabKey ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    {tabKey === 'login' ? t('login') : t('register')}
                  </button>
                ))}
              </div>

              {/* ── Login Form ── */}
              {tab === 'login' ? (
                <form id="form-login" onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} color="var(--text-muted)" style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)'
                      }} />
                      <input
                        id="input-login-phone"
                        type="tel"
                        className="form-input"
                        required
                        placeholder="9876543210"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        style={{ paddingLeft: '42px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('password')}</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} color="var(--text-muted)" style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)'
                      }} />
                      <input
                        id="input-login-password"
                        type={showPass ? 'text' : 'password'}
                        className="form-input"
                        required
                        placeholder="Your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ paddingLeft: '42px', paddingRight: '42px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                        }}
                        aria-label="Toggle password visibility"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button id="btn-login-submit" type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: '4px' }}>
                    {loading ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : (
                      <><span>{t('login')}</span><ArrowRight size={17} /></>
                    )}
                  </button>

                  {/* ── Demo Accounts ── */}
                  <div style={{ marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setShowDemo(!showDemo)}
                      style={{
                        width: '100%', background: 'var(--surface-alt)',
                        border: '1px solid var(--border)', borderRadius: '8px',
                        padding: '9px 14px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)'
                      }}
                    >
                      <span>🔑 Demo accounts (one-click fill)</span>
                      <span style={{ fontSize: '16px', lineHeight: 1 }}>{showDemo ? '−' : '+'}</span>
                    </button>

                    {showDemo && (
                      <div style={{
                        marginTop: '8px', borderRadius: '8px',
                        border: '1px solid var(--border)', overflow: 'hidden',
                      }}>
                        {DEMO_ACCOUNTS.map(({ emoji, label, phone: p, pass }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => { setPhone(p); setPassword(pass); setShowDemo(false); }}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', padding: '10px 14px',
                              background: '#fff', border: 'none', borderBottom: '1px solid var(--border-light)',
                              cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)',
                              textAlign: 'left', transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >
                            <span style={{ fontWeight: 600 }}>{emoji} {label}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Tap to fill →</span>
                          </button>
                        ))}
                        <div style={{ padding: '8px 12px', background: '#F8FAFC', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          💡 <em>L0 Officers and L1 Dept Heads are created manually in Super Admin with assigned passwords.</em>
                        </div>
                      </div>
                    )}
                  </div>
                </form>

              ) : (
                /* ── Register Form ── */
                <form id="form-register" onSubmit={handleRegister}>

                  {/* Name field */}
                  <div className="form-group">
                    <label className="form-label">{t('fullName')}</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color={fieldErrors.name ? '#DC2626' : 'var(--text-muted)'} style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)'
                      }} />
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="Your full name (2–50 characters)"
                        value={name}
                        onChange={e => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: undefined })); }}
                        style={{
                          paddingLeft: '42px',
                          borderColor: fieldErrors.name ? '#DC2626' : undefined,
                          background: fieldErrors.name ? '#FEF2F2' : undefined,
                        }}
                      />
                    </div>
                    {fieldErrors.name && (
                      <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        ❌ {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Phone field */}
                  <div className="form-group">
                    <label className="form-label">Phone Number <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(used as your login ID)</span></label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} color={fieldErrors.phone ? '#DC2626' : 'var(--text-muted)'} style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)'
                      }} />
                      <input
                        type="tel"
                        className="form-input"
                        required
                        placeholder="10-digit Indian number (e.g. 9876543210)"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setFieldErrors(prev => ({ ...prev, phone: undefined })); }}
                        style={{
                          paddingLeft: '42px',
                          borderColor: fieldErrors.phone ? '#DC2626' : undefined,
                          background: fieldErrors.phone ? '#FEF2F2' : undefined,
                        }}
                      />
                    </div>
                    {fieldErrors.phone ? (
                      <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>❌ {fieldErrors.phone}</p>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>ℹ️ Enter a valid 10-digit Indian mobile number (6–9 series)</p>
                    )}
                  </div>

                  {/* Password field */}
                  <div className="form-group">
                    <label className="form-label">{t('password')}</label>
                    <input
                      type="password"
                      className="form-input"
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })); }}
                      style={{
                        borderColor: fieldErrors.password ? '#DC2626' : undefined,
                        background: fieldErrors.password ? '#FEF2F2' : undefined,
                      }}
                    />
                    {fieldErrors.password && (
                      <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>❌ {fieldErrors.password}</p>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-primary btn-full">
                    {loading ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : (
                      <><span>{t('createAccount')}</span><ArrowRight size={17} /></>
                    )}
                  </button>

                  {/* Field requirement hints */}
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--surface-alt)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--text-main)' }}>Requirements:</strong><br />
                    ✔ Name: 2–50 characters<br />
                    ✔ Phone: valid 10-digit Indian number (starts with 6, 7, 8 or 9)<br />
                    ✔ Password: minimum 6 characters
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
          Greater Warangal Municipal Corporation · Smart City Initiative
        </p>
      </div>
    </div>
  );
}
