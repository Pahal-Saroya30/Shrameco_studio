import mongoose, { Schema, Document, Model } from 'mongoose';

export type SocialPlatform = 'linkedin' | 'instagram' | 'x' | 'facebook' | 'youtube';

export interface ISocialAccount extends Document {
	userId: string;
	platform: SocialPlatform;
	accountId: string;
	accountName: string;
	accessToken: string;
	refreshToken?: string;
	expiresAt?: Date;
	scopes: string[];
	connected: boolean;
	avatarUrl?: string;
	createdAt: Date;
	updatedAt: Date;
}

const SocialAccountSchema: Schema = new Schema<ISocialAccount>(
	{
		userId: { type: String, required: true },
		platform: { type: String, enum: ['linkedin', 'instagram', 'x', 'facebook', 'youtube'], required: true },
		accountId: { type: String, required: true },
		accountName: { type: String, required: true },
		accessToken: { type: String, required: true },
		refreshToken: { type: String },
		expiresAt: { type: Date },
		scopes: { type: [String], default: [] },
		connected: { type: Boolean, default: true },
		avatarUrl: { type: String, default: '' },
	},
	{ timestamps: true }
);

SocialAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

export const SocialAccount: Model<ISocialAccount> =
	mongoose.models.SocialAccount ||
	mongoose.model<ISocialAccount>('SocialAccount', SocialAccountSchema, 'connectedaccounts');
