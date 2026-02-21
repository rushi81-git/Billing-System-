import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { billAPI } from '../services/api';

const InvoicePage = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await billAPI.getPublicInvoice(token);
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invoice not found');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading invoice...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorPage}>
        <div style={styles.errorIcon}>❌</div>
        <h2>Invoice Not Found</h2>
        <p>{error}</p>
      </div>
    );
  }

  const { bill, shop, pdf_url } = data;
  const customer = bill.customer;
  const items = bill.items;

  return (
    <div style={styles.page}>
      <div style={styles.invoice}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.shopLogo}>🏪</div>
          <h1 style={styles.shopName}>{shop.name}</h1>
          <p style={styles.shopDetails}>{shop.address}</p>
          <p style={styles.shopDetails}>
            📞 {shop.phone} &nbsp;|&nbsp; ✉️ {shop.email}
          </p>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Bill Info */}
        <div style={styles.billInfo}>
          <div style={styles.billInfoLeft}>
            <div style={styles.billInfoLabel}>Invoice #</div>
            <div style={styles.billInfoValue}>{bill.bill_id}</div>
            <div style={styles.billInfoLabel}>Date</div>
            <div style={styles.billInfoValue}>
              {(() => {
                const d = new Date(bill.createdAt || bill.created_at);
                return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'long', year: 'numeric',
                });
              })()}
            </div>
          </div>
          <div style={styles.billInfoRight}>
            <div style={styles.billInfoLabel}>Billed To</div>
            <div style={styles.billInfoValue}>{customer.name}</div>
            <div style={styles.billInfoLabel}>Phone</div>
            <div style={styles.billInfoValue}>{customer.phone}</div>
          </div>
        </div>

        {/* Items Table */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHead}>
                <th style={styles.thLeft}>#</th>
                <th style={styles.thLeft}>Product</th>
                <th style={styles.thRight}>Qty</th>
                <th style={styles.thRight}>Price</th>
                <th style={styles.thRight}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={i % 2 === 0 ? styles.rowEven : {}}>
                  <td style={styles.tdLeft}>{i + 1}</td>
                  <td style={styles.tdLeft}>
                    {item.product_name}
                    {item.sku && (
                      <div style={styles.sku}>SKU: {item.sku}</div>
                    )}
                  </td>
                  <td style={styles.tdRight}>{item.quantity}</td>
                  <td style={styles.tdRight}>₹{parseFloat(item.price).toFixed(2)}</td>
                  <td style={styles.tdRight}>
                    ₹{parseFloat(item.line_total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={styles.totals}>
          <div style={styles.totalRow}>
            <span>Subtotal</span>
            <span>₹{parseFloat(bill.subtotal).toFixed(2)}</span>
          </div>
          {parseFloat(bill.discount_amount) > 0 && (
            <div style={{ ...styles.totalRow, color: '#22c55e' }}>
              <span>Discount ({bill.discount_percent}%)</span>
              <span>−₹{parseFloat(bill.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div style={styles.totalFinal}>
            <span>Total</span>
            <span>₹{parseFloat(bill.final_amount).toFixed(2)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>Paid</span>
            <span style={{color:'#16a34a',fontWeight:700}}>₹{parseFloat(bill.amount_paid || bill.final_amount).toFixed(2)}</span>
          </div>
          {parseFloat(bill.amount_due || 0) > 0 && (
            <div style={{...styles.totalRow, color:'#dc2626', fontWeight:700}}>
              <span>Balance Due</span>
              <span>₹{parseFloat(bill.amount_due).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Status */}
        <div style={styles.statusWrap}>
          <span
            style={{
              ...styles.status,
              ...(bill.payment_status === 'PAID'
                ? styles.statusPaid
                : styles.statusPending),
            }}
          >
            {bill.payment_status === 'PAID' ? '✅' : '⏳'} {bill.payment_status}
          </span>
          {bill.payment_status === 'PENDING' && bill.due_date && (
            <p style={styles.dueDate}>Due: {bill.due_date}</p>
          )}
        </div>

        {/* PDF Download */}
        {pdf_url && (
          <a href={pdf_url} target="_blank" rel="noreferrer" style={styles.pdfBtn}>
            📄 Download PDF Invoice
          </a>
        )}

        {/* Footer */}
        <p style={styles.footer}>Thank you for your business! 🙏</p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '24px 16px',
    display: 'flex',
    justifyContent: 'center',
  },
  invoice: {
    background: '#fff',
    borderRadius: 16,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 600,
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
  },
  header: { textAlign: 'center', paddingBottom: 16 },
  shopLogo: { fontSize: 40, marginBottom: 8 },
  shopName: { fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  shopDetails: { fontSize: 12, color: '#6b7280', margin: '4px 0 0' },
  divider: { height: 2, background: '#1a1a2e', margin: '16px 0', borderRadius: 2 },
  billInfo: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 16 },
  billInfoLeft: {},
  billInfoRight: { textAlign: 'right' },
  billInfoLabel: { fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: 2, marginTop: 8 },
  billInfoValue: { fontSize: 14, fontWeight: 600, color: '#1f2937' },
  tableWrap: { overflowX: 'auto', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  tableHead: { background: '#1a1a2e', color: '#fff' },
  thLeft: { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 },
  thRight: { padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: 12 },
  rowEven: { background: '#f8fafc' },
  tdLeft: { padding: '10px 12px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  tdRight: { padding: '10px 12px', textAlign: 'right', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  sku: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  totals: { borderTop: '2px solid #e5e7eb', paddingTop: 12, marginBottom: 16 },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0', color: '#374151' },
  totalFinal: { display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5e7eb' },
  statusWrap: { textAlign: 'center', marginBottom: 16 },
  status: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700 },
  statusPaid: { background: '#dcfce7', color: '#15803d' },
  statusPending: { background: '#fef3c7', color: '#92400e' },
  dueDate: { fontSize: 12, color: '#ef4444', marginTop: 6 },
  pdfBtn: {
    display: 'block',
    textAlign: 'center',
    background: '#1a1a2e',
    color: '#fff',
    borderRadius: 10,
    padding: '13px 20px',
    fontSize: 14,
    fontWeight: 700,
    textDecoration: 'none',
    marginBottom: 16,
  },
  footer: { textAlign: 'center', fontSize: 13, color: '#9ca3af' },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: 16,
    color: '#6b7280',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '4px solid #e5e7eb',
    borderTopColor: '#1a1a2e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorPage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: 12,
    color: '#374151',
    textAlign: 'center',
    padding: 20,
  },
  errorIcon: { fontSize: 48 },
};

export default InvoicePage;
