import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order', 'promotion', 'account'], required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = model('Notification', notificationSchema);
