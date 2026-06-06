import mongoose, { Document, Schema } from 'mongoose';

export type Role = 'VOTER' | 'ADMIN';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isVerified: boolean;
  otpCode?: string;
  otpExpiry?: Date;
  hasVoted: Map<string, boolean>; // electionId → true
  refreshTokens: string[];        // hashed refresh tokens
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['VOTER', 'ADMIN'],
      default: 'VOTER',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: String,
    otpExpiry: Date,
    hasVoted: {
      type: Map,
      of: Boolean,
      default: {},
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Never return sensitive fields by default
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.otpCode;
    delete ret.otpExpiry;
    delete ret.refreshTokens;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
