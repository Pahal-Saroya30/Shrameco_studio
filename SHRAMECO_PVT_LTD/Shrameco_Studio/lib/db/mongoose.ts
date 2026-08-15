import mongoose from 'mongoose';
import { startBackgroundScheduler } from '@/lib/services/scheduler';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brand_content_studio';

interface GlobalMongoose {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
	isOffline: boolean;
	lastFailedTime: number;
}

declare global {
	// eslint-disable-next-line no-var
	var mongoose: GlobalMongoose | undefined;
}

let cached: GlobalMongoose = global.mongoose || {
	conn: null,
	promise: null,
	isOffline: false,
	lastFailedTime: 0,
};

if (!global.mongoose) {
	global.mongoose = cached;
}

// Circuit-breaker: if MongoDB failed recently, skip TCP attempts for a while
const OFFLINE_RETRY_INTERVAL_MS = 30000; // 30s cooldown after a failed connection

export async function dbConnect(): Promise<typeof mongoose> {
	if (cached.conn) {
		return cached.conn;
	}

	// Fast circuit breaker for offline mode
	if (cached.isOffline && Date.now() - cached.lastFailedTime < OFFLINE_RETRY_INTERVAL_MS) {
		throw new Error('MongoDB is offline (circuit breaker active for instant response)');
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
			serverSelectionTimeoutMS: 5000, // 5s — allows cold-start connections to succeed
			connectTimeoutMS: 5000,
		};

		cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
			cached.isOffline = false;
			return mongooseInstance;
		});
	}

	try {
		cached.conn = await cached.promise;
		cached.isOffline = false;

		// Initialize background scheduler worker on Next.js server side
		if (typeof window === 'undefined') {
			startBackgroundScheduler();
		}
	} catch (e) {
		cached.promise = null;
		cached.isOffline = true;
		cached.lastFailedTime = Date.now();
		throw e;
	}

	return cached.conn;
}
