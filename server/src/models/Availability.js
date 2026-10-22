import mongoose from 'mongoose';
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, start: { type: Date, required: true }, end: { type: Date, required: true }, label: { type: String, default: 'Study time', maxlength: 100 } }, { timestamps: true });
schema.pre('validate', function(next) { if (this.end <= this.start) this.invalidate('end', 'End must be after start'); next(); });
export default mongoose.model('Availability', schema);
