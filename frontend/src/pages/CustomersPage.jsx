import React, { useEffect, useState } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await customerAPI.list();
        setCustomers(res.data.data || []);
      } catch {
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>👥 Customers</h1>
          <p style={styles.pageSubtitle}>{customers.length} total customers</p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.searchWrap}>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No customers found.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Since</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={styles.row}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>
                      <div style={styles.customerCell}>
                        <div style={styles.avatar}>
                          {c.name[0].toUpperCase()}
                        </div>
                        <span style={styles.customerName}>{c.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{c.phone}</td>
                    <td style={styles.td}>
                      {(() => {
                        const d = new Date(c.createdAt || c.created_at);
                        return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        });
                      })()}
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
  empty: { textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 },
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
  customerCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#1a1a2e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  customerName: { fontWeight: 600 },
};

export default CustomersPage;
