import { NextRequest, NextResponse } from 'next/server';
import { searchBlogPosts } from '@/lib/db/queries/blog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({ posts: [], total: 0 });
    }

    const posts = await searchBlogPosts(query, { limit });
    
    return NextResponse.json({ 
      posts, 
      total: posts.length,
      query 
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    return NextResponse.json({ error: 'Failed to search posts' }, { status: 500 });
  }
}
