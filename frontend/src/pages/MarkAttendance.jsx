import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { studentsAPI, attendanceAPI } from '../utils/api';
import { playSuccessSound, playErrorSound } from '../utils/sound';

export default function MarkAttendance() {
  const [running, setRunning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [recognized, setRecognized] = useState(null);
  const [message, setMessage] = useState(null);
  const [markedList, setMarkedList] = useState([]);
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const recognitionRef = useRef();
  const labeledDescriptors = useRef([]);

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
      showMessage('error', 'Failed to load face models. Check setup instructions.');
    } finally {
      setLoadingModels(false);
    }
  };

  const loadStudentDescriptors = async () => {
    try {
      const res = await studentsAPI.getDescriptors();
      const students = res.data.students;
      if (students.length === 0) {
        showMessage('error', 'No students registered yet. Please register students first.');
        return false;
      }
      labeledDescriptors.current = students
        .filter(s => s.faceDescriptor && s.faceDescriptor.length > 0)
        .map(s => new faceapi.LabeledFaceDescriptors(
          `${s._id}::${s.name}::${s.rollNumber}::${s.department}`,
          [new Float32Array(s.faceDescriptor)]
        ));
      return true;
    } catch {
      showMessage('error', 'Could not load student data.');
      return false;
    }
  };

  const startRecognition = async () => {
    if (!modelsLoaded) await loadModels();
    const ok = await loadStudentDescriptors();
    if (!ok) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setRunning(true);
      setRecognized(null);
      setMessage(null);
      runRecognitionLoop();
    } catch {
      showMessage('error', 'Camera access denied.');
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) clearTimeout(recognitionRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setRunning(false);
  };

  const runRecognitionLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    const detect = async () => {
      if (!video.paused && !video.ended) {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resized = faceapi.resizeResults(detections, displaySize);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (labeledDescriptors.current.length > 0 && resized.length > 0) {
          const matcher = new faceapi.FaceMatcher(labeledDescriptors.current, 0.5);
          resized.forEach(d => {
            const match = matcher.findBestMatch(d.descriptor);
            const isKnown = match.label !== 'unknown';

            // Draw box
            const { x, y, width, height } = d.detection.box;
            ctx.strokeStyle = isKnown ? '#00e5a0' : '#ff4757';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Label
            ctx.fillStyle = isKnown ? '#00e5a0' : '#ff4757';
            ctx.font = '14px Syne, sans-serif';
            const label = isKnown ? match.label.split('::')[1] : 'Unknown';
            ctx.fillText(label, x, y - 8);

            if (isKnown && match.distance < 0.45) {
              const parts = match.label.split('::');
              const studentId = parts[0];
              handleMarkAttendance(studentId, parts[1], parts[2], parts[3]);
            }
          });
        }
      }
      recognitionRef.current = setTimeout(detect, 800);
    };

    detect();
  }, []);

  const handleMarkAttendance = async (studentId, name, rollNumber, department) => {
    // Throttle — avoid hammering API
    const key = `marked_${studentId}_${new Date().toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    try {
      const res = await attendanceAPI.mark(studentId);
      setRecognized({ name, rollNumber, department, time: res.data.attendance.time });
      setMarkedList(prev => [{ name, rollNumber, department, time: res.data.attendance.time }, ...prev]);
      showMessage('success', `✅ Attendance marked for ${name}`);
      playSuccessSound();
    } catch (err) {
      if (err.response?.data?.alreadyMarked) {
        setRecognized({ name, rollNumber, department, alreadyMarked: true });
        showMessage('info', `ℹ️ ${name} already marked attendance today`);
      }
    }
  };

  const showMessage = (type, msg) => {
    setMessage({ type, msg });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    loadModels();
    return () => stopRecognition();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Mark Attendance</div>
        <div className="page-subtitle">Face recognition automatically marks attendance</div>
      </div>
      <div className="page-body">
        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : message.type === 'info' ? 'info' : 'error'}`}>
            {message.msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Camera feed */}
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Live Recognition</span>
              {running && <span className="badge badge-green pulse">● LIVE</span>}
            </div>

            <div className="camera-section">
              <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', border: `2px solid ${running ? 'var(--accent)' : 'var(--border)'}`, boxShadow: running ? 'var(--shadow-accent)' : 'none' }}>
                <video ref={videoRef} style={{ width: '100%', maxWidth: 640, display: 'block' }} muted />
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%' }} />
                {!running && (
                  <div className="camera-overlay" style={{ minHeight: 300 }}>
                    <span style={{ fontSize: 48 }}>🎯</span>
                    <span>Click Start to begin recognition</span>
                  </div>
                )}
                {running && <div className="scan-line" />}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {!running ? (
                  <button className="btn btn-primary" onClick={startRecognition} disabled={loadingModels}>
                    {loadingModels ? <><span className="spin">⚙</span> Loading...</> : '▶ Start Recognition'}
                  </button>
                ) : (
                  <button className="btn btn-danger" onClick={stopRecognition}>
                    ⏹ Stop Recognition
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Recognition result */}
            {recognized && (
              <div className="recognition-result">
                <div style={{ fontSize: 32, marginBottom: 8 }}>
                  {recognized.alreadyMarked ? '⚠️' : '✅'}
                </div>
                <div className="recognition-name">{recognized.name}</div>
                <div className="recognition-info">{recognized.rollNumber} · {recognized.department}</div>
                {!recognized.alreadyMarked && recognized.time && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                    Marked at {recognized.time}
                  </div>
                )}
                {recognized.alreadyMarked && (
                  <div style={{ marginTop: 8 }}>
                    <span className="badge badge-blue">Already marked today</span>
                  </div>
                )}
              </div>
            )}

            {/* Marked today */}
            <div className="card" style={{ flex: 1 }}>
              <div className="card-title">Marked This Session</div>
              {markedList.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                  No attendance marked yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {markedList.map((r, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      animation: 'fadeInUp 0.3s ease'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.rollNumber}</div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'monospace' }}>{r.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
