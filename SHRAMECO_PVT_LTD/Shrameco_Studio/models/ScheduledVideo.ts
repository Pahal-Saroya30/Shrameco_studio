import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScheduledVideo extends Document {
	userId: string;
	platform: 'youtube' | 'instagram' | 'linkedin' | 'x' | 'facebook';
	caption: string;
	imageUrl?: string;
	format: 'video' | 'short' | 'post' | 'reel' | 'story' | 'carousel' | 'article';
	status: 'queued' | 'sent' | 'failed' | 'draft';
	scheduledAt: Date;
	publishOption: 'next_available' | 'prioritize' | 'now' | 'custom';
	postUrl?: string;
	createdAt: Date;
	updatedAt: Date;

	// LinkedIn specific extensions
	slides?: { imageUrl: string }[];
	link?: string;
	linkedInContentType?: string;
	documentDataUrl?: string;
	documentName?: string;
	articleTitle?: string;
	articleDescription?: string;
	articleThumbnail?: string;
	videoDataUrl?: string;
	videoName?: string;
	videoType?: string;
	videoTitle?: string;
}

const ScheduledVideoSchema: Schema = new Schema<IScheduledVideo>(
	{
		userId: {
			type: String,
			required: true,
			index: true,
		},
		platform: {
			type: String,
			enum: ['youtube', 'instagram', 'linkedin', 'x', 'facebook'],
			default: 'youtube',
			required: true,
		},
		caption: {
			type: String,
			required: true,
		},
		imageUrl: {
			type: String,
			default: '',
		},
		format: {
			type: String,
			enum: ['video', 'short', 'post', 'reel', 'story', 'carousel', 'article'],
			default: 'video',
		},
		status: {
			type: String,
			enum: ['queued', 'sent', 'failed', 'draft'],
			default: 'queued',
		},
		scheduledAt: {
			type: Date,
			required: true,
		},
		publishOption: {
			type: String,
			enum: ['next_available', 'prioritize', 'now', 'custom'],
			default: 'next_available',
		},
		postUrl: {
			type: String,
			default: '',
		},

		// LinkedIn specific extensions
		slides: {
			type: [
				{
					imageUrl: String,
				},
			],
			default: undefined,
		},
		link: {
			type: String,
		},
		linkedInContentType: {
			type: String,
		},
		documentDataUrl: {
			type: String,
		},
		documentName: {
			type: String,
		},
		articleTitle: {
			type: String,
		},
		articleDescription: {
			type: String,
		},
		articleThumbnail: {
			type: String,
		},
		videoDataUrl: {
			type: String,
		},
		videoName: {
			type: String,
		},
		videoType: {
			type: String,
		},
		videoTitle: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

export const ScheduledVideo: Model<IScheduledVideo> =
	mongoose.models.ScheduledVideo || mongoose.model<IScheduledVideo>('ScheduledVideo', ScheduledVideoSchema);
