import React, { useState } from 'react';
import { customerAPI } from '../services/api';
import toast from 'react-hot-toast';

const CustomerForm = ({ onCustomerSet, customer }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Customer name is required');
    if (!/^\d{10}$/.test(phone)) return toast.error('Phone must be exactly 10 digits');

    setLoading(true);
    try {
      const res = await customerAPI.lookupOrCreate({ name: name.trim(), phone: phone.trim() });
      const { customer: c, isNew } = res.data.data;
      onCustomerSet(c);
      toast.success(isNew ? `New customer ${c.name} created!` : `Welcome back, ${c.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Customer lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    onCustomerSet(null);
    setName('');
    setPhone('');
  };

  if (customer) {
    return (
      <div style={styles.confirmed}>
        <div style={styles.confirmedIcon}>✅</div>
        <div style={styles.confirmedInfo}>
          <div style={styles.confirmedName}>{customer.name}</div>
          <div style={styles.confirmedPhone}>📱 {customer.phone}</div>
        </div>
        <button style={styles.changeBtn} onClick={handleReset}>
          Change
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLookup} style={styles.form}>
      <h3 style={styles.title}>👤 Customer Details</h3>
      <div style={styles.fields}>
        <div style={styles.field}>
          <label style={styles.label}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Phone * (10 digits)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            style={styles.input}
            maxLength={10}
            required
          />
        </div>
      </div>
      <button type="submit" style={styles.submitBtn} disabled={loading}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={styles.spinner} /> Loading...
          </span>
        ) : (
          '→ Confirm Customer'
        )}
      </button>
    </form>
  );
};

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 4,
  },
  fields: { display: 'flex', gap: 10 },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  input: {
    padding: '9px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    transition: 'border-color 0.2s',
  },
  submitBtn: {
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  confirmed: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: '#f0fdf4',
    borderRadius: 10,
    border: '2px solid #bbf7d0',
  },
  confirmedIcon: { fontSize: 20 },
  confirmedInfo: { flex: 1 },
  confirmedName: { fontWeight: 700, fontSize: 14, color: '#166534' },
  confirmedPhone: { fontSize: 12, color: '#16a34a', marginTop: 2 },
  changeBtn: {
    background: '#fff',
    border: '2px solid #86efac',
    color: '#166534',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  spinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export default CustomerForm;
