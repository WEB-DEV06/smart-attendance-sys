import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../utils/api';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, recordsRes] = await Promise.all([
        attendanceAPI.getSummary(),
        attendanceAPI.getAll({ date: new Date().toISOString().split('T')[0] })
      ]);
      setSummary(summaryRes.data.summary);
      setRecentRecords(recordsRes.data.records.slice(0, 8));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">📅 {today}</div>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="loading-state">
            <span className="spin">⚙</span>
            <span>Loading dashboard...</span>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card blue">
                <span className="stat-icon">🎓</span>
                <div className="stat-value">{summary.totalStudents}</div>
                <div className="stat-label">Total Students</div>
              </div>
              <div className="stat-card green">
                <span className="stat-icon">✅</span>
                <div className="stat-value">{summary.presentToday}</div>
                <div className="stat-label">Present Today</div>
              </div>
              <div className="stat-card red">
                <span className="stat-icon">❌</span>
                <div className="stat-value">{summary.absentToday}</div>
                <div className="stat-label">Absent Today</div>
              </div>
              <div className="stat-card orange">
                <span className="stat-icon">📊</span>
                <div className="stat-value">{summary.attendanceRate}%</div>
                <div className="stat-label">Attendance Rate</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-title">Today's Attendance Progress</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  flex: 1,
                  height: 12,
                  background: 'var(--bg-secondary)',
                  borderRadius: 100,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${summary.attendanceRate}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--accent), #00ffa8)',
                    borderRadius: 100,
                    transition: 'width 0.8s ease'
                  }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', minWidth: 44 }}>
                  {summary.attendanceRate}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {summary.presentToday} present out of {summary.totalStudents} students
                </span>
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="card">
              <div className="card-title">Today's Marked Attendance</div>
              {recentRecords.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No attendance marked yet today</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Roll No</th>
                        <th>Department</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRecords.map((r, i) => (
                        <tr key={r._id}>
                          <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                          <td style={{ fontWeight: 500 }}>{r.studentName}</td>
                          <td>{r.rollNumber}</td>
                          <td>{r.department}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.time}</td>
                          <td><span className="badge badge-green">● Present</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
