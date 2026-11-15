/**
 * @file subjects.js
 * @description Academic Subjects & Courses Route Handlers.
 * Supports CRUD operations on subjects and handles optional syllabus attachment on subject creation.
 */

import { Router } from 'express';
import Subject from '../models/Subject.js';
import Syllabus from '../models/Syllabus.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { parseSyllabusText } from '../services/syllabusParser.js';
import { extractTextFromDocument } from '../services/docParser.js';

const router = Router();
router.use(auth);

/**
 * @route   GET /api/subjects
 * @desc    Retrieve all subjects belonging to the authenticated student
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const subjects = await Subject.find({ user: req.user._id }).sort('name');
    res.json(subjects);
  })
);

/**
 * @route   POST /api/subjects
 * @desc    Create a new subject; optionally parse & attach an uploaded syllabus document
 * @access  Private
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.body.name?.trim()) {
      return res.status(400).json({ message: 'Subject name is required.' });
    }

    const subject = await Subject.create({
      user: req.user._id,
      name: req.body.name.trim(),
      color: req.body.color || '#f97316',
      semester: req.body.semester || ''
    });

    // Handle optional syllabus document provided during subject creation (text or fileBase64)
    let rawText = req.body.syllabusText || '';
    let fileName = req.body.syllabusFileName || 'syllabus.txt';

    if (!rawText.trim() && req.body.syllabusFileBase64) {
      try {
        const base64Data = req.body.syllabusFileBase64.includes('base64,')
          ? req.body.syllabusFileBase64.split('base64,')[1]
          : req.body.syllabusFileBase64;
        const buffer = Buffer.from(base64Data, 'base64');
        const extracted = await extractTextFromDocument(
          buffer,
          fileName,
          req.body.syllabusMimeType || ''
        );
        rawText = extracted.text;
      } catch (err) {
        console.warn('Could not extract text from uploaded syllabus document:', err.message);
      }
    }

    // If syllabus text is available, parse into curriculum units and persist
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
  })
);

/**
 * @route   PATCH /api/subjects/:id
 * @desc    Update subject name, color code, or semester tag
 * @access  Private
 */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const updated = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { name: req.body.name, color: req.body.color, semester: req.body.semester } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    res.json(updated);
  })
);

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete a subject and cascade delete all its associated syllabus documents
 * @access  Private
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    // Cascade cleanup
    await Syllabus.deleteMany({ subject: req.params.id, user: req.user._id });
    res.json({ message: 'Subject and associated syllabus deleted successfully.' });
  })
);

export default router;
