import mongoose, { Document, Schema } from 'mongoose';

export type Role = 'VOTER' | 'ADMIN';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['VOTER', 'ADMIN'],
      default: 'VOTER',
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>('User', userSchema);
