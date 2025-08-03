import mongoose, { Schema, Document } from 'mongoose';

export interface IStripeAccount extends Document {
  ownerId: string;
  stripeAccountId: string;
  accountType: 'express' | 'standard';
  onboardingCompleted: boolean;
  accountEnabled: boolean;
  merchantEmail?: string;
  businessName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StripeAccountSchema: Schema = new Schema(
  {
    ownerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripeAccountId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    accountType: {
      type: String,
      enum: ['express', 'standard'],
      default: 'express',
      required: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    accountEnabled: {
      type: Boolean,
      default: false,
    },
    merchantEmail: {
      type: String,
      required: false,
    },
    businessName: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.StripeAccount || 
  mongoose.model<IStripeAccount>('StripeAccount', StripeAccountSchema);