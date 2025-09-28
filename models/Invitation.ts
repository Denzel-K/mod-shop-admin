import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvitation extends Document {
  email: string;
  fullname: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  invitedBy?: Types.ObjectId; // inviter admin id
  role: 'super-admin' | 'manager' | 'curator';
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: undefined,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: undefined,
    },
    role: {
      type: String,
      enum: ['super-admin', 'manager', 'curator'],
      default: 'curator',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

InvitationSchema.index({ email: 1, acceptedAt: 1 });

export default mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema);
