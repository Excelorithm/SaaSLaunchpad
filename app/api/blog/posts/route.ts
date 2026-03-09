import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth-options';
import {
  getBlogPosts,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  canManageBlog,
  ensureBlogAuthor,
} from '@/lib/db/queries/blog';
import { calculateReadingTime } from '@/lib/blog/utils';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 280);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession();
    
    const options = {
      status: searchParams.get('status') || undefined,
      visibility: session?.user ? searchParams.get('visibility') || undefined : 'public',
      authorId: searchParams.get('authorId') ? parseInt(searchParams.get('authorId')!) : undefined,
      categoryId: searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined,
      tagId: searchParams.get('tagId') ? parseInt(searchParams.get('tagId')!) : undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      orderBy: (searchParams.get('orderBy') || 'publishedAt') as 'publishedAt' | 'createdAt' | 'viewCount' | 'likeCount',
      orderDirection: (searchParams.get('orderDirection') || 'desc') as 'asc' | 'desc',
    };

    const result = await getBlogPosts(options);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canManageBlog(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const author = await ensureBlogAuthor(session.user.id);
    
    const publishedAt = body.status === 'published' && !body.publishedAt
      ? new Date()
      : body.publishedAt ? new Date(body.publishedAt) : undefined;

    const post = await createBlogPost({
      title: body.title,
      slug: body.slug || generateSlug(body.title),
      excerpt: body.excerpt,
      content: body.content,
      authorId: author.id,
      featuredImageId: body.featuredImageId,
      status: body.status || 'draft',
      visibility: body.visibility || 'public',
      publishedAt,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      metaKeywords: body.metaKeywords,
      ogTitle: body.ogTitle,
      ogDescription: body.ogDescription,
      ogImageId: body.ogImageId,
      canonicalUrl: body.canonicalUrl,
      readingTime: calculateReadingTime(body.content),
      allowComments: body.allowComments ?? true,
      categoryIds: body.categoryIds,
      tagIds: body.tagIds,
    });

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Error creating post:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canManageBlog(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;

    const post = await updateBlogPost(body.id, {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      featuredImageId: body.featuredImageId,
      status: body.status,
      visibility: body.visibility,
      publishedAt,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      metaKeywords: body.metaKeywords,
      ogTitle: body.ogTitle,
      ogDescription: body.ogDescription,
      ogImageId: body.ogImageId,
      canonicalUrl: body.canonicalUrl,
      readingTime: calculateReadingTime(body.content),
      allowComments: body.allowComments,
      categoryIds: body.categoryIds,
      tagIds: body.tagIds,
    });

    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Error updating post:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canManageBlog(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await deleteBlogPost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
