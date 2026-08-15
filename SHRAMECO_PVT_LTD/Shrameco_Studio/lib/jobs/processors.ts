// Job processors — background workers for each job type.
// Called by the job runner; updates job progress via registry.

import { setJobRunning, setJobProgress, setJobCompleted, setJobFailed, getJob } from './registry';
import { generateAICarousel, type CarouselLength } from '@/lib/social/carousel';
import { memoryStore } from '@/lib/db/memoryStore';

export interface CarouselGenerationPayload {
	userId: string;
	topic: string;
	length: CarouselLength;
	brandContext: {
		companyName: string;
		industry: string;
		brandVoice: string;
		contentPillars: string;
		bannedTopics: string;
		bannedWords: string;
		colorPalette: string[];
	};
}

export async function processCarouselGeneration(jobId: string): Promise<void> {
	const job = getJob<CarouselGenerationPayload>(jobId);
	if (!job) return;

	setJobRunning(jobId);
	setJobProgress(jobId, 10);

	try {
		const payload = job.payload as CarouselGenerationPayload;
		const { topic, length, brandContext } = payload;

		setJobProgress(jobId, 30);

		const asset = await generateAICarousel(topic, length, brandContext);

		setJobProgress(jobId, 80);

		if (!asset) {
			throw new Error('Carousel generation returned no asset');
		}

		// Store the generated asset in memoryStore for demo mode
		// (In production, this would save to DB as a ContentAsset with status 'ready')
		memoryStore.setCarouselAsset(payload.userId, asset);

		setJobProgress(jobId, 90);

		setJobCompleted(jobId, { asset });
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : 'Unknown error';
		setJobFailed(jobId, errorMsg);
	}
}

// Generic job runner — polls for pending jobs and processes them.
// In production, this would be a separate worker process or BullMQ queue.
// For now, we expose a function to manually trigger processing for demo purposes.
export async function runJobProcessor(jobId: string): Promise<void> {
	const job = getJob(jobId);
	if (!job) return;

	switch (job.type) {
		case 'carousel-generation':
			await processCarouselGeneration(jobId);
			break;
		case 'document-assembly':
			// TODO: implement PDF assembly job
			break;
		case 'video-processing':
			// TODO: implement video processing job
			break;
		default:
			setJobFailed(jobId, `Unknown job type: ${job.type}`);
	}
}
