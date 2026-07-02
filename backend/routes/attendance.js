const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// GET all attendance records (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { date, department } = req.query;
    let query = {};

    if (date) query.date = date;
    if (department) query.department = department;

    const records = await Attendance.find(query).sort({ markedAt: -1 });
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = await Student.countDocuments();
    const presentToday = await Attendance.countDocuments({ date: today, status: 'present' });
    const absentToday = totalStudents - presentToday;
    const attendanceRate = totalStudents > 0
      ? Math.round((presentToday / totalStudents) * 100)
      : 0;

    res.json({
      success: true,
      summary: {
        totalStudents,
        presentToday,
        absentToday,
        attendanceRate
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST mark attendance
router.post('/mark', async (req, res) => {
  try {
    const { studentId } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Check if already marked
    const existing = await Attendance.findOne({ studentId, date: today });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Attendance already marked for today',
        alreadyMarked: true
      });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    const attendance = new Attendance({
      studentId,
      studentName: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      date: today,
      time,
      status: 'present'
    });

    await attendance.save();
    res.json({
      success: true,
      message: `Attendance marked for ${student.name}`,
      attendance,
      student
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE attendance record
router.delete('/:id', async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
