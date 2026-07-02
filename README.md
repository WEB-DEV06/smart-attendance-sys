# 🎓 AttendX — Smart Attendance System

A modern web-based Smart Attendance System with **real-time face recognition**, built with React, Node.js, Express, MongoDB, and face-api.js.

---

## ✨ Features

| Feature | Details |
|---|---|
| 📷 Face Recognition | Automatic attendance via webcam using face-api.js |
| 🔁 Anti-Duplicate | One attendance mark per student per day |
| 🔔 Sound Alert | Plays a chime when attendance is successfully marked |
| 📊 Dashboard | Live stats: Total, Present, Absent, Attendance % |
| 📋 Records | Filter by date/department, export to PDF |
| 👥 Student Management | Add, edit, remove students |
| 🌙 Dark UI | Modern dark industrial theme |

---

## 🗂 Project Structure

```
smart-attendance-system/
├── backend/
│   ├── server.js              ← Express entry point
│   ├── .env                   ← Environment config
│   ├── package.json
│   ├── models/
│   │   ├── Student.js         ← Student schema
│   │   └── Attendance.js      ← Attendance schema
│   └── routes/
│       ├── students.js        ← Student CRUD APIs
│       └── attendance.js      ← Attendance APIs
│
├── frontend/
    ├── public/
    │   ├── index.html
    │   └── models/            ← ⚠️ face-api.js weights go here
    ├── package.json
    └── src/
        ├── App.jsx            ← Root app with sidebar nav
        ├── index.js
        ├── index.css          ← Global dark theme styles
        ├── utils/
        │   ├── api.js         ← Axios API helpers
        │   └── sound.js       ← Audio feedback utility
        └── pages/
            ├── Dashboard.jsx
            ├── RegisterStudent.jsx
            ├── MarkAttendance.jsx
            ├── ViewRecords.jsx
            └── ManageStudents.jsx
```

---

## 🚀 Setup Instructions (Windows)

### Prerequisites

1. **Node.js** (LTS) — https://nodejs.org  
   ✅ Check: Open CMD and type `node -v`

2. **MongoDB Community** — https://www.mongodb.com/try/download/community  
   ✅ During install: check "Install MongoDB as a Service"

3. **VS Code** — already installed ✅

---

### Step 1 — Download face-api.js Model Files

These are AI model weights needed for face detection. Download manually:

🔗 https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Download these **6 files**:
```
ssd_mobilenetv1_model-weights_manifest.json
ssd_mobilenetv1_model-shard1
face_landmark_68_model-weights_manifest.json
face_landmark_68_model-shard1
face_recognition_model-weights_manifest.json
face_recognition_model-shard1
```

📁 Place them in: `frontend/public/models/`

---

### Step 2 — Run Setup Script

Double-click `setup.bat`

This will:
- Install backend Node.js packages
- Install frontend React packages
- Verify model folder exists

---

### Step 3 — Start the Application

Double-click `start.bat`

This opens **two terminal windows**:
- Terminal 1: Backend on http://localhost:5000
- Terminal 2: Frontend on http://localhost:3000

Your browser will open automatically!

---

### Step 4 — Using the App

1. **Register Student**
   - Fill in Name, Roll Number, Department, Mobile
   - Click "Open Camera" → look at the camera
   - Click "Capture Face" → click "Save Student"

2. **Mark Attendance**
   - Click "Start Recognition"
   - Student stands in front of camera
   - Green box + name = recognized ✅
   - Attendance is marked + sound plays

3. **View Records**
   - Filter by date or department
   - Click "Download PDF" to export

4. **Dashboard**
   - Auto-refreshes every 30 seconds

---

## 🔌 API Reference

### Students
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students` | List all students |
| GET | `/api/students/descriptors` | Get students with face data |
| POST | `/api/students/register` | Register new student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/attendance` | Get records (filter: date, department) |
| GET | `/api/attendance/summary` | Dashboard stats |
| POST | `/api/attendance/mark` | Mark attendance |
| DELETE | `/api/attendance/:id` | Delete record |

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---|---|
| MongoDB not connecting | Open Windows Services → Start "MongoDB" |
| Camera not working | Allow camera permissions in browser (localhost) |
| Face not detected | Ensure good lighting, look straight at camera |
| Models not loading | Check all 6 files are in `frontend/public/models/` |
| Port already in use | Change PORT in `backend/.env` |

---

## 🛠 Tech Stack

- **Frontend**: React 18, face-api.js, Axios, jsPDF
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Face AI**: face-api.js (SSD MobileNet + FaceNet)

---

*Built with ❤️ — AttendX Smart Attendance System*
