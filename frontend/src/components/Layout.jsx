import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/pos', icon: '🛒', label: 'POS Terminal' },
  { path: '/bills', icon: '📋', label: 'Bills' },
  { path: '/customers', icon: '👥', label: 'Customers' },
  { path: '/products',  icon: '🏷️', label: 'Products' },
];

const Layout = ({ children }) => {
  const { owner, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 220 : 64 }}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏪</span>
          {sidebarOpen && (
            <span style={styles.logoText}>
              {import.meta.env.VITE_APP_NAME || 'Smart POS'}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
              })}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={styles.sidebarBottom}>
          {sidebarOpen && (
            <div style={styles.ownerInfo}>
              <div style={styles.ownerAvatar}>
                {owner?.name?.[0]?.toUpperCase() || 'O'}
              </div>
              <div>
                <div style={styles.ownerName}>{owner?.name}</div>
                <div style={styles.ownerRole}>{owner?.role}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={styles.logoutBtn}
            title="Logout"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={styles.main}>
        {/* Topbar */}
        <header style={styles.topbar}>
          <button
            style={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <h2 style={styles.topbarTitle}>
            {import.meta.env.VITE_APP_NAME || 'Smart Billing POS'}
          </h2>
          <div style={styles.topbarRight}>
            <span style={styles.topbarBadge}>
              {new Date().toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </header>

        {/* Content */}
        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
};

const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    background: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s ease',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    minHeight: 64,
  },
  logoIcon: { fontSize: 24, flexShrink: 0 },
  logoText: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    whiteSpace: 'nowrap',
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 12px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  navIcon: { fontSize: 18, flexShrink: 0 },
  sidebarBottom: {
    padding: 12,
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  ownerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 4px',
    marginBottom: 8,
  },
  ownerAvatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#e94560',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  ownerName: { color: '#fff', fontSize: 13, fontWeight: 600 },
  ownerRole: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '9px 12px',
    background: 'rgba(233,69,96,0.15)',
    color: '#f87171',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.15s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 20px',
    height: 60,
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#6b7280',
    padding: '6px 8px',
    borderRadius: 6,
  },
  topbarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  topbarBadge: {
    background: '#f0f2f5',
    color: '#6b7280',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 24,
  },
};

export default Layout;
