import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coordinates: { type: [Number], required: true }, // [longitude, latitude]
  profession: { type: String, required: true },
  predictedDemand: { type: Number, required: true, min: 0 },
  availableWorkers: { type: Number, required: true, min: 0 },
  activeWorkers: { type: Number, required: true, min: 0 },
  pendingBookings: { type: Number, required: true, min: 0 },
  bookingsLast7Days: { type: Number, required: true, min: 0 },
  bookingsLast30Days: { type: Number, required: true, min: 0 },
  averageCompletionTime: { type: Number, required: true, min: 0 },
  demandSupplyGap: { type: Number, required: true },
  requiredWorkers: { type: Number, required: true, min: 0 },
  suggestedIncomingWorkers: { type: Number, default: 0, min: 0 },
  demandLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  source: { type: String, enum: ['AI', 'RULE_BASED_FALLBACK'], required: true },
  lastUpdated: { type: Date, required: true },
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  workerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cooperative', default: null },
  workerName: { type: String, required: true },
  profession: { type: String, required: true },
  currentZone: { type: String, required: true },
  suggestedZone: { type: String, required: true },
  sourceCoordinates: { type: [Number], required: true },
  targetCoordinates: { type: [Number], required: true },
  distance: { type: Number, required: true, min: 0 },
  predictedDemand: { type: Number, required: true, min: 0 },
  availableWorkers: { type: Number, required: true, min: 0 },
  demandSupplyGap: { type: Number, required: true },
  expectedJobs: { type: Number, required: true, min: 0 },
  priority: { type: String, enum: ['High', 'Critical'], required: true },
  reason: { type: String, required: true },
  source: { type: String, enum: ['AI', 'RULE_BASED_FALLBACK'], required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'], default: 'PENDING' },
  generatedAt: { type: Date, required: true },
  respondedAt: { type: Date, default: null },
}, { _id: true });

const schema = new mongoose.Schema({
  key: { type: String, default: 'latest', unique: true, index: true },
  zones: { type: [zoneSchema], default: [] },
  recommendations: { type: [recommendationSchema], default: [] },
  source: { type: String, enum: ['AI', 'RULE_BASED_FALLBACK', 'MIXED'], required: true },
  lastUpdated: { type: Date, required: true, index: true },
  nextUpdateAt: { type: Date, required: true },
}, { timestamps: true });

export const ZoneDemandSnapshot = mongoose.model('ZoneDemandSnapshot', schema);
