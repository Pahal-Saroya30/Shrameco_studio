export type SocialPlatform = 'linkedin' | 'instagram' | 'x' | 'facebook' | 'youtube';

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
}

export interface PublishInput {
	accessToken: string;
	accountId?: string;
	caption: string;
	imageUrl?: string;
	videoUrl?: string;
	videoDataUrl?: string;
	coverDataUrl?: string;
	videoBlob?: Blob;
	linkUrl?: string;
	carouselImages?: string[];
	contentFormat?: 'text' | 'photo' | 'reel' | 'carousel' | 'link' | 'video' | 'post' | 'story';
	scopes?: string[];
}

export interface PublishResult {
	postUrl?: string;
}

export interface PlatformService {
	buildAuthorizeUrl(input: AuthorizeUrlInput): Promise<AuthorizeUrlResult>;
	exchangeCode(input: ExchangeInput): Promise<ExchangeResult>;
	publish(input: PublishInput): Promise<PublishResult>;
	publishReel?(input: PublishInput): Promise<PublishResult>;
}
