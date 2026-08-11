import mongoose, { Schema, Document, Model } from 'mongoose';

export type SocialPlatform = 'linkedin' | 'instagram' | 'x' | 'facebook' | 'youtube';

export interface ISocialAccount extends Document {
	userId: mongoose.Types.ObjectId;
	platform: SocialPlatform;
	accountId: string;
	accountName: string;
	accessToken: string;
	refreshToken?: string;
	expiresAt?: Date;
	scopes: string[];
	connected: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const SocialAccountSchema: Schema = new Schema<ISocialAccount>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		platform: { type: String, enum: ['linkedin', 'instagram', 'x', 'facebook', 'youtube'], required: true },
		accountId: { type: String, required: true },
		accountName: { type: String, required: true },
		accessToken: { type: String, required: true },
		refreshToken: { type: String },
		expiresAt: { type: Date },
		scopes: { type: [String], default: [] },
		connected: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

SocialAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

export const SocialAccount: Model<ISocialAccount> =
	mongoose.models.SocialAccount || mongoose.model<ISocialAccount>('SocialAccount', SocialAccountSchema);
