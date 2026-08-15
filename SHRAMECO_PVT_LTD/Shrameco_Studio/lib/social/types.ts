export type SocialPlatform = 'linkedin' | 'instagram' | 'x' | 'facebook' | 'youtube';

export type LinkedInContentType = 'post' | 'article' | 'text' | 'carousel' | 'video' | 'poll';

export interface AuthorizeUrlInput {
	redirectUri: string;
	state: string;
	pkceVerifier?: string;
}

export interface AuthorizeUrlResult {
	url: string;
	pkceVerifier?: string;
	pkceChallenge?: string;
}

export interface ExchangeInput {
	code: string;
	redirectUri: string;
	pkceVerifier?: string;
}

export interface ExchangeResult {
	accessToken: string;
	refreshToken?: string;
	expiresIn?: number;
	accountId: string;
	accountName: string;
	scopes: string[];
	avatarUrl?: string;
}

export interface RefreshTokenInput {
	refreshToken: string;
	clientId: string;
	clientSecret: string;
}

export interface RefreshTokenResult {
	accessToken: string;
	refreshToken: string;
	expiresIn?: number;
}

export interface SlideInput {
	text?: string;
	imageUrl?: string;
	templateId?: string;
}

export interface MediaInput {
	type: 'image' | 'video';
	url: string;
	title?: string;
	description?: string;
}

export interface PublishInput {
	accessToken: string;
	accountId?: string;
	caption: string;
	imageUrl?: string;
	videoUrl?: string;
	mediaType?: string;
	scopes?: string[];
	visibility?: string;
	categoryId?: string;
	madeForKids?: boolean;

	// LinkedIn-specific extensions
	link?: string;
	linkedInContentType?: LinkedInContentType;
	slides?: SlideInput[];
	media?: MediaInput[];
	articleUrl?: string;
	pollOptions?: string[];
	size?: '4/5' | '1/1';
	documentDataUrl?: string;
	documentName?: string;
	articleTitle?: string;
	articleDescription?: string;
	articleThumbnail?: string;
	videoDataUrl?: string;
	videoName?: string;
	videoType?: string;
	videoTitle?: string;

	// Facebook-specific extensions
	contentFormat?: string;
	carouselImages?: string[];
	videoBlob?: any; // Use any to support both Blob/Buffer in browser/node
	linkUrl?: string;
}

export interface PublishResult {
	postUrl?: string;
	videoId?: string;
	platform?: SocialPlatform;
	postId?: string;
	publishedAt?: string;
	analytics?: {
		impressions?: number;
		likes?: number;
		comments?: number;
		shares?: number;
		clicks?: number;
	};
	rawResponse?: Record<string, unknown>;
}

export interface PlatformService {
	buildAuthorizeUrl(input: AuthorizeUrlInput): Promise<AuthorizeUrlResult>;
	exchangeCode(input: ExchangeInput): Promise<ExchangeResult>;
	publish(input: PublishInput): Promise<PublishResult>;
	refreshToken?(input: RefreshTokenInput): Promise<RefreshTokenResult>;
	getInsights?(accessToken: string, accountId: string, since?: string, until?: string): Promise<any>;
}

export interface ContentAsset {
	id: string;
	userId: string;
	type: LinkedInContentType;
	schemaVersion: number;
	status: ContentStatus;
	slides?: SlideAsset[];
	media?: MediaAsset[];
	article?: ArticleAsset;
	poll?: PollAsset;
	caption: string;
	link?: string;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	linkedInPostId?: string;
	linkedInPostUrl?: string;
}

export type ContentStatus = 'draft' | 'generating' | 'ready' | 'publishing' | 'published' | 'failed';

export interface SlideAsset {
	id: string;
	order: number;
	text: string;
	imageUrl?: string;
	templateId?: string;
	generatedImageUrl?: string;
}

export interface MediaAsset {
	id: string;
	type: 'image' | 'video';
	url: string;
	thumbnailUrl?: string;
	duration?: number;
}

export interface ArticleAsset {
	title: string;
	content: string;
	coverImageUrl?: string;
}

export interface PollAsset {
	question: string;
	options: string[];
	voteCount?: number[];
}
