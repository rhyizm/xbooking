import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantCalendar extends Document {
  tenantId: mongoose.Types.ObjectId;
  calendarId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'viewer'; // テナントのカレンダーに対する権限
  canBook: boolean; // 予約可能かどうか
  customSettings?: {
    displayName?: string; // テナント独自の表示名
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
    bookingSlotDuration?: number; // 予約スロットの長さ（分）
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TenantCalendarSchema = new Schema<ITenantCalendar>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  calendarId: {
    type: Schema.Types.ObjectId,
    ref: 'Calendar',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'viewer'],
    default: 'viewer',
  },
  canBook: {
    type: Boolean,
    default: false,
  },
  customSettings: {
    displayName: String,
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
      default: 15,
    },
    minAdvanceBooking: {
      type: Number,
      default: 1,
    },
    maxAdvanceBooking: {
      type: Number,
      default: 30,
    },
    bookingSlotDuration: {
      type: Number,
      default: 60,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// 複合インデックス（一つのテナントが同じカレンダーを重複して持つことを防ぐ）
TenantCalendarSchema.index({ tenantId: 1, calendarId: 1 }, { unique: true });

// 検索用インデックス
TenantCalendarSchema.index({ tenantId: 1, isActive: 1 });
TenantCalendarSchema.index({ calendarId: 1, isActive: 1 });

export const TenantCalendar = mongoose.models.TenantCalendar || mongoose.model<ITenantCalendar>('TenantCalendar', TenantCalendarSchema);