import mongoose, { Document, Schema } from 'mongoose';

export interface IElection extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const electionSchema = new Schema<IElection>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Election = mongoose.model<IElection>('Election', electionSchema);
