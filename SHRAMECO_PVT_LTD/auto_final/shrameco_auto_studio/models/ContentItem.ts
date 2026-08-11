import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContentItem extends Document {
	userId: mongoose.Types.ObjectId;
	topic: string;
	platform: 'instagram' | 'linkedin' | 'x';
	generatedText: string;
	templateId: string;
	renderedImageUrl?: string;
	status: 'draft' | 'final';
	createdAt: Date;
	updatedAt: Date;
}

const ContentItemSchema: Schema = new Schema<IContentItem>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		topic: {
			type: String,
			required: [true, 'Topic is required'],
			trim: true,
		},
		platform: {
			type: String,
			enum: ['instagram', 'linkedin', 'x'],
			required: true,
		},
		generatedText: {
			type: String,
			required: true,
		},
		templateId: {
			type: String,
			required: true,
			default: 'quote-card',
		},
		renderedImageUrl: {
			type: String,
			default: '',
		},
		status: {
			type: String,
			enum: ['draft', 'final'],
			default: 'draft',
		},
	},
	{
		timestamps: true,
	}
);

export const ContentItem: Model<IContentItem> =
	mongoose.models.ContentItem || mongoose.model<IContentItem>('ContentItem', ContentItemSchema);
