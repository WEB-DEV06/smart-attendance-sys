const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// GET all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().select('-faceDescriptor');
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all students with face descriptors (for recognition)
router.get('/descriptors', async (req, res) => {
  try {
    const students = await Student.find({ faceDescriptor: { $exists: true, $ne: [] } });
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST register new student
router.post('/register', async (req, res) => {
  try {
    const { name, rollNumber, department, mobileNumber, faceDescriptor, photo } = req.body;

    // Check if roll number already exists
    const existing = await Student.findOne({ rollNumber });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Roll number already registered' });
    }

    const student = new Student({
      name,
      rollNumber,
      department,
      mobileNumber,
      faceDescriptor: faceDescriptor || [],
      photo: photo || ''
    });

    await student.save();
    res.json({ success: true, message: 'Student registered successfully', student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update student
router.put('/:id', async (req, res) => {
  try {
    const { name, department, mobileNumber } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, department, mobileNumber },
      { new: true }
    ).select('-faceDescriptor');

    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, message: 'Student updated', student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    res.json({ success: true, message: 'Student removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
