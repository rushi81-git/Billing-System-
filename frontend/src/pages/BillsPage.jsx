import React, { useEffect, useState } from 'react';
import { billAPI } from '../services/api';
import toast from 'react-hot-toast';

const BillsPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await billAPI.list();
      setBills(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBills(); }, []);

  const handleStatusToggle = async (bill) => {
    const newStatus = bill.payment_status === 'PAID' ? 'PENDING' : 'PAID';
    setUpdatingId(bill.bill_id);
    try {
      const res = await billAPI.updateStatus(bill.bill_id, newStatus);
      const updatedBill = res.data.data;
      
      // Update the bill in state with all new fields from backend
      setBills((prev) =>
        prev.map((b) => (b.bill_id === bill.bill_id ? { ...b, ...updatedBill } : b))
      );
      
      toast.success(`Bill marked as ${newStatus}. PDF updated ✓`, { duration: 3000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = bills.filter((b) =>
    b.bill_id.toLowerCase().includes(search.toLowerCase()) ||
    b.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.customer?.phone?.includes(search)
  );

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>📋 Bills</h1>
          <p style={styles.pageSubtitle}>{bills.length} total bills</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchBills}>
          🔄 Refresh
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.searchWrap}>
          <input
            type="text"
            placeholder="Search by bill ID, customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <span>Loading bills...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <p>No bills found.</p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Bill ID</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => (
                  <tr key={bill.bill_id} style={styles.row}>
                    <td style={styles.td}>
                      <span style={styles.billId}>{bill.bill_id}</span>
                    </td>
                    <td style={styles.td}>{bill.customer?.name || '—'}</td>
                    <td style={styles.td}>{bill.customer?.phone || '—'}</td>
                    <td style={styles.td}>
                      <div><strong>₹{parseFloat(bill.final_amount).toFixed(2)}</strong></div>
                      {parseFloat(bill.amount_due || 0) > 0 && (
                        <div style={{fontSize:11,color:'#dc2626',marginTop:2}}>
                          Due: ₹{parseFloat(bill.amount_due).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(bill.payment_status === 'PAID'
                            ? styles.badgePaid
                            : styles.badgePending),
                        }}
                      >
                        {bill.payment_status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {(() => {
                        const d = new Date(bill.createdAt || bill.created_at);
                        return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        });
                      })()}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <a
                          href={`/invoice/${bill.public_token}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.viewBtn}
                        >
                          🔗 View
                        </a>
                        <button
                          style={{
                            ...styles.toggleBtn,
                            ...(bill.payment_status === 'PAID'
                              ? styles.toggleBtnPending
                              : styles.toggleBtnPaid),
                          }}
                          onClick={() => handleStatusToggle(bill)}
                          disabled={updatingId === bill.bill_id}
                        >
                          {updatingId === bill.bill_id
                            ? '...'
                            : bill.payment_status === 'PAID'
                            ? 'Mark Pending'
                            : 'Mark Paid'}
                        </button>
                      </div>
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
};

const styles = {
  pageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageTitle: { fontSize: 22, fontWeight: 800, color: '#1a1a2e' },
  pageSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  refreshBtn: {
    background: '#f0f2f5',
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    color: '#374151',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  searchWrap: { padding: '16px 16px 0' },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 40,
    color: '#6b7280',
    fontSize: 14,
  },
  spinner: {
    width: 20,
    height: 20,
    border: '3px solid #e5e7eb',
    borderTopColor: '#1a1a2e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: '#9ca3af',
    fontSize: 14,
  },
  tableWrap: { overflowX: 'auto', marginTop: 14 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: '#f8fafc',
    borderBottom: '2px solid #e5e7eb',
  },
  row: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 14px', fontSize: 13, color: '#374151' },
  billId: {
    fontFamily: 'monospace',
    fontSize: 12,
    background: '#f0f2f5',
    padding: '2px 6px',
    borderRadius: 4,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },
  badgePaid: { background: '#dcfce7', color: '#15803d' },
  badgePending: { background: '#fef3c7', color: '#92400e' },
  actions: { display: 'flex', gap: 6 },
  viewBtn: {
    padding: '5px 10px',
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  toggleBtn: {
    padding: '5px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  toggleBtnPaid: { background: '#dcfce7', color: '#15803d' },
  toggleBtnPending: { background: '#fef3c7', color: '#92400e' },
};

export default BillsPage;
