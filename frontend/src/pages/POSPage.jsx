import React, { useState, useCallback, useRef } from 'react';
import BarcodeScanner from '../components/scanner/BarcodeScanner';
import CartDisplay from '../components/cart/CartDisplay';
import CustomerForm from '../components/CustomerForm';
import { useCart } from '../context/CartContext';
import { productAPI, billAPI } from '../services/api';
import toast from 'react-hot-toast';

const POSPage = () => {
  const { items, subtotal, addItem, clearCart } = useCart();
  const [customer, setCustomer]             = useState(null);
  const [discountPercent, setDiscountPercent] = useState('0');
  const [paymentStatus, setPaymentStatus]   = useState('PAID');
  const [amountPaid, setAmountPaid]         = useState('');
  const [dueDate, setDueDate]               = useState('');
  const [checkingOut, setCheckingOut]       = useState(false);
  const [lastBill, setLastBill]             = useState(null);
  const pendingScans = useRef(new Set());

  // ── computed ──────────────────────────────────────────
  const discountAmt  = (subtotal * (parseFloat(discountPercent) || 0)) / 100;
  const finalAmount  = subtotal - discountAmt;
  const paidNow      = Math.min(parseFloat(amountPaid) || 0, finalAmount);
  const balanceDue   = paymentStatus === 'PENDING' ? Math.max(0, finalAmount - paidNow) : 0;

  // ── scan handler ──────────────────────────────────────
  const handleScan = useCallback(async (sku) => {
    if (pendingScans.current.has(sku)) return;
    pendingScans.current.add(sku);
    try {
      const res = await productAPI.scan(sku);
      addItem(res.data.data);
      toast.success(`✓ ${res.data.data.product_name}`, { duration: 1200 });
    } catch (err) {
      toast.error(err.response?.data?.message || `SKU not found: ${sku}`);
    } finally {
      setTimeout(() => pendingScans.current.delete(sku), 300);
    }
  }, [addItem]);

  // ── checkout ──────────────────────────────────────────
  const handleCheckout = async () => {
    if (!customer)        return toast.error('Set customer details first');
    if (items.length === 0) return toast.error('Cart is empty');

    if (paymentStatus === 'PENDING') {
      const paid = parseFloat(amountPaid);
      if (isNaN(paid) || paid < 0) return toast.error('Enter valid amount paying now');
      if (paid > finalAmount)      return toast.error(`Amount cannot exceed ₹${finalAmount.toFixed(2)}`);
    }

    setCheckingOut(true);
    try {
      const payload = {
        customer_name:   customer.name,
        customer_phone:  customer.phone,
        items: items.map((i) => ({
          product_name: i.product_name,
          sku:          i.sku || '',
          price:        i.price,
          quantity:     i.quantity,
        })),
        discount_percent: parseFloat(discountPercent) || 0,
        payment_status:   paymentStatus,
        amount_paid:      paymentStatus === 'PAID' ? finalAmount : (parseFloat(amountPaid) || 0),
        due_date:         paymentStatus === 'PENDING' ? dueDate || null : null,
      };

      const res  = await billAPI.checkout(payload);
      const data = res.data.data;
      setLastBill(data);
      clearCart();
      setCustomer(null);
      setDiscountPercent('0');
      setAmountPaid('');
      setDueDate('');
      setPaymentStatus('PAID');

      const dueMsg = parseFloat(data.amount_due) > 0
        ? ` | Balance: ₹${parseFloat(data.amount_due).toFixed(2)}`
        : '';
      toast.success(`Bill ${data.bill_id} created!${dueMsg}`);

      // Show low-stock warnings for items that are running low
      if (data.stock_updated?.length) {
        data.stock_updated.forEach(({ product_name, stock_after }) => {
          if (stock_after === 0) {
            toast.error(`⚠️ "${product_name}" is now OUT OF STOCK`, { duration: 5000 });
          } else if (stock_after <= 3) {
            toast(`⚠️ Low stock: "${product_name}" — only ${stock_after} left`, {
              icon: '📦', duration: 4000,
              style: { background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }
            });
          }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div style={styles.leftPanel}>

        {/* Customer */}
        <div style={styles.section}>
          <CustomerForm onCustomerSet={setCustomer} customer={customer} />
        </div>

        {/* Scanner */}
        <div style={styles.section}>
          <BarcodeScanner onScan={handleScan} />
        </div>

        {/* Payment section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💳 Payment</h3>

          {/* PAID / PENDING toggle */}
          <div style={styles.paymentRow}>
            <button
              style={{ ...styles.payBtn, ...(paymentStatus === 'PAID' ? styles.payBtnActive : {}) }}
              onClick={() => { setPaymentStatus('PAID'); setAmountPaid(''); }}
              type="button"
            >
              ✅ Paid in Full
            </button>
            <button
              style={{ ...styles.payBtn, ...(paymentStatus === 'PENDING' ? styles.payBtnPending : {}) }}
              onClick={() => setPaymentStatus('PENDING')}
              type="button"
            >
              ⏳ Partial / Credit
            </button>
          </div>

          {/* PENDING extra fields */}
          {paymentStatus === 'PENDING' && (
            <div style={styles.pendingBox}>
              <div style={styles.pendingHeader}>
                💰 Partial Payment Details
              </div>

              {/* Total */}
              <div style={styles.pendingSummaryRow}>
                <span style={styles.pendingLabel}>Total Bill</span>
                <span style={styles.pendingValue}>₹{finalAmount.toFixed(2)}</span>
              </div>

              {/* Amount paying now */}
              <div style={styles.field}>
                <label style={styles.label}>Amount Customer is Paying Now *</label>
                <div style={styles.amountInputWrap}>
                  <span style={styles.rupeeSign}>₹</span>
                  <input
                    type="number"
                    min="0"
                    max={finalAmount}
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder={`0 – ${finalAmount.toFixed(2)}`}
                    style={styles.amountInput}
                    autoFocus
                  />
                </div>
              </div>

              {/* Balance due (live) */}
              {amountPaid !== '' && (
                <div style={styles.balanceRow}>
                  <div style={styles.balancePaid}>
                    <div style={styles.balanceLbl}>Paid Now</div>
                    <div style={styles.balanceVal}>₹{paidNow.toFixed(2)}</div>
                  </div>
                  <div style={styles.balanceSep}>→</div>
                  <div style={styles.balanceDue}>
                    <div style={styles.balanceLbl}>Balance Due</div>
                    <div style={{ ...styles.balanceVal, color: balanceDue > 0 ? '#dc2626' : '#16a34a' }}>
                      ₹{balanceDue.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Due date */}
              <div style={styles.field}>
                <label style={styles.label}>Due Date (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={styles.input}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Last bill */}
        {lastBill && (
          <div style={styles.lastBill}>
            <div style={styles.lastBillTitle}>✅ Bill Created</div>
            <div style={styles.lastBillId}>{lastBill.bill_id}</div>
            <div style={styles.lastBillRows}>
              <span>Total: <strong>₹{parseFloat(lastBill.final_amount).toFixed(2)}</strong></span>
              <span>Paid: <strong style={{color:'#16a34a'}}>₹{parseFloat(lastBill.amount_paid).toFixed(2)}</strong></span>
              {parseFloat(lastBill.amount_due) > 0 && (
                <span>Balance: <strong style={{color:'#dc2626'}}>₹{parseFloat(lastBill.amount_due).toFixed(2)}</strong></span>
              )}
            </div>
            <div style={styles.lastBillLinks}>
              <a href={lastBill.invoice_url} target="_blank" rel="noreferrer" style={styles.invoiceLink}>
                🔗 View Invoice
              </a>
              {lastBill.pdf_url && (
                <a href={lastBill.pdf_url} target="_blank" rel="noreferrer" style={styles.pdfLink}>
                  📄 PDF
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL (Cart) ──────────────────────────── */}
      <div style={styles.rightPanel}>
        <div style={styles.cartCard}>
          <CartDisplay
            discountPercent={discountPercent}
            setDiscountPercent={setDiscountPercent}
          />

          {items.length > 0 && (
            <button
              style={{
                ...styles.checkoutBtn,
                background: checkingOut || !customer ? '#6b7280' : '#1a1a2e',
              }}
              onClick={handleCheckout}
              disabled={checkingOut || !customer}
              type="button"
            >
              {checkingOut ? (
                <span style={styles.btnInner}><span style={styles.spinner} /> Processing...</span>
              ) : (
                `🧾 Checkout — ₹${finalAmount.toFixed(2)}`
              )}
            </button>
          )}

          {items.length > 0 && !customer && (
            <p style={styles.hint}>↑ Set customer to enable checkout</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { display: 'flex', gap: 20, height: '100%', minHeight: 0 },
  leftPanel: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', minWidth: 300 },
  rightPanel: { width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column' },
  cartCard: {
    background: '#fff', borderRadius: 12, padding: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflow: 'auto',
  },
  section: { background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 },
  paymentRow: { display: 'flex', gap: 10, marginBottom: 10 },
  payBtn: {
    flex: 1, padding: '10px 8px', border: '2px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#f9fafb', color: '#374151',
  },
  payBtnActive:  { background: '#f0fdf4', border: '2px solid #22c55e', color: '#166534' },
  payBtnPending: { background: '#fef3c7', border: '2px solid #f59e0b', color: '#92400e' },

  // Pending box
  pendingBox: {
    background: '#fffbeb', border: '2px solid #fde68a', borderRadius: 10,
    padding: 14, display: 'flex', flexDirection: 'column', gap: 12,
  },
  pendingHeader: { fontSize: 13, fontWeight: 700, color: '#92400e' },
  pendingSummaryRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: 14, fontWeight: 600, color: '#374151',
    paddingBottom: 8, borderBottom: '1px solid #fde68a',
  },
  pendingLabel: { color: '#6b7280' },
  pendingValue: { fontWeight: 700, color: '#1a1a2e' },

  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  amountInputWrap: { display: 'flex', alignItems: 'center', border: '2px solid #f59e0b', borderRadius: 8, overflow: 'hidden' },
  rupeeSign: { padding: '9px 10px', background: '#fef3c7', fontWeight: 700, fontSize: 14, color: '#92400e' },
  amountInput: { flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 16, fontWeight: 700, fontFamily: 'inherit' },
  input: { padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%' },

  balanceRow: { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 8, padding: '10px 14px' },
  balancePaid: { flex: 1, textAlign: 'center' },
  balanceDue:  { flex: 1, textAlign: 'center' },
  balanceSep:  { fontSize: 18, color: '#9ca3af' },
  balanceLbl:  { fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 },
  balanceVal:  { fontSize: 18, fontWeight: 800, color: '#1a1a2e' },

  checkoutBtn: {
    width: '100%', padding: '14px 20px', color: '#fff', border: 'none',
    borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  btnInner: { display: 'flex', alignItems: 'center', gap: 8 },
  spinner: {
    display: 'inline-block', width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  hint: { textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 4 },

  lastBill: { background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: 10, padding: 14 },
  lastBillTitle: { fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 4 },
  lastBillId: { fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 6 },
  lastBillRows: { display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13, marginBottom: 8 },
  lastBillLinks: { display: 'flex', gap: 10 },
  invoiceLink: { fontSize: 12, fontWeight: 600, color: '#0f3460', background: '#dbeafe', padding: '4px 10px', borderRadius: 6 },
  pdfLink:     { fontSize: 12, fontWeight: 600, color: '#7c3aed', background: '#ede9fe', padding: '4px 10px', borderRadius: 6 },
};

export default POSPage;
