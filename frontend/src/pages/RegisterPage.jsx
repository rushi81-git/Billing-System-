import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await authAPI.register({ name: form.name, email: form.email, password: form.password });
      toast.success('Owner registered! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏪</span>
          <h1 style={styles.logoTitle}>Setup Owner Account</h1>
          <p style={styles.logoSubtitle}>One-time registration for shop owner</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Shop Owner Name' },
            { name: 'email', label: 'Email Address', type: 'email', placeholder: 'owner@shop.com' },
            { name: 'password', label: 'Password', type: 'password', placeholder: '6+ characters' },
            { name: 'confirm', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
          ].map((field) => (
            <div key={field.name} style={styles.field}>
              <label style={styles.label}>{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                style={styles.input}
                required
              />
            </div>
          ))}
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Owner Account'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <a href="/login" style={styles.link}>Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    padding: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: { textAlign: 'center', marginBottom: 28 },
  logoIcon: { fontSize: 44, display: 'block', marginBottom: 10 },
  logoTitle: { fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 },
  logoSubtitle: { fontSize: 13, color: '#6b7280' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: '#374151' },
  input: {
    padding: '10px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
  },
  submitBtn: {
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 6,
  },
  footer: { textAlign: 'center', marginTop: 16 },
  footerText: { fontSize: 13, color: '#6b7280' },
  link: { color: '#0f3460', fontWeight: 600 },
};

export default RegisterPage;
