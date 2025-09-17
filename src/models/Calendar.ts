import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendar extends Document {
  googleCalendarId: string; // Google Calendar ID
  name: string;
  description?: string;
  ownerId: string; // Clerk User ID of the calendar owner
  isPublic: boolean;
  showDetails: boolean;
  timeZone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarSchema = new Schema<ICalendar>({
  googleCalendarId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  ownerId: {
    type: String,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  showDetails: {
    type: Boolean,
    default: false,
  },
  timeZone: {
    type: String,
    default: 'UTC',
  },
}, {
  timestamps: true,
});

// インデックス
CalendarSchema.index({ ownerId: 1 });
CalendarSchema.index({ isPublic: 1 });

export const Calendar = mongoose.models.Calendar || mongoose.model<ICalendar>('Calendar', CalendarSchema);
