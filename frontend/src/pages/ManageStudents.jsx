import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../utils/api';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology', 'Mathematics', 'Physics', 'Chemistry', 'MBA', 'Other'];

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.getAll();
      setStudents(res.data.students);
    } catch { }
    finally { setLoading(false); }
  };

  const startEdit = (student) => {
    setEditing(student._id);
    setEditForm({ name: student.name, department: student.department, mobileNumber: student.mobileNumber });
  };

  const saveEdit = async (id) => {
    try {
      await studentsAPI.update(id, editForm);
      showAlert('success', 'Student updated successfully!');
      setEditing(null);
      fetchStudents();
    } catch (err) {
      showAlert('error', err.response?.data?.error || 'Update failed');
    }
  };

  const deleteStudent = async (id, name) => {
    try {
      await studentsAPI.delete(id);
      showAlert('success', `${name} removed successfully`);
      setConfirmDelete(null);
      fetchStudents();
    } catch (err) {
      showAlert('error', 'Could not delete student');
    }
  };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Manage Students</div>
        <div className="page-subtitle">View, edit and remove registered students</div>
      </div>
      <div className="page-body">

        {alert && (
          <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`}>
            {alert.msg}
          </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmDelete && (
          <div style={{
            position: 'fixed', inset: 0, background: '#000000aa',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
          }}>
            <div className="card" style={{ maxWidth: 380, width: '90%', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                Remove Student?
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
                This will permanently remove <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.name}</strong> and all their attendance records cannot be recovered.
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-danger" onClick={() => deleteStudent(confirmDelete.id, confirmDelete.name)}>
                  Yes, Remove
                </button>
                <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="card-title" style={{ margin: 0 }}>
              All Students <span style={{ color: 'var(--accent)' }}>({students.length})</span>
            </div>
            <input
              type="text"
              placeholder="🔍 Search by name, roll, dept..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
          </div>

          {loading ? (
            <div className="loading-state">
              <span className="spin">⚙</span>
              <span>Loading students...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>{search ? 'No results found' : 'No students registered yet'}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Mobile</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td>
                        {editing === s._id ? (
                          <input
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            style={{ padding: '6px 10px', fontSize: 13 }}
                          />
                        ) : (
                          <span style={{ fontWeight: 500 }}>{s.name}</span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.rollNumber}</td>
                      <td>
                        {editing === s._id ? (
                          <select
                            value={editForm.department}
                            onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                            style={{ padding: '6px 10px', fontSize: 13 }}
                          >
                            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                          </select>
                        ) : (
                          <span className="badge badge-blue">{s.department}</span>
                        )}
                      </td>
                      <td>
                        {editing === s._id ? (
                          <input
                            value={editForm.mobileNumber}
                            onChange={e => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                            style={{ padding: '6px 10px', fontSize: 13 }}
                          />
                        ) : s.mobileNumber}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(s.registeredAt).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {editing === s._id ? (
                            <>
                              <button className="btn btn-primary btn-sm" onClick={() => saveEdit(s._id)}>✓ Save</button>
                              <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>✕</button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-outline btn-sm" onClick={() => startEdit(s)}>✏️ Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete({ id: s._id, name: s.name })}>🗑</button>
                            </>
                          )}
                        </div>
                      </td>
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
