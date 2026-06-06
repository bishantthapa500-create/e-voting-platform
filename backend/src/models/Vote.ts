import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  _id: mongoose.Types.ObjectId;
  voterHash: string;           // HMAC(userId + electionId + secret) — anonymous
  electionId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  encryptedPayload: string;    // AES-256-GCM encrypted vote receipt
  timestamp: Date;
}

const voteSchema = new Schema<IVote>(
  {
    voterHash: { type: String, required: true },
    electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
    candidateId: { type: Schema.Types.ObjectId, required: true },
    encryptedPayload: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

// One vote per (voterHash, electionId) pair — enforced at DB level
voteSchema.index({ voterHash: 1, electionId: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>('Vote', voteSchema);
