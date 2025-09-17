import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  fullname: string;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema(
  {
    fullname: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Exclude password from queries by default
    },
    resetPasswordToken: {
      type: String,
      default: undefined,
      select: false, // Exclude from queries by default
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
      select: false, // Exclude from queries by default
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster email lookups
AdminSchema.index({ email: 1 });

// Prevent password from being returned in queries by default
AdminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  delete admin.resetPasswordToken;
  delete admin.resetPasswordExpires;
  return admin;
};

export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);
