// In-process job registry (swappable for Redis/BullMQ later).
// Per roadmap 2.6: declarative jobs with status/progress/result/error.

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type JobType = 'carousel-generation' | 'document-assembly' | 'video-processing' | string;

export interface Job<TPayload = unknown, TResult = unknown> {
	id: string;
	ownerId: string;
	type: JobType;
	status: JobStatus;
	progress: number; // 0-100
	payload: TPayload;
	result?: TResult;
	error?: string;
	createdAt: string;
	updatedAt: string;
}

const jobs = new Map<string, Job>();

function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Persist the registry on globalThis so every route module in Next.js dev
// shares the same Map instance (mirrors the memoryStore global pattern).
const globalForJobs = global as unknown as { __shramecoJobs: Map<string, Job> | undefined };
if (!globalForJobs.__shramecoJobs) {
	globalForJobs.__shramecoJobs = jobs;
}
const jobRegistry = globalForJobs.__shramecoJobs;

export function createJob<TPayload>(ownerId: string, type: JobType, payload: TPayload): Job<TPayload> {
	const now = new Date().toISOString();
	const job: Job<TPayload> = {
		id: generateId(),
		ownerId,
		type,
		status: 'pending',
		progress: 0,
		payload,
		createdAt: now,
		updatedAt: now,
	};
	jobRegistry.set(job.id, job);
	return job;
}

export function getJob<TResult = unknown>(id: string): Job<unknown, TResult> | undefined {
	return jobRegistry.get(id) as Job<unknown, TResult> | undefined;
}

export function updateJob<TResult>(id: string, updates: Partial<Job<unknown, TResult>>): Job<unknown, TResult> | undefined {
	const job = jobRegistry.get(id);
	if (!job) return undefined;
	const updated: Job<unknown, TResult> = {
		...job,
		...updates,
		updatedAt: new Date().toISOString(),
	} as Job<unknown, TResult>;
	jobRegistry.set(id, updated);
	return updated;
}

export function setJobProgress(id: string, progress: number): Job | undefined {
	return updateJob(id, { progress: Math.max(0, Math.min(100, progress)) });
}

export function setJobRunning(id: string): Job | undefined {
	return updateJob(id, { status: 'running', progress: Math.max(1, (jobRegistry.get(id)?.progress || 0)) });
}

export function setJobCompleted<TResult>(id: string, result: TResult): Job<unknown, TResult> | undefined {
	return updateJob(id, { status: 'completed', progress: 100, result });
}

export function setJobFailed(id: string, error: string): Job | undefined {
	return updateJob(id, { status: 'failed', error });
}

export function listJobs(): Job[] {
	return Array.from(jobRegistry.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
