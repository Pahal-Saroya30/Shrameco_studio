import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
	email: string;
	passwordHash: string;
	createdAt: Date;
}

const UserSchema: Schema = new Schema<IUser>({
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
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
