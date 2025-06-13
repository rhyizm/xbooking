import mongoose, { Schema, Document } from 'mongoose';

export interface ILineMessagingConfig extends Document {
  ownerId: string; // Clerk User ID
  channelAccessToken: string; // LINE Messaging API チャンネルアクセストークン
  channelSecret: string; // チャンネルシークレット
  channelId: string; // チャンネルID
  isActive: boolean;
  webhookUrl?: string;
  // 送信可能なLINEユーザーID一覧（オプション）
  allowedLineUserIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LineMessagingConfigSchema = new Schema<ILineMessagingConfig>({
  ownerId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  channelAccessToken: {
    type: String,
    required: true,
  },
  channelSecret: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  webhookUrl: {
    type: String,
  },
  allowedLineUserIds: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// インデックス
LineMessagingConfigSchema.index({ ownerId: 1 });

// 暗号化が必要な場合
// LineMessagingConfigSchema.plugin(require('mongoose-encryption'), {
//   encryptedFields: ['channelAccessToken', 'channelSecret'],
//   secret: process.env.ENCRYPTION_SECRET
// });

export const LineMessagingConfig = mongoose.models.LineMessagingConfig || mongoose.model<ILineMessagingConfig>('LineMessagingConfig', LineMessagingConfigSchema);