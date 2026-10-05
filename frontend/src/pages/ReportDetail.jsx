import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, ThumbsUp, ArrowLeft, Clock, ShieldCheck, Wrench, Layers, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityTag from '../components/PriorityTag';
import StatusTimeline from '../components/StatusTimeline';
import { api } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function ReportDetail() {
  const { id } = useParams();
  const { t, user, isCitizen } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upvotes, setUpvotes] = useState(0);
  const [isUpvoted, setIsUpvoted] = useState(false);

  // Reopen flow state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const [repData, histData] = await Promise.all([
        api.getReportDetail(id),
        api.getReportHistory(id)
      ]);
      setReport(repData);
      setUpvotes(repData?.upvotes || 0);
      setHistory(histData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await api.toggleUpvote(id);
      if (res) {
        setUpvotes(res.upvotes);
        setIsUpvoted(res.upvoted);
      }
    } catch {
      // ignore
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    try {
      setReopening(true);
      await api.reopenReport(id, reopenReason);
      setShowReopenModal(false);
      loadDetail();
    } catch (err) {
      alert(err.message || "Failed to reopen report");
    } finally {
      setReopening(false);
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/uploads/${url}`;
    return `${API_BASE_URL}${path}`;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading report #{id}...</div>;
  }

  if (!report) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Report #{id} not found</h3>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '14px' }}>Back Home</Link>
      </div>
    );
  }

  const isMyReport = user && report.user && report.user.id === user.id;

  // SLA deadline calculation
  const respDeadline = report.responseDeadline ? new Date(report.responseDeadline) : null;
  const isOverdue = report.escalationLevel && report.escalationLevel >= 1;

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-sm"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary)',
          padding: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* Main Detail Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: '20px' }}>
        {/* Photo with Watermark info */}
        <div style={{ position: 'relative', width: '100%', maxHeight: '400px', backgroundColor: '#000000', overflow: 'hidden' }}>
          <img
            src={getFullImageUrl(report.photoUrl)}
            alt={report.category}
            style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block' }}
          />

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(11, 42, 91, 0.88)',
            color: '#ffffff',
            padding: '8px 16px',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#93C5FD" />
              <span>{report.latitude?.toFixed(5)}°N, {report.longitude?.toFixed(5)}°E (±{Math.round(report.accuracy || 0)}m)</span>
            </span>
            <span style={{ opacity: 0.8, fontSize: '11px' }}>
              {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Info Content */}
        <div style={{ padding: '20px' }}>
          {/* Category & Status Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>
                {t(report.category)}
              </span>
              <PriorityTag score={report.priorityScore} isEmergency={report.isEmergency} />
            </div>

            <StatusBadge status={report.status} />
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            {report.aiSummary || report.description || 'Civic Issue'}
          </h2>

          {report.description && (
            <p style={{ fontSize: '14px', color: 'var(--text-main)', backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <strong>Citizen Note:</strong> {report.description}
            </p>
          )}

          {/* Location & Routing Tiles */}
          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#F1F5F9', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Address / Location</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{report.address || 'Warangal Locality'}</div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>Assigned Department</div>
              <div style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>{report.department?.name || 'Municipal Administration'}</div>
            </div>
          </div>

          {/* AI Estimate Box */}
          {report.aiCrewEstimate && (
            <div style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <Wrench size={18} />
              <div>
                <strong>{t('aiCrewEstimate')}:</strong> {report.aiCrewEstimate}
              </div>
            </div>
          )}

          {/* SLA Timer Chip */}
          {respDeadline && report.status !== 'RESOLVED' && report.status !== 'REJECTED' && (
            <div style={{
              backgroundColor: isOverdue ? '#FEE2E2' : '#EFF6FF',
              border: `1px solid ${isOverdue ? '#F87171' : '#BFDBFE'}`,
              color: isOverdue ? '#991B1B' : 'var(--primary)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <Clock size={16} />
                <span>{isOverdue ? 'Overdue SLA Escalation Active' : t('slaResponseDeadline')}:</span>
              </span>
              <span style={{ fontWeight: 700 }}>
                {respDeadline.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Actions: Upvote & Reopen Feedback */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleUpvote}
              className="btn btn-sm btn-secondary"
            >
              <ThumbsUp size={14} fill={isUpvoted ? 'currentColor' : 'none'} />
              <span>{upvotes} {t('upvotes')}</span>
            </button>

            {report.reportCount > 1 && (
              <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={14} />
                <span>{report.reportCount} {t('reportCount')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Citizen Resolution Feedback Prompt: "Is it really fixed?" */}
      {isMyReport && report.status === 'RESOLVED' && (
        <div className="card" style={{
          backgroundColor: '#F0FDF4',
          border: '2px solid #86EFAC',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
            {t('isReallyFixed')}
          </h4>
          <p style={{ fontSize: '13px', color: '#15803D', marginBottom: '14px' }}>
            Officials marked this issue resolved. If work is incomplete, you can reopen it immediately to restart the SLA clock.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => alert("Thank you for confirming resolution!")}
              className="btn btn-sm"
              style={{ backgroundColor: '#16A34A', color: '#ffffff' }}
            >
              <CheckCircle size={16} />
              <span>{t('yesFixed')}</span>
            </button>

            <button
              onClick={() => setShowReopenModal(true)}
              className="btn btn-sm btn-danger"
            >
              <RefreshCw size={16} />
              <span>{t('noReopen')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Status History Stepper */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary-dark)' }}>
          Status & Action History
        </h3>
        <StatusTimeline history={history} />
      </div>

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>
              {t('reopenReport')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Please describe what is still pending. This will notify the department head and restart the response deadline.
            </p>

            <form onSubmit={handleReopenSubmit}>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  required
                  rows={3}
                  placeholder="e.g., Only half of the pothole was filled, water is still leaking..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="btn btn-sm btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopening}
                  className="btn btn-sm btn-danger"
                >
                  {reopening ? 'Reopening...' : t('reopenReport')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
