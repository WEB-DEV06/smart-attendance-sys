import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../utils/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ViewRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', department: '' });
  const [applied, setApplied] = useState({});

  const DEPARTMENTS = ['', 'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology', 'Mathematics', 'Physics', 'Chemistry', 'MBA', 'Other'];

  useEffect(() => { fetchRecords({}); }, []);

  const fetchRecords = async (f) => {
    setLoading(true);
    try {
      const params = {};
      if (f.date) params.date = f.date;
      if (f.department) params.department = f.department;
      const res = await attendanceAPI.getAll(params);
      setRecords(res.data.records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setApplied(filters);
    fetchRecords(filters);
  };

  const clearFilters = () => {
    setFilters({ date: '', department: '' });
    setApplied({});
    fetchRecords({});
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, 220, 40, 'F');
    doc.setTextColor(0, 229, 160);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Smart Attendance System', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 180);
    doc.text('Attendance Report', 14, 28);

    const dateLabel = applied.date ? `Date: ${applied.date}` : `Generated: ${new Date().toLocaleDateString('en-IN')}`;
    const deptLabel = applied.department ? `Department: ${applied.department}` : 'All Departments';
    doc.text(`${dateLabel}  |  ${deptLabel}  |  Total Records: ${records.length}`, 14, 36);

    // Table
    autoTable(doc, {
      startY: 48,
      head: [['#', 'Student Name', 'Roll Number', 'Department', 'Date', 'Time', 'Status']],
      body: records.map((r, i) => [
        i + 1,
        r.studentName,
        r.rollNumber,
        r.department,
        r.date,
        r.time,
        'Present'
      ]),
      headStyles: {
        fillColor: [0, 229, 160],
        textColor: [10, 10, 15],
        fontStyle: 'bold',
        fontSize: 10,
      },
      alternateRowStyles: { fillColor: [245, 245, 252] },
      styles: { fontSize: 9, cellPadding: 5 },
    });

    const filename = `attendance_${applied.date || 'all'}_${applied.department || 'all'}_${Date.now()}.pdf`;
    doc.save(filename);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">View Records</div>
        <div className="page-subtitle">Browse and export attendance data</div>
      </div>
      <div className="page-body">

        {/* Filters */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Filters</div>
          <div className="filters-row">
            <div className="form-group" style={{ minWidth: 180 }}>
              <label>Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={e => setFilters({ ...filters, date: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ minWidth: 200 }}>
              <label>Department</label>
              <select value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d || 'All Departments'}</option>)}
              </select>
            </div>
            <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={applyFilters}>🔍 Apply</button>
              <button className="btn btn-outline" onClick={clearFilters}>✕ Clear</button>
            </div>
            <div style={{ alignSelf: 'flex-end', marginLeft: 'auto' }}>
              <button className="btn btn-info" onClick={downloadPDF} disabled={records.length === 0}>
                📥 Download PDF
              </button>
            </div>
          </div>

          {(applied.date || applied.department) && (
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              {applied.date && <span className="badge badge-blue">📅 {applied.date}</span>}
              {applied.department && <span className="badge badge-blue">🏫 {applied.department}</span>}
              <span className="badge badge-green">{records.length} records</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Attendance Records</span>
            <span style={{ color: 'var(--accent)', fontSize: 13 }}>{records.length} entries</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <span className="spin">⚙</span>
              <span>Loading records...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No attendance records found</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{r.studentName}</td>
                      <td>{r.rollNumber}</td>
                      <td>{r.department}</td>
                      <td>{r.date}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.time}</td>
                      <td><span className="badge badge-green">● Present</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
