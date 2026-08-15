import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IYoutubeUpload extends Document {
	userId: string;
	title: string;
	description: string;
	tags: string[];
	visibility: 'public' | 'private' | 'unlisted';
	categoryId: string;
	format: 'video' | 'short';
	videoUrl: string;
	videoId?: string;
	status: 'processing' | 'succeeded' | 'failed';
	copyrightStatus?: string;
	createdAt: Date;
	updatedAt: Date;
}

const YoutubeUploadSchema: Schema = new Schema<IYoutubeUpload>(
	{
		userId: {
			type: String,
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
		},
		tags: {
			type: [String],
			default: [],
		},
		visibility: {
			type: String,
			enum: ['public', 'private', 'unlisted'],
			default: 'public',
		},
		categoryId: {
			type: String,
			default: '22',
		},
		format: {
			type: String,
			enum: ['video', 'short'],
			required: true,
		},
		videoUrl: {
			type: String,
			required: true,
		},
		videoId: {
			type: String,
		},
		status: {
			type: String,
			enum: ['processing', 'succeeded', 'failed'],
			default: 'succeeded',
		},
		copyrightStatus: {
			type: String,
			default: 'Passed',
		},
	},
	{
		timestamps: true,
	}
);

export const YoutubeUpload: Model<IYoutubeUpload> =
	mongoose.models.YoutubeUpload || mongoose.model<IYoutubeUpload>('YoutubeUpload', YoutubeUploadSchema);
