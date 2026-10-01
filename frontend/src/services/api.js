const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('w360_token');
  const headers = options.headers || {};

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default content-type is json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Unauthorized: clear storage if not a login request
      if (!endpoint.includes('/api/auth/login')) {
        localStorage.removeItem('w360_token');
        localStorage.removeItem('w360_user');
      }
    }

    const data = await response.json();
    if (!response.ok || (data && data.success === false)) {
      const errorMsg = (data && data.message) || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data.data !== undefined ? data.data : data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth
  login: (phone, password) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  register: (name, phone, password, preferredLanguage) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password, preferredLanguage }),
    }),

  changePassword: (oldPassword, newPassword) =>
    apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  updateLanguage: (language) =>
    apiRequest('/api/auth/preference/language', {
      method: 'POST',
      body: JSON.stringify({ language }),
    }),

  // Reports
  submitReport: (formData) =>
    apiRequest('/api/reports', {
      method: 'POST',
      body: formData,
    }),

  getMyReports: () => apiRequest('/api/reports/my-reports'),

  getPublicMapReports: () => apiRequest('/api/reports/public-map'),

  getReportDetail: (id) => apiRequest(`/api/reports/${id}`),

  getReportHistory: (id) => apiRequest(`/api/reports/${id}/history`),

  updateReportStatus: (id, formData) =>
    apiRequest(`/api/reports/${id}/status`, {
      method: 'POST',
      body: formData,
    }),

  reopenReport: (id, reason) =>
    apiRequest(`/api/reports/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  toggleUpvote: (id) =>
    apiRequest(`/api/reports/${id}/upvote`, {
      method: 'POST',
    }),

  getDepartmentReports: (departmentId) =>
    apiRequest(`/api/reports/department/${departmentId}`),

  getEscalatedReports: () => apiRequest('/api/reports/escalated'),

  getCriticallyOverdue: () => apiRequest('/api/reports/critically-overdue'),

  // Notices
  getActiveNotices: () => apiRequest('/api/notices/active'),

  getAllNotices: () => apiRequest('/api/notices/all'),

  checkNoticeAtLocation: (lat, lng) =>
    apiRequest(`/api/notices/check-area?lat=${lat}&lng=${lng}`),

  previewNoticeTranslation: (messageEn) =>
    apiRequest('/api/notices/translate-preview', {
      method: 'POST',
      body: JSON.stringify({ messageEn }),
    }),

  createNotice: (noticeData) =>
    apiRequest('/api/notices', {
      method: 'POST',
      body: JSON.stringify(noticeData),
    }),

  // Contacts & Departments
  getEmergencyContacts: () => apiRequest('/api/contacts/public'),

  getDepartments: () => apiRequest('/api/departments'),

  // Notifications
  getMyNotifications: () => apiRequest('/api/notifications'),

  getUnreadNotifCount: () => apiRequest('/api/notifications/unread-count'),

  markAllNotificationsRead: () =>
    apiRequest('/api/notifications/mark-all-read', { method: 'POST' }),

  // Admin
  getAdminAnalytics: () => apiRequest('/api/admin/analytics'),

  getAllUsers: () => apiRequest('/api/admin/users'),

  updateUserStatus: (id, status) =>
    apiRequest(`/api/admin/users/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  createOfficial: (officialData) =>
    apiRequest('/api/admin/officials', {
      method: 'POST',
      body: JSON.stringify(officialData),
    }),

  getSlaSettings: () => apiRequest('/api/admin/sla-settings'),

  updateSlaSetting: (id, setting) =>
    apiRequest(`/api/admin/sla-settings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(setting),
    }),

  getAuditLogs: () => apiRequest('/api/admin/audit-logs'),

  triggerSlaCheck: () =>
    apiRequest('/api/admin/demo/trigger-sla', { method: 'POST' }),
};
