import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  preferences: { dailyLimitMinutes: { type: Number, default: 180, min: 30, max: 720 }, preferredSessionMinutes: { type: Number, default: 50, min: 15, max: 120 } }
}, { timestamps: true });
export default mongoose.model('User', schema);
