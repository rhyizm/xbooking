import mongoose, { Schema, Document } from 'mongoose';

export interface IGoogleToken extends Document {
  ownerId: string; // Clerk User ID
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoogleTokenSchema = new Schema<IGoogleToken>({
  ownerId: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// インデックス
GoogleTokenSchema.index({ ownerId: 1 });
GoogleTokenSchema.index({ expiryDate: 1 });

// 暗号化フィールド（必要に応じて）
// GoogleTokenSchema.plugin(require('mongoose-encryption'), {
//   encryptedFields: ['accessToken', 'refreshToken'],
//   secret: process.env.ENCRYPTION_SECRET
// });

export const GoogleToken = mongoose.models.GoogleToken || mongoose.model<IGoogleToken>('GoogleToken', GoogleTokenSchema);