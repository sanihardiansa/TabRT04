import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { depositService } from '../services';
import '../styles/Setoran.css';

export default function Setoran() {
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchDeposits();
  }, [page]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const response = await depositService.getAll(null, page, 10);
      setDeposits(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setoran-container">
      <div className="setoran-header">
        <h2>Setoran Tabungan</h2>
        <button className="btn btn-primary" onClick={() => navigate('/transaksi/setoran')}>
          ➕ Tambah Setoran
        </button>
      </div>
      
      <div className="glass-panel main-panel-padding">
        <h3 className="section-title">📥 Catatan Setoran Tabungan</h3>
        
        {loading ? (
          <div className="table-loading-spinner">
            <div className="spinner"></div>
            <p>Memuat catatan setoran warga...</p>
          </div>
        ) : error ? (
          <div className="no-data-alert" style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose-glow)' }}>
            ⚠️ {error}
          </div>
        ) : deposits.length === 0 ? (
          <div className="no-data-alert">
            Belum ada catatan transaksi setoran tabungan.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No. Anggota</th>
                  <th>Jumlah Setoran</th>
                  <th>Tanggal Setoran</th>
                  <th>Catatan / Keterangan</th>
                  <th>Petugas Pencatat</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td>
                      <strong>{deposit.member_number}</strong>
                      {deposit.member_name && (
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '0.15rem' }}>
                          {deposit.member_name}
                        </span>
                      )}
                    </td>
                    <td className="saldo-column text-emerald" style={{ fontWeight: '700' }}>
                      Rp {deposit.amount.toLocaleString('id-ID')}
                    </td>
                    <td>
                      {new Date(deposit.deposit_date).toLocaleDateString('id-ID', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td>{deposit.description || '-'}</td>
                    <td>{deposit.recorded_by_name}</td>
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
