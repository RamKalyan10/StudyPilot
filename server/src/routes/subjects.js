import { Router } from 'express';
import Subject from '../models/Subject.js';
import Syllabus from '../models/Syllabus.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parseSyllabusText } from '../services/syllabusParser.js';
import { extractTextFromDocument } from '../services/docParser.js';

const r = Router();
r.use(auth);

r.get('/', asyncHandler(async (req, res) => {
  res.json(await Subject.find({ user: req.user._id }).sort('name'));
}));

r.post('/', asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) {
    return res.status(400).json({ message: 'Subject name is required.' });
  }

  const subject = await Subject.create({
    user: req.user._id,
    name: req.body.name.trim(),
    color: req.body.color || '#8b7cff',
    semester: req.body.semester || ''
  });

  // Optional syllabus document provided during subject creation (text or fileBase64)
  let rawText = req.body.syllabusText || '';
  let fileName = req.body.syllabusFileName || 'syllabus.txt';

  if (!rawText.trim() && req.body.syllabusFileBase64) {
    try {
      const base64Data = req.body.syllabusFileBase64.includes('base64,')
        ? req.body.syllabusFileBase64.split('base64,')[1]
        : req.body.syllabusFileBase64;
      const buffer = Buffer.from(base64Data, 'base64');
      const extracted = await extractTextFromDocument(buffer, fileName, req.body.syllabusMimeType || '');
      rawText = extracted.text;
    } catch (err) {
      console.warn('Could not extract text from uploaded syllabus document:', err.message);
    }
  }

  if (rawText && rawText.trim()) {
    try {
      const parsed = parseSyllabusText(rawText, subject.name);
      await Syllabus.create({
        user: req.user._id,
        subject: subject._id,
        title: req.body.syllabusTitle || `${subject.name} Syllabus`,
        fileName,
        rawText,
        units: parsed.units,
        totalUnits: parsed.totalUnits,
        totalTopics: parsed.totalTopics
      });
    } catch (err) {
      console.warn('Could not parse optional syllabus on subject creation:', err.message);
    }
  }

  res.status(201).json(subject);
}));

r.patch('/:id', asyncHandler(async (req, res) => {
  const x = await Subject.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { name: req.body.name, color: req.body.color, semester: req.body.semester } },
    { new: true, runValidators: true }
  );
  if (!x) return res.status(404).json({ message: 'Subject not found.' });
  res.json(x);
}));

r.delete('/:id', asyncHandler(async (req, res) => {
  const x = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!x) return res.status(404).json({ message: 'Subject not found.' });
  await Syllabus.deleteMany({ subject: req.params.id, user: req.user._id });
  res.json({ message: 'Subject and associated syllabus deleted.' });
}));
export default r;
