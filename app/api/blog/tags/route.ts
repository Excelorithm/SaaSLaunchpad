import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth-options';
import {
  getAllBlogTags,
  getBlogTagsWithPostCount,
  createBlogTag,
  deleteBlogTag,
  canManageBlog,
} from '@/lib/db/queries/blog';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withPostCount = searchParams.get('withPostCount') === 'true';
    
    const tags = withPostCount 
      ? await getBlogTagsWithPostCount()
      : await getAllBlogTags();
    
    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canManageBlog(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const tag = await createBlogTag({
      name: body.name,
      slug: body.slug || generateSlug(body.name),
    });

    return NextResponse.json({ tag });
  } catch (error: any) {
    console.error('Error creating tag:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A tag with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
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
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    await deleteBlogTag(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
