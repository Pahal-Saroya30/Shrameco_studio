import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongoose';
import { ContentItem } from '@/models/ContentItem';
import { getAuthSession } from '@/lib/auth/jwt';
import { memoryStore } from '@/lib/db/memoryStore';

export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		try {
			await dbConnect();
			const items = await ContentItem.find({ userId: session.userId })
				.sort({ createdAt: -1 })
				.limit(20);
			return NextResponse.json({ items });
		} catch (dbErr) {
			console.warn('MongoDB connection failed; reading content items from memory store.');
			const memItems = memoryStore.getContentItems(session.userId);
			return NextResponse.json({ items: memItems });
		}
	} catch (error) {
		console.error('Error fetching content items:', error);
		return NextResponse.json({ error: 'Failed to fetch content items' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await req.json();
		const { topic, platform, generatedText, templateId, renderedImageUrl, status } = body;

		if (!topic || !platform || !generatedText) {
			return NextResponse.json(
				{ error: 'Topic, platform, and generated text are required.' },
				{ status: 400 }
			);
		}

		const itemData = {
			topic,
			platform,
			generatedText,
			templateId: templateId || 'quote-card',
			renderedImageUrl: renderedImageUrl || '',
			status: status === 'final' ? ('final' as const) : ('draft' as const),
		};

		try {
			await dbConnect();
			const newItem = await ContentItem.create({
				userId: session.userId,
				...itemData,
			});
			memoryStore.addContentItem(session.userId, itemData);
			return NextResponse.json({ message: 'Content saved successfully', item: newItem });
		} catch (dbErr) {
			console.warn('MongoDB connection failed; saving content item to memory store.');
			const memItem = memoryStore.addContentItem(session.userId, itemData);
			return NextResponse.json({ message: 'Content saved successfully', item: memItem });
		}
	} catch (error) {
		console.error('Error saving content item:', error);
		return NextResponse.json({ error: 'Failed to save content item' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const session = await getAuthSession();
		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		let id = new URL(req.url).searchParams.get('id');
		if (!id) {
			try {
				const body = await req.json();
				id = body?.id;
			} catch (_) {}
		}

		if (!id) {
			return NextResponse.json({ error: 'Content item ID is required' }, { status: 400 });
		}

		try {
			await dbConnect();
			await ContentItem.deleteOne({ _id: id, userId: session.userId });
			memoryStore.deleteContentItem(session.userId, id);
			return NextResponse.json({ message: 'Item deleted successfully' });
		} catch (dbErr) {
			console.warn('MongoDB delete failed; removing from memory store.');
			memoryStore.deleteContentItem(session.userId, id);
			return NextResponse.json({ message: 'Item deleted from memory store' });
		}
	} catch (error) {
		console.error('Error deleting content item:', error);
		return NextResponse.json({ error: 'Failed to delete content item' }, { status: 500 });
	}
}
