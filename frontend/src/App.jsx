import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import RegisterStudent from './pages/RegisterStudent';
import MarkAttendance from './pages/MarkAttendance';
import ViewRecords from './pages/ViewRecords';
import ManageStudents from './pages/ManageStudents';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'register', label: 'Register Student', icon: '➕' },
  { id: 'mark', label: 'Mark Attendance', icon: '🎯' },
  { id: 'records', label: 'View Records', icon: '📋' },
  { id: 'manage', label: 'Manage Students', icon: '👥' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pages = {
    dashboard: <Dashboard />,
    register: <RegisterStudent />,
    mark: <MarkAttendance />,
    records: <ViewRecords />,
    manage: <ManageStudents />,
  };

  const handleTabChange = (id) => {
    setTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: '#00000088',
            zIndex: 99,
            display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">🎓</div>
            <div className="logo-text">AttendX</div>
          </div>
          <div className="logo-sub">Smart Attendance System</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Main Menu</div>
          {tabs.map(t => (
            <button
              key={t.id}
              className={`nav-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => handleTabChange(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          AttendX v1.0 · Built with face-api.js
        </div>
      </aside>

      <main className="main-content">
        {/* Mobile header */}
        <div className="mobile-header">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>AttendX</span>
        </div>

        {pages[tab]}
      </main>
    </div>
  );
}
