import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
	name?: string;
	email: string;
	passwordHash: string;
	companyName?: string;
	resetTokenHash?: string;
	resetTokenExpires?: Date;
	createdAt: Date;
}

const UserSchema: Schema = new Schema<IUser>({
	name: {
		type: String,
		default: '',
	},
	email: {
		type: String,
		required: [true, 'Email is required'],
		unique: true,
		lowercase: true,
		trim: true,
	},
	passwordHash: {
		type: String,
		required: [true, 'Password hash is required'],
	},
	companyName: {
		type: String,
		default: '',
	},
	resetTokenHash: {
		type: String,
		default: undefined,
	},
	resetTokenExpires: {
		type: Date,
		default: undefined,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
