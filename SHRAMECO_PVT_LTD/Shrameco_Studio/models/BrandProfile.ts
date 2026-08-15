import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrandProfile extends Document {
	userId: string;
	companyName: string;
	industry: string;
	brandVoice: string;
	contentPillars: string[];
	bannedTopics: string[];
	bannedWords: string[];
	logoUrl?: string;
	colorPalette: string[];
	typography: {
		heading: string;
		body: string;
	};
	slogan?: string;
	cta?: string;
	socialHandle?: string;
	logoPosition?: string;
	updatedAt: Date;
}

const BrandProfileSchema: Schema = new Schema<IBrandProfile>(
	{
		userId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		companyName: {
			type: String,
			required: [true, 'Company name is required'],
			trim: true,
		},
		industry: {
			type: String,
			required: [true, 'Industry is required'],
			trim: true,
		},
		brandVoice: {
			type: String,
			required: [true, 'Brand voice is required'],
		},
		contentPillars: {
			type: [String],
			default: [],
		},
		bannedTopics: {
			type: [String],
			default: [],
		},
		bannedWords: {
			type: [String],
			default: [],
		},
		logoUrl: {
			type: String,
			default: '',
		},
		colorPalette: {
			type: [String],
			default: ['#1C2427', '#3D8090', '#B8D4D8', '#6B7F8A'],
		},
		typography: {
			heading: { type: String, default: 'Outfit' },
			body: { type: String, default: 'Inter' },
		},
		slogan: { type: String, default: '' },
		cta: { type: String, default: '' },
		socialHandle: { type: String, default: '' },
		logoPosition: { type: String, default: 'top-right' },
	},
	{
		timestamps: true,
	}
);

export const BrandProfile: Model<IBrandProfile> =
	mongoose.models.BrandProfile || mongoose.model<IBrandProfile>('BrandProfile', BrandProfileSchema);
