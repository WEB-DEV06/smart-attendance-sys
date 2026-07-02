import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { studentsAPI } from '../utils/api';

export default function RegisterStudent() {
  const [form, setForm] = useState({ name: '', rollNumber: '', department: '', mobileNumber: '' });
  const [cameraOpen, setCameraOpen] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [photoData, setPhotoData] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      showAlert('error', 'Failed to load face recognition models. See setup instructions.');
    } finally {
      setLoadingModels(false);
    }
  };

  const openCamera = async () => {
    if (!modelsLoaded) {
      await loadModels();
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraOpen(true);
      setCaptured(false);
      setFaceDescriptor(null);
      setPhotoData('');
    } catch {
      showAlert('error', 'Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setCameraOpen(false);
  };

  const captureFace = async () => {
    if (!videoRef.current) return;
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      showAlert('error', 'No face detected. Please look directly at the camera.');
      return;
    }

    // Capture photo to canvas
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const photo = canvas.toDataURL('image/jpeg', 0.8);

    setFaceDescriptor(Array.from(detection.descriptor));
    setPhotoData(photo);
    setCaptured(true);
    stopCamera();
    showAlert('success', '✅ Face captured successfully!');
  };

  const handleSave = async () => {
    if (!form.name || !form.rollNumber || !form.department || !form.mobileNumber) {
      showAlert('error', 'Please fill in all fields.');
      return;
    }
    if (!faceDescriptor) {
      showAlert('error', 'Please capture face data before saving.');
      return;
    }
    setSaving(true);
    try {
      await studentsAPI.register({ ...form, faceDescriptor, photo: photoData });
      showAlert('success', `✅ ${form.name} registered successfully!`);
      setForm({ name: '', rollNumber: '', department: '', mobileNumber: '' });
      setFaceDescriptor(null);
      setPhotoData('');
      setCaptured(false);
    } catch (err) {
      showAlert('error', err.response?.data?.error || 'Registration failed.');
    } finally {
      setSaving(false);
    }
  };

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    loadModels();
    return () => stopCamera();
  }, []);

  const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology', 'Mathematics', 'Physics', 'Chemistry', 'MBA', 'Other'];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Register Student</div>
        <div className="page-subtitle">Add a new student and capture their face data</div>
      </div>
      <div className="page-body">
        {alert && (
          <div className={`alert alert-${alert.type === 'success' ? 'success' : 'error'}`}>
            {alert.msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
          {/* Form */}
          <div className="card">
            <div className="card-title">Student Details</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  placeholder="e.g. Arjun Sharma"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Roll Number</label>
                <input
                  type="text"
                  placeholder="e.g. CS2024001"
                  value={form.rollNumber}
                  onChange={e => setForm({ ...form, rollNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={form.mobileNumber}
                  onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !captured}>
                {saving ? <><span className="spin">⚙</span> Saving...</> : '💾 Save Student'}
              </button>
              {!captured && <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
                ← Capture face first
              </span>}
            </div>
          </div>

          {/* Camera */}
          <div className="card">
            <div className="card-title">Face Capture</div>
            <div className="camera-section">
              {loadingModels && (
                <div className="alert alert-info">
                  <span className="spin">⚙</span> Loading face recognition models...
                </div>
              )}

              <div className={`video-container ${cameraOpen ? 'active' : ''}`}
                style={{ width: 300, height: 225 }}>
                <video ref={videoRef} style={{ width: 300, height: 225, display: cameraOpen ? 'block' : 'none' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {!cameraOpen && !captured && (
                  <div className="camera-overlay" style={{ width: 300, height: 225 }}>
                    <span style={{ fontSize: 36 }}>📷</span>
                    <span>Camera not started</span>
                  </div>
                )}
                {!cameraOpen && captured && photoData && (
                  <img src={photoData} alt="captured" style={{ width: 300, height: 225, objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                )}
                {cameraOpen && <div className="scan-line" />}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {!cameraOpen ? (
                  <button className="btn btn-outline" onClick={openCamera} disabled={loadingModels}>
                    📸 Open Camera
                  </button>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={captureFace}>
                      ✅ Capture Face
                    </button>
                    <button className="btn btn-outline" onClick={stopCamera}>
                      ✕ Cancel
                    </button>
                  </>
                )}
              </div>

              {captured && (
                <div className="badge badge-green" style={{ padding: '8px 16px', fontSize: 13 }}>
                  ✅ Face data captured
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
