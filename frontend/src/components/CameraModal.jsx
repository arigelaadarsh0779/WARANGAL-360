import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, X, RefreshCw, MapPin, CheckCircle, AlertTriangle, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { api } from '../services/api';

export default function CameraModal({ isOpen, onClose, onSubmitted }) {
  const { t, language } = useAuth();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreview, setCapturedPreview] = useState(null);

  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [locError, setLocError] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(true);

  const [activeNoticeWarning, setActiveNoticeWarning] = useState(null);
  const [dismissedNoticeWarning, setDismissedNoticeWarning] = useState(false);

  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0); // 0: checking photo, 1: AI analyzing, 2: routing
  const [result, setResult] = useState(null); // { outcome, message, reportId, parentReportId, category, departmentName, rejectionReason }
  const [error, setError] = useState(null);

  // Initialize camera & location
  useEffect(() => {
    if (isOpen) {
      startCamera();
      fetchLocation();
    } else {
      stopCamera();
      resetState();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const resetState = () => {
    setCapturedBlob(null);
    setCapturedPreview(null);
    setCoords(null);
    setAccuracy(null);
    setLocError(null);
    setActiveNoticeWarning(null);
    setDismissedNoticeWarning(false);
    setDescription('');
    setSubmitting(false);
    setResult(null);
    setError(null);
  };

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please allow camera permissions in your browser.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const WARANGAL_ZONES = [
    { name: 'GWMC Warangal City Center', lat: 17.9689, lng: 79.5941 },
    { name: 'Hanamkonda Bus Station & Chowrasta', lat: 18.0050, lng: 79.5600 },
    { name: 'Kazipet Railway Junction & Town', lat: 17.9780, lng: 79.5200 },
    { name: 'Bhadrakali Temple & Lake Promenade', lat: 17.9950, lng: 79.5750 },
    { name: 'Warangal Fort & Khila Area', lat: 17.9570, lng: 79.6170 },
    { name: 'Kakatiya University / Naimnagar', lat: 18.0210, lng: 79.5530 },
  ];

  const [selectedZone, setSelectedZone] = useState(0);
  const [isUsingCustomZone, setIsUsingCustomZone] = useState(false);

  const fetchLocation = () => {
    setGettingLocation(true);
    setLocError(null);

    if (!navigator.geolocation) {
      applyDefaultWarangalLocation("Geolocation not supported by device. Applied Warangal Municipal Center coordinates.");
      return;
    }

    // Attempt 1: High accuracy with 4.5s timeout
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoordinates(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        console.warn("High-accuracy GPS attempt failed, falling back to network geolocation:", err.message);
        // Attempt 2: Standard low-power network location with 6s timeout
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            applyCoordinates(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy || 45);
          },
          (err2) => {
            console.warn("Standard GPS also unavailable, falling back to Warangal default:", err2.message);
            // Attempt 3: Friendly city default so the user is never blocked
            applyDefaultWarangalLocation("Weak GPS signal detected indoors. Set to Warangal Municipal Center (Tap 'Change Zone' if needed).");
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 4500, maximumAge: 10000 }
    );
  };

  const applyCoordinates = async (lat, lng, acc) => {
    setCoords({ lat, lng });
    setAccuracy(acc || 25);
    setGettingLocation(false);
    setIsUsingCustomZone(false);

    try {
      const notice = await api.checkNoticeAtLocation(lat, lng);
      if (notice) {
        setActiveNoticeWarning(notice);
      }
    } catch {
      // ignore
    }
  };

  const applyDefaultWarangalLocation = (msg) => {
    const defaultZone = WARANGAL_ZONES[0];
    setCoords({ lat: defaultZone.lat, lng: defaultZone.lng });
    setAccuracy(30);
    setGettingLocation(false);
    setLocError(msg);
  };

  const handleSelectZone = (index) => {
    const zone = WARANGAL_ZONES[index];
    setSelectedZone(index);
    setCoords({ lat: zone.lat, lng: zone.lng });
    setAccuracy(20);
    setIsUsingCustomZone(true);
    setLocError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !coords) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw visual stamp overlay (Dark strip with coordinates, address, timestamp)
    const stripHeight = Math.max(60, canvas.height * 0.12);
    ctx.fillStyle = 'rgba(11, 42, 91, 0.88)';
    ctx.fillRect(0, canvas.height - stripHeight, canvas.width, stripHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(13, Math.round(canvas.height * 0.025))}px sans-serif`;
    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const line1 = `WARANGAL 360 | ${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E (±${Math.round(accuracy || 25)}m)`;
    const line2 = `TIMESTAMP: ${nowStr} | GWMC CIVIC REPORT`;

    ctx.fillText(line1, 14, canvas.height - stripHeight + 22);
    ctx.font = `${Math.max(11, Math.round(canvas.height * 0.02))}px sans-serif`;
    ctx.fillText(line2, 14, canvas.height - stripHeight + 44);

    canvas.toBlob((blob) => {
      setCapturedBlob(blob);
      setCapturedPreview(canvas.toDataURL('image/jpeg', 0.85));
      stopCamera();
    }, 'image/jpeg', 0.85);
  };

  const retakePhoto = () => {
    setCapturedBlob(null);
    setCapturedPreview(null);
    setResult(null);
    setError(null);
    startCamera();
  };

  const handleSubmit = async () => {
    if (!capturedBlob || !coords) return;

    setSubmitting(true);
    setError(null);
    setStepIndex(0);

    const formData = new FormData();
    formData.append('photo', capturedBlob, 'live_report.jpg');
    formData.append('latitude', coords.lat.toString());
    formData.append('longitude', coords.lng.toString());
    if (accuracy) formData.append('accuracy', accuracy.toString());
    if (description) formData.append('description', description);

    // Step progression animation
    const timer1 = setTimeout(() => setStepIndex(1), 700);
    const timer2 = setTimeout(() => setStepIndex(2), 1500);

    try {
      const res = await api.submitReport(formData);
      clearTimeout(timer1);
      clearTimeout(timer2);
      setResult(res);
      if (onSubmitted) onSubmitted(res);
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', padding: '0', overflow: 'hidden' }}>
        {/* Drag handle (mobile bottom sheet indicator) */}
        <div className="modal-handle" />
        {/* Header */}
        <div style={{
          padding: '12px 18px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={17} color="#fff" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{t('captureTitle')}</h3>
          </div>
          <button
            onClick={onClose}
            style={{ width: '32px', height: '32px', border: 'none', background: 'var(--surface-alt)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px' }}>
          {/* Active Notice Pre-Warning Dialog */}
          {activeNoticeWarning && !dismissedNoticeWarning && (
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '2px solid #F59E0B',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B45309', fontWeight: 700, marginBottom: '6px' }}>
                <AlertTriangle size={18} />
                <span>Notice in your current locality:</span>
              </div>
              <p style={{ fontSize: '14px', color: '#78350F', marginBottom: '8px' }}>
                <strong>{activeNoticeWarning.title}</strong>: {activeNoticeWarning.messageEn}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={onClose}
                  className="btn btn-sm btn-secondary"
                >
                  Cancel Report
                </button>
                <button
                  onClick={() => setDismissedNoticeWarning(true)}
                  className="btn btn-sm btn-primary"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          )}

          {/* Result view */}
          {result ? (
            <div style={{ textAlign: 'center', padding: '20px 8px' }}>
              {result.outcome === 'CREATED' && (
                <div>
                  <div style={{ color: 'var(--status-resolved)', marginBottom: '12px' }}>
                    <CheckCircle size={56} style={{ margin: '0 auto' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    {language === 'te' ? result.messageTe : result.message}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Report ID: <strong>#{result.reportId}</strong> | Department: <strong>{result.departmentName}</strong>
                  </p>
                  <div style={{
                    backgroundColor: 'var(--primary-light)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    color: 'var(--primary-dark)',
                    marginBottom: '20px'
                  }}>
                    ✨ AI classified category: <strong>{t(result.category)}</strong> (Priority Score: {result.priorityScore})
                  </div>
                </div>
              )}

              {result.outcome === 'DUPLICATE_MERGED' && (
                <div>
                  <div style={{ color: 'var(--primary)', marginBottom: '12px' }}>
                    <Sparkles size={56} style={{ margin: '0 auto' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                    {language === 'te' ? result.messageTe : result.message}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    This duplicate has reinforced original Report #{result.parentReportId}. You will receive status notifications.
                  </p>
                </div>
              )}

              {result.outcome === 'REJECTED' && (
                <div>
                  <div style={{ color: 'var(--prio-emergency)', marginBottom: '12px' }}>
                    <ShieldAlert size={56} style={{ margin: '0 auto' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--prio-emergency)', marginBottom: '6px' }}>
                    {t('reportRejected')}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '20px' }}>
                    {result.rejectionReason || 'The captured image does not appear to show a valid civic hazard.'}
                  </p>
                </div>
              )}

              <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                Done
              </button>
            </div>
          ) : submitting ? (
            /* Submitting Stepper */
            <div style={{ padding: '30px 10px', textAlign: 'center' }}>
              <RefreshCw size={44} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 16px auto', animation: 'spin 1.5s linear infinite' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
                {t('analyzingPhoto')}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px', margin: '0 auto', textAlign: 'left' }}>
                <div style={{ fontSize: '13px', color: stepIndex >= 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: stepIndex === 0 ? 700 : 500 }}>
                  {stepIndex > 0 ? '✓' : '●'} 1. Checking image hash & GPS accuracy
                </div>
                <div style={{ fontSize: '13px', color: stepIndex >= 1 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: stepIndex === 1 ? 700 : 500 }}>
                  {stepIndex > 1 ? '✓' : '●'} 2. AI vision categorization & duplicate scan
                </div>
                <div style={{ fontSize: '13px', color: stepIndex >= 2 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: stepIndex === 2 ? 700 : 500 }}>
                  {stepIndex >= 2 ? '●' : '○'} 3. Priority scoring & municipal department routing
                </div>
              </div>
            </div>
          ) : (
            /* Camera Capture / Preview Form */
            <div>
              {error && (
                <div style={{
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  marginBottom: '12px'
                }}>
                  {error}
                </div>
              )}

              {/* Viewport: Live video or Captured preview */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '280px',
                backgroundColor: '#000000',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {capturedPreview ? (
                  <img
                    src={capturedPreview}
                    alt="Captured"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Live Watermark info bar on preview */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(11, 42, 91, 0.85)',
                      color: '#ffffff',
                      padding: '8px 12px',
                      fontSize: '11px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#93C5FD" />
                          {coords ? `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E` : t('gettingLocation')}
                        </span>
                        {accuracy && (
                          <span style={{ color: accuracy <= 50 ? '#86EFAC' : '#FDE047' }}>
                            {t('locationAccuracy')}: ±{Math.round(accuracy)}m
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', opacity: 0.8 }}>
                        Live Camera Verification • No Gallery Uploads
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* GPS info and Weak GPS Warangal Zone Selector */}
              <div style={{
                marginTop: '10px',
                padding: '10px 12px',
                backgroundColor: 'var(--surface-alt)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: 'var(--primary-dark)' }}>
                    <MapPin size={13} color="var(--primary)" />
                    <span>Location: {coords ? `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E (±${Math.round(accuracy || 25)}m)` : 'Acquiring GPS...'}</span>
                  </span>
                  {locError && (
                    <span style={{ fontSize: '10.5px', color: '#D97706', fontWeight: 600 }}>Indoor / City Default</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zone:</span>
                  <select
                    value={selectedZone}
                    onChange={(e) => handleSelectZone(parseInt(e.target.value, 10))}
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '11.5px',
                      backgroundColor: '#fff',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      cursor: 'pointer'
                    }}
                  >
                    {WARANGAL_ZONES.map((z, idx) => (
                      <option key={z.name} value={idx}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={fetchLocation}
                    title="Refresh GPS location"
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Refresh GPS
                  </button>
                </div>
              </div>

              {/* Capture or Submit Buttons */}
              <div style={{ marginTop: '14px' }}>
                {!capturedBlob ? (
                  <button
                    onClick={capturePhoto}
                    disabled={gettingLocation && !coords}
                    className="btn btn-primary"
                    style={{ width: '100%', height: '52px', fontSize: '16px', fontWeight: 800 }}
                  >
                    <Camera size={22} />
                    <span>{gettingLocation && !coords ? t('gettingLocation') : t('takePhoto')}</span>
                  </button>
                ) : (
                  <div>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder={t('describeIssue')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ minHeight: '60px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={retakePhoto}
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                      >
                        <RefreshCw size={18} />
                        <span>{t('retake')}</span>
                      </button>

                      <button
                        onClick={handleSubmit}
                        className="btn btn-primary"
                        style={{ flex: 2 }}
                      >
                        <Send size={18} />
                        <span>{t('submitReport')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
