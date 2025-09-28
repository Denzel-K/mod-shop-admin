import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReply {
  body: string;
  to: string; // original sender email
  from: string; // official mod shop email (SMTP_FROM)
  createdAt: Date;
  repliedById?: string; // admin id who replied
  repliedByName?: string; // admin fullname
  repliedByEmail?: string; // admin email
}

export interface IMessage extends Document {
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  createdAt: Date;
  status: 'new' | 'replied' | 'closed';
  replies: IReply[];
}

const ReplySchema = new Schema<IReply>({
  body: { type: String, required: true },
  to: { type: String, required: true },
  from: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  repliedById: { type: String, default: undefined },
  repliedByName: { type: String, default: undefined },
  repliedByEmail: { type: String, default: undefined },
});

const MessageSchema = new Schema<IMessage>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String },
  subject: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['new', 'replied', 'closed'], default: 'new' },
  replies: { type: [ReplySchema], default: [] },
});

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
