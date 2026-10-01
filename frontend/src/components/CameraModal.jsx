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

  const fetchLocation = () => {
    setGettingLocation(true);
    setLocError(null);

    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;
        setCoords({ lat, lng });
        setAccuracy(acc);
        setGettingLocation(false);

        // Check if active notice covers this location
        try {
          const notice = await api.checkNoticeAtLocation(lat, lng);
          if (notice) {
            setActiveNoticeWarning(notice);
          }
        } catch {
          // ignore
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setLocError("Location permission is mandatory to submit civic reports. Please enable GPS.");
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
    ctx.fillStyle = 'rgba(11, 42, 91, 0.85)';
    ctx.fillRect(0, canvas.height - stripHeight, canvas.width, stripHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(14, Math.round(canvas.height * 0.025))}px sans-serif`;
    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const line1 = `WARANGAL 360 | LAT: ${coords.lat.toFixed(5)}° N, LNG: ${coords.lng.toFixed(5)}° E (±${Math.round(accuracy || 0)}m)`;
    const line2 = `TIMESTAMP: ${nowStr} | MUNICIPAL CIVIC RECORD`;

    ctx.fillText(line1, 16, canvas.height - stripHeight + 24);
    ctx.font = `${Math.max(12, Math.round(canvas.height * 0.02))}px sans-serif`;
    ctx.fillText(line2, 16, canvas.height - stripHeight + 48);

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
        {/* Header */}
        <div style={{
          backgroundColor: 'var(--primary-dark)',
          color: '#ffffff',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="#93C5FD" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{t('captureTitle')}</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
          >
            <X size={22} />
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

              {/* GPS warning if accuracy is weak */}
              {accuracy > 100 && (
                <div style={{ color: 'var(--prio-high)', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} />
                  <span>{t('locationPoorWarning')}</span>
                </div>
              )}

              {/* Capture or Submit Buttons */}
              <div style={{ marginTop: '16px' }}>
                {!capturedBlob ? (
                  <button
                    onClick={capturePhoto}
                    disabled={gettingLocation || !coords || (accuracy && accuracy > 100)}
                    className="btn btn-primary"
                    style={{ width: '100%', height: '52px', fontSize: '16px' }}
                  >
                    <Camera size={22} />
                    <span>{gettingLocation ? t('gettingLocation') : t('takePhoto')}</span>
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
