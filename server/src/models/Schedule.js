import mongoose from 'mongoose';
const sessionSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  title: { type: String, required: true }, subjectName: { type: String, default: '' },
  start: { type: Date, required: true }, end: { type: Date, required: true }, plannedMinutes: { type: Number, required: true },
  status: { type: String, enum: ['planned', 'in-progress', 'completed', 'missed'], default: 'planned' },
  actualMinutes: { type: Number, default: 0 }, confidenceAfter: { type: Number, min: 1, max: 5 }, completedAt: Date
}, { timestamps: true });
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, version: { type: Number, required: true }, reason: { type: String, default: 'initial' }, sessions: [sessionSchema], unscheduled: [{ task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }, title: String, remainingMinutes: Number, reason: String }], summary: { totalRequestedMinutes: Number, scheduledMinutes: Number, unscheduledMinutes: Number, conflicts: Number, feasible: Boolean } }, { timestamps: true });
schema.index({ user: 1, version: -1 });
export default mongoose.model('Schedule', schema);
