import { Router } from 'express';
import Syllabus from '../models/Syllabus.js';
import Subject from '../models/Subject.js';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parseSyllabusText } from '../services/syllabusParser.js';
import { extractTextFromDocument } from '../services/docParser.js';

const router = Router();
router.use(auth);

// Extract text from uploaded document (pdf, docx, txt, md, etc.)
router.post('/extract-document', asyncHandler(async (req, res) => {
  const { fileBase64, fileName, mimeType } = req.body;

  if (!fileBase64) {
    return res.status(400).json({ message: 'No file data received.' });
  }

  try {
    const base64Data = fileBase64.includes('base64,')
      ? fileBase64.split('base64,')[1]
      : fileBase64;

    const buffer = Buffer.from(base64Data, 'base64');
    const extracted = await extractTextFromDocument(buffer, fileName || 'document.pdf', mimeType || '');

    if (!extracted.text || !extracted.text.trim()) {
      return res.status(422).json({
        message: 'Could not extract readable text from this document. Please ensure it contains selectable text, or paste syllabus manually.'
      });
    }

    const preview = parseSyllabusText(extracted.text, (fileName || 'Document').replace(/\.[^/.]+$/, ''));

    res.json({
      text: extracted.text,
      fileName: fileName || 'document',
      detectedType: extracted.detectedType,
      pages: extracted.pages,
      units: preview.units,
      totalUnits: preview.totalUnits,
      totalTopics: preview.totalTopics
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to extract text from document.' });
  }
}));

// Get all syllabi for logged in student
router.get('/', asyncHandler(async (req, res) => {
  const list = await Syllabus.find({ user: req.user._id })
    .populate('subject', 'name color semester')
    .sort({ updatedAt: -1 });
  res.json(list);
}));

// Get syllabus for a specific subject
router.get('/subject/:subjectId', asyncHandler(async (req, res) => {
  const syllabus = await Syllabus.findOne({
    user: req.user._id,
    subject: req.params.subjectId
  }).populate('subject', 'name color semester');
  res.json(syllabus || null);
}));

// Upload or parse syllabus text
router.post('/', asyncHandler(async (req, res) => {
  let { subjectId, rawText, fileName, title, fileBase64, mimeType } = req.body;

  if (!subjectId) {
    return res.status(400).json({ message: 'Subject ID is required.' });
  }

  // If fileBase64 was uploaded instead of rawText
  if ((!rawText || !rawText.trim()) && fileBase64) {
    try {
      const base64Data = fileBase64.includes('base64,')
        ? fileBase64.split('base64,')[1]
        : fileBase64;
      const buffer = Buffer.from(base64Data, 'base64');
      const extracted = await extractTextFromDocument(buffer, fileName || 'syllabus.pdf', mimeType || '');
      rawText = extracted.text;
    } catch (err) {
      return res.status(400).json({ message: `Could not parse uploaded file: ${err.message}` });
    }
  }

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ message: 'Syllabus content or document is required.' });
  }

  const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
  if (!subject) {
    return res.status(404).json({ message: 'Subject not found.' });
  }

  // Parse and summarize units
  const parsed = parseSyllabusText(rawText, subject.name);

  // Check if a syllabus already exists for this subject, update or create
  let syllabus = await Syllabus.findOne({ user: req.user._id, subject: subjectId });

  if (syllabus) {
    syllabus.rawText = rawText;
    syllabus.fileName = fileName || syllabus.fileName || 'syllabus.txt';
    syllabus.title = title || `${subject.name} Syllabus`;
    syllabus.units = parsed.units;
    syllabus.totalUnits = parsed.totalUnits;
    syllabus.totalTopics = parsed.totalTopics;
    await syllabus.save();
  } else {
    syllabus = await Syllabus.create({
      user: req.user._id,
      subject: subjectId,
      fileName: fileName || 'syllabus.txt',
      title: title || `${subject.name} Syllabus`,
      rawText,
      units: parsed.units,
      totalUnits: parsed.totalUnits,
      totalTopics: parsed.totalTopics
    });
  }

  res.status(201).json(await syllabus.populate('subject', 'name color semester'));
}));

// Delete syllabus
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await Syllabus.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });
  if (!deleted) {
    return res.status(404).json({ message: 'Syllabus not found.' });
  }
  res.json({ message: 'Syllabus removed successfully.' });
}));

// One-click convert syllabus units into StudyPilot tasks!
router.post('/:id/create-tasks', asyncHandler(async (req, res) => {
  const syllabus = await Syllabus.findOne({
    _id: req.params.id,
    user: req.user._id
  }).populate('subject');

  if (!syllabus) {
    return res.status(404).json({ message: 'Syllabus not found.' });
  }

  const { unitNumbers } = req.body; // optional filter
  const targetUnits = unitNumbers && unitNumbers.length > 0
    ? syllabus.units.filter(u => unitNumbers.includes(u.unitNumber))
    : syllabus.units;

  if (targetUnits.length === 0) {
    return res.status(400).json({ message: 'No units selected to create tasks.' });
  }

  const createdTasks = [];
  const now = Date.now();

  for (let i = 0; i < targetUnits.length; i++) {
    const unit = targetUnits[i];
    // Distribute deadlines across upcoming weeks: +5 days, +10 days, +15 days, etc.
    const deadline = new Date(now + (i + 1) * 5 * 86400000);

    const difficultyMap = { Easy: 2, Medium: 3, Hard: 5 };
    const difficultyVal = difficultyMap[unit.difficulty] || 3;

    const task = await Task.create({
      user: req.user._id,
      subject: syllabus.subject._id,
      title: `${unit.title} (Unit ${unit.unitNumber})`,
      type: 'topic',
      deadline,
      estimatedMinutes: Math.min(600, unit.estimatedHours * 60),
      remainingMinutes: Math.min(600, unit.estimatedHours * 60),
      importance: 4,
      difficulty: difficultyVal,
      confidence: 2,
      notes: `Topics covered:\n• ${unit.topics.slice(0, 8).join('\n• ')}`
    });

    createdTasks.push(task);
  }

  res.status(201).json({
    message: `Successfully created ${createdTasks.length} study tasks from syllabus!`,
    tasks: createdTasks
  });
}));

export default router;
