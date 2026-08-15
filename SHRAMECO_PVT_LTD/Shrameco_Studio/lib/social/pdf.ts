import { PDFDocument, PDFImage, PDFPage } from 'pdf-lib';

export type SlideSize = '4/5' | '1/1';

const SLIDE_DIMENSIONS: Record<SlideSize, { width: number; height: number }> = {
	'4/5': { width: 1080, height: 1350 },
	'1/1': { width: 1080, height: 1080 },
};

const MAX_SLIDES = 300;
const MAX_PDF_BYTES = 100 * 1024 * 1024;

export interface DocumentPdfInput {
	slides: { imageUrl: string }[];
	size?: SlideSize;
}

export interface DocumentPdfResult {
	buffer: Buffer;
	pageCount: number;
	size: SlideSize;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
	const match = dataUrl.match(/^data:([^;]+);base64,([\s\S]*)$/);
	if (!match) throw new Error('Slide image must be a base64 data URL.');
	const mime = match[1].toLowerCase();
	const bytes = Buffer.from(match[2], 'base64');
	return { bytes, mime };
}

async function embedImage(doc: PDFDocument, dataUrl: string): Promise<PDFImage> {
	const { bytes, mime } = dataUrlToBytes(dataUrl);
	
	// Inspect magic bytes to determine the actual image format.
	// Sometimes html-to-image's toPng or browser canvas exports JPEG bytes 
	// (starting with ffd8) even when labeled as image/png.
	const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
	const isJpg = bytes[0] === 0xFF && bytes[1] === 0xD8;

	if (isPng) return doc.embedPng(bytes);
	if (isJpg) return doc.embedJpg(bytes);

	// Fallback to MIME type check if magic bytes are inconclusive
	if (mime.includes('png')) return doc.embedPng(bytes);
	if (mime.includes('jpeg') || mime.includes('jpg')) return doc.embedJpg(bytes);
	
	throw new Error(`Unsupported slide image type: ${mime}. Use PNG or JPEG.`);
}

export async function buildDocumentPdf({ slides, size = '4/5' }: DocumentPdfInput): Promise<DocumentPdfResult> {
	if (slides.length === 0) throw new Error('At least one slide is required to build a document.');
	if (slides.length > MAX_SLIDES) throw new Error(`Documents support up to ${MAX_SLIDES} pages.`);

	const dims = SLIDE_DIMENSIONS[size];
	const doc = await PDFDocument.create();

	for (const slide of slides) {
		if (!slide.imageUrl) throw new Error('Every slide needs an image.');
		const image = await embedImage(doc, slide.imageUrl);
		const page: PDFPage = doc.addPage([dims.width, dims.height]);
		page.drawImage(image, {
			x: 0,
			y: 0,
			width: dims.width,
			height: dims.height,
		});
	}

	const bytes = await doc.save();
	const buffer = Buffer.from(bytes);
	if (buffer.byteLength > MAX_PDF_BYTES) {
		throw new Error(`Generated PDF exceeds the 100 MB limit (${Math.round(buffer.byteLength / 1024 / 1024)} MB).`);
	}

	return { buffer, pageCount: slides.length, size };
}

export const SLIDE_SIZES = Object.keys(SLIDE_DIMENSIONS) as SlideSize[];
