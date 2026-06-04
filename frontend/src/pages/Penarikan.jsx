import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { withdrawalService } from '../services';
import '../styles/Penarikan.css';

export default function Penarikan() {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchWithdrawals();
  }, [page]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await withdrawalService.getAll(null, null, page, 10);
      setWithdrawals(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await withdrawalService.approve(id, 'approved');
      fetchWithdrawals();
    } catch (err) {
      alert('Failed to approve withdrawal');
    }
  };

  const handleReject = async (id) => {
    try {
      await withdrawalService.approve(id, 'rejected');
      fetchWithdrawals();
    } catch (err) {
      alert('Failed to reject withdrawal');
    }
  };

  return (
    <div className="penarikan-container">
      <div className="penarikan-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Penarikan Tabungan</h2>
        <button className="btn btn-primary" onClick={() => navigate('/transaksi/penarikan')}>
          ➕ Tambah Penarikan
        </button>
      </div>
      
      <div className="glass-panel main-panel-padding">
        <h3 className="section-title">📤 Catatan Penarikan Tabungan</h3>
        
        {loading ? (
          <div className="table-loading-spinner">
            <div className="spinner"></div>
            <p>Memuat catatan penarikan warga...</p>
          </div>
        ) : error ? (
          <div className="no-data-alert" style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose-glow)' }}>
            ⚠️ {error}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="no-data-alert">
            Belum ada catatan transaksi penarikan tabungan.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No. Anggota</th>
                  <th>Jumlah Penarikan</th>
                  <th>Alasan / Keperluan</th>
                  <th>Status</th>
                  <th>Aksi Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td>
                      <strong>{withdrawal.member_number}</strong>
                      {withdrawal.member_name && (
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '0.15rem' }}>
                          {withdrawal.member_name}
                        </span>
                      )}
                    </td>
                    <td className="saldo-column text-rose" style={{ fontWeight: '700' }}>
                      Rp {withdrawal.amount.toLocaleString('id-ID')}
                    </td>
                    <td>{withdrawal.reason || '-'}</td>
                    <td>
                      <span className={`badge ${
                        withdrawal.status === 'approved' ? 'badge-emerald' : 
                        withdrawal.status === 'pending' ? 'badge-amber' : 'badge-rose'
                      }`}>
                        {withdrawal.status === 'approved' ? 'Disetujui' : 
                         withdrawal.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                      </span>
                    </td>
                    <td>
                      {withdrawal.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-emerald btn-sm"
                            onClick={() => handleApprove(withdrawal.id)}
                          >
                            Setujui
                          </button>
                          <button 
                            className="btn btn-rose btn-sm"
                            onClick={() => handleReject(withdrawal.id)}
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.875rem', opacity: 0.6, fontStyle: 'italic' }}>
                          Selesai
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
