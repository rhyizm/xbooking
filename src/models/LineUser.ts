import mongoose, { Schema, Document } from 'mongoose';

export interface ILineUser extends Document {
  ownerId: string; // Clerk User ID (Botオーナー)
  lineUserId: string; // LINE Messaging API User ID
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  language?: string;
  isFollowing: boolean; // Botをフォローしているか
  followedAt?: Date;
  unfollowedAt?: Date;
  tags?: string[]; // ユーザーのタグ（管理用）
  notes?: string; // メモ
  createdAt: Date;
  updatedAt: Date;
}

const LineUserSchema = new Schema<ILineUser>({
  ownerId: {
    type: String,
    required: true,
    index: true,
  },
  lineUserId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  pictureUrl: {
    type: String,
  },
  statusMessage: {
    type: String,
  },
  language: {
    type: String,
  },
  isFollowing: {
    type: Boolean,
    default: true,
  },
  followedAt: {
    type: Date,
    default: Date.now,
  },
  unfollowedAt: {
    type: Date,
  },
  tags: [{
    type: String,
  }],
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// 複合インデックス（同じBotオーナーが同じLINEユーザーを重複登録しない）
LineUserSchema.index({ ownerId: 1, lineUserId: 1 }, { unique: true });

// 検索用インデックス
LineUserSchema.index({ ownerId: 1, isFollowing: 1 });
LineUserSchema.index({ ownerId: 1, tags: 1 });

export const LineUser = mongoose.models.LineUser || mongoose.model<ILineUser>('LineUser', LineUserSchema);