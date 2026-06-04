import API from './api';

export const memberService = {
  getAll: (page = 1, limit = 10) => 
    API.get('/members', { params: { page, limit } }),
  
  getById: (id) => 
    API.get(`/members/${id}`),
  
  create: (data) => 
    API.post('/members', data),
  
  update: (id, data) => 
    API.put(`/members/${id}`, data),
  
  deactivate: (id) => 
    API.delete(`/members/${id}`),
};

export const depositService = {
  create: (data) => 
    API.post('/deposits', data),
  
  getAll: (memberId = null, page = 1, limit = 10) => 
    API.get('/deposits', { params: { memberId, page, limit } }),
  
  getById: (id) => 
    API.get(`/deposits/${id}`),
};

export const withdrawalService = {
  create: (data) => 
    API.post('/withdrawals', data),
  
  getAll: (memberId = null, status = null, page = 1, limit = 10) => 
    API.get('/withdrawals', { params: { memberId, status, page, limit } }),
  
  approve: (id, status) => 
    API.put(`/withdrawals/${id}/approve`, { status }),
};

export const reportService = {
  getDashboard: () => 
    API.get('/reports/dashboard'),
  
  getSummary: (startDate = null, endDate = null) => 
    API.get('/reports/summary', { params: { startDate, endDate } }),
  
  getMemberReport: (memberId) => 
    API.get(`/reports/member/${memberId}`),
};

export const auditService = {
  getAll: (page = 1, limit = 20, filters = {}) => 
    API.get('/audits', { params: { page, limit, ...filters } }),
  
  getById: (id) => 
    API.get(`/audits/${id}`),
  
  getTableHistory: (table, recordId, page = 1, limit = 20) => 
    API.get(`/audits/table/${table}/${recordId}`, { params: { page, limit } }),
};
