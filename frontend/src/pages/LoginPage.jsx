import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/pos';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏪</span>
          <h1 style={styles.logoTitle}>
            {import.meta.env.VITE_APP_NAME || 'Smart Billing POS'}
          </h1>
          <p style={styles.logoSubtitle}>Owner Login</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@shop.com"
              style={styles.input}
              required
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span style={styles.btnContent}>
                <span style={styles.spinner} /> Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            First time?{' '}
            <a href="/register" style={styles.link}>
              Register Owner Account
            </a>
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
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoIcon: { fontSize: 48, display: 'block', marginBottom: 12 },
  logoTitle: { fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 },
  logoSubtitle: { fontSize: 14, color: '#6b7280' },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    padding: '11px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    width: '100%',
  },
  submitBtn: {
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '13px 20px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 6,
    transition: 'background 0.2s',
  },
  btnContent: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footer: { textAlign: 'center', marginTop: 20 },
  footerText: { fontSize: 13, color: '#6b7280' },
  link: { color: '#0f3460', fontWeight: 600 },
};

export default LoginPage;
