import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarSettings extends Document {
  tenantId: mongoose.Types.ObjectId;
  isPublic: boolean;
  showDetails: boolean;
  bookingEnabled: boolean;
  workingHours?: {
    [key: string]: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  bufferTime?: number; // 予約間のバッファ時間（分）
  minAdvanceBooking?: number; // 最短予約時間（時間）
  maxAdvanceBooking?: number; // 最長予約期間（日）
  createdAt: Date;
  updatedAt: Date;
}

const CalendarSettingsSchema = new Schema<ICalendarSettings>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    unique: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  showDetails: {
    type: Boolean,
    default: false,
  },
  bookingEnabled: {
    type: Boolean,
    default: true,
  },
  workingHours: {
    type: Map,
    of: {
      enabled: Boolean,
      start: String,
      end: String,
    },
    default: {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '18:00' },
      saturday: { enabled: false, start: '09:00', end: '18:00' },
      sunday: { enabled: false, start: '09:00', end: '18:00' },
    },
  },
  bufferTime: {
    type: Number,
    default: 15, // 15分
  },
  minAdvanceBooking: {
    type: Number,
    default: 1, // 1時間前
  },
  maxAdvanceBooking: {
    type: Number,
    default: 30, // 30日先まで
  },
}, {
  timestamps: true,
});

export const CalendarSettings = mongoose.models.CalendarSettings || mongoose.model<ICalendarSettings>('CalendarSettings', CalendarSettingsSchema);
