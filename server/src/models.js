import mongoose from 'mongoose';

const suspect = new mongoose.Schema({ id: { type: String, required: true }, name: { type: String, required: true }, age: Number, occupation: String, biography: String, relationship: String, motive: String, alibi: String, relevantFacts: [String], portraitAssetUrl: String }, { _id: false });
const evidence = new mongoose.Schema({ id: { type: String, required: true }, type: { type: String, required: true }, title: String, description: String, content: mongoose.Schema.Types.Mixed, assetUrl: String, associatedSuspectIds: [String], discoveredAt: Date, reliability: String, createdAt: { type: Date, default: Date.now } }, { _id: false });
const timelineEvent = new mongoose.Schema({ id: String, timestamp: Date, description: String, relatedEvidenceIds: [String] }, { _id: false });
const mysterySchema = new mongoose.Schema({ sessionId: { type: String, required: true, index: true }, title: String, scenario: String, synopsis: String, genre: String, difficulty: String, length: String, status: { type: String, enum: ['generating','active','solved','failed','abandoned'], default: 'active' }, incident: mongoose.Schema.Types.Mixed, suspects: [suspect], publicEvidence: [evidence], timeline: [timelineEvent], solution: { culpritId: String, motive: String, method: String, explanation: String, supportingEvidenceIds: [String], misleadingClues: [mongoose.Schema.Types.Mixed], reconstruction: [mongoose.Schema.Types.Mixed] }, hintsUsed: { type: Number, default: 0, min: 0, max: 3 }, generationRequestId: String, createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now }, completedAt: Date });
mysterySchema.index({ sessionId: 1, createdAt: -1 });
mysterySchema.index({ generationRequestId: 1 }, { unique: true, sparse: true });
export const Mystery = mongoose.models.Mystery || mongoose.model('Mystery', mysterySchema);

const attemptSchema = new mongoose.Schema({ mysteryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mystery', unique: true }, sessionId: { type: String, required: true }, selectedSuspectId: String, isCorrect: Boolean, hintsUsed: Number, submittedAt: { type: Date, default: Date.now } });
export const Attempt = mongoose.models.Attempt || mongoose.model('Attempt', attemptSchema);

const progressSchema = new mongoose.Schema({ mysteryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mystery', required: true }, sessionId: { type: String, required: true }, reviewedEvidenceIds: [String], notes: { type: String, maxlength: 5000 }, updatedAt: { type: Date, default: Date.now } });
progressSchema.index({ mysteryId: 1, sessionId: 1 }, { unique: true });
export const InvestigationProgress = mongoose.models.InvestigationProgress || mongoose.model('InvestigationProgress', progressSchema);
