import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, ThumbsUp, Layers, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityTag from './PriorityTag';
import { api } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function ReportCard({ report, onUpvoted }) {
  const { t } = useAuth();
  const [upvotes, setUpvotes] = useState(report.upvotes || 0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [loadingUpvote, setLoadingUpvote] = useState(false);

  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setLoadingUpvote(true);
      const res = await api.toggleUpvote(report.id);
      if (res) {
        setUpvotes(res.upvotes);
        setIsUpvoted(res.upvoted);
        if (onUpvoted) onUpvoted(report.id, res.upvotes);
      }
    } catch {
      // ignore
    } finally {
      setLoadingUpvote(false);
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Ensure path always starts with /uploads/ (handles legacy bare filenames)
    const path = url.startsWith('/') ? url : `/uploads/${url}`;
    return `${API_BASE_URL}${path}`;
  };

  const formattedDate = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Link to={`/reports/${report.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card card-hover" style={{ display: 'flex', gap: '14px', position: 'relative' }}>
        {/* Photo Thumbnail */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: '#E2E8F0',
          flexShrink: 0,
          position: 'relative'
        }}>
          <img
            src={getFullImageUrl(report.photoUrl)}
            alt={report.category}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=300';
            }}
          />
          {report.isEmergency && (
            <div style={{
              position: 'absolute',
              top: '4px',
              left: '4px',
              backgroundColor: 'var(--prio-emergency)',
              color: '#ffffff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={12} />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                {t(report.category)}
              </span>
              <StatusBadge status={report.status} />
            </div>

            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-main)',
              lineHeight: 1.3,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {report.aiSummary || report.description || 'Civic issue in Warangal'}
            </h3>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {report.address || 'Warangal'}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px solid var(--border)',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PriorityTag score={report.priorityScore} isEmergency={report.isEmergency} />

              {report.reportCount > 1 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--primary)', fontWeight: 600 }}>
                  <Layers size={12} />
                  <span>{report.reportCount} {t('reportCount')}</span>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleUpvote}
                disabled={loadingUpvote}
                style={{
                  background: isUpvoted ? 'var(--primary-light)' : 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  color: isUpvoted ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}
              >
                <ThumbsUp size={11} fill={isUpvoted ? 'currentColor' : 'none'} />
                <span>{upvotes}</span>
              </button>

              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
