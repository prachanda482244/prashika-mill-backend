// models/skatingSessionModel.js
import mongoose from "mongoose";
const skatingSessionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    timeSlots: [
      {
        startTime: String,
        endTime: String,
        maxCapacity: Number,
        bookedSlots: { type: Number, default: 0 },
        price: Number,
        available: { type: Boolean, default: true },
      },
    ],
    totalCapacity: {
      type: Number,
      required: true,
    },
    availableSlots: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SkatingSession = mongoose.model(
  "SkatingSession",
  skatingSessionSchema
);
