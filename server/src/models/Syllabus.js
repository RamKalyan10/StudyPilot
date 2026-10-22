import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  unitNumber: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  estimatedHours: { type: Number, default: 8, min: 1, max: 100 },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  topics: [{ type: String, trim: true }],
  summary: { type: String, default: '' },
  keyTerms: [{ type: String, trim: true }]
}, { _id: true });

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  title: { type: String, default: 'Subject Syllabus', trim: true },
  fileName: { type: String, default: '' },
  rawText: { type: String, default: '' },
  units: [unitSchema],
  totalUnits: { type: Number, default: 0 },
  totalTopics: { type: Number, default: 0 }
}, { timestamps: true });

schema.index({ user: 1, subject: 1 });

export default mongoose.model('Syllabus', schema);
