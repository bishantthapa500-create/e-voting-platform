import mongoose, { Document, Schema } from 'mongoose';

export type ElectionStatus = 'draft' | 'active' | 'closed';

export interface ICandidate {
  _id: mongoose.Types.ObjectId;
  name: string;
  party?: string;
  bio?: string;
  photoUrl?: string;
  voteCount: number;
}

export interface IElection extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: ElectionStatus;
  createdBy: mongoose.Types.ObjectId;
  candidates: ICandidate[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const candidateSchema = new Schema<ICandidate>(
  {
    name: { type: String, required: true, trim: true },
    party: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 500 },
    photoUrl: { type: String, trim: true },
    voteCount: { type: Number, default: 0, min: 0 },
  },
  { _id: true },
);

const electionSchema = new Schema<IElection>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    candidates: { type: [candidateSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Soft-delete filter — never return deleted elections by default
electionSchema.pre(/^find/, function (next) {
  const query = this as mongoose.Query<unknown, IElection>;
  const conditions = query.getFilter() as Record<string, unknown>;
  if (conditions['isDeleted'] === undefined) {
    query.where({ isDeleted: false });
  }
  next();
});

export const Election = mongoose.model<IElection>('Election', electionSchema);
