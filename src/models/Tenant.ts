import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  ownerId: string; // Clerk User ID
  googleCalendarId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  ownerId: {
    type: String,
    required: true,
  },
  googleCalendarId: {
    type: String,
    sparse: true,
  },
}, {
  timestamps: true,
});

// インデックス
TenantSchema.index({ ownerId: 1 });
TenantSchema.index({ googleCalendarId: 1 });

export const Tenant = mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
