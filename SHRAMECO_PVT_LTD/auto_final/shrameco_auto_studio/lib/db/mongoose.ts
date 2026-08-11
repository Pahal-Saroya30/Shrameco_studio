import mongoose from 'mongoose';

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

// Circuit-breaker: if MongoDB failed recently, don't waste 2000ms checking TCP every request
const OFFLINE_RETRY_INTERVAL_MS = 60000; // Retry DB connection at most once per minute

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
			serverSelectionTimeoutMS: 800, // Reduced to 800ms for ultra-fast first check
			connectTimeoutMS: 800,
		};

		cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
			cached.isOffline = false;
			return mongooseInstance;
		});
	}

	try {
		cached.conn = await cached.promise;
		cached.isOffline = false;
	} catch (e) {
		cached.promise = null;
		cached.isOffline = true;
		cached.lastFailedTime = Date.now();
		throw e;
	}

	return cached.conn;
}
