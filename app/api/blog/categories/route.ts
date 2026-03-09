import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth-options';
import {
  getAllBlogCategories,
  getBlogCategoriesWithPostCount,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
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
    .substring(0, 120);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withPostCount = searchParams.get('withPostCount') === 'true';
    
    const categories = withPostCount 
      ? await getBlogCategoriesWithPostCount()
      : await getAllBlogCategories();
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canManageBlog(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const category = await createBlogCategory({
      name: body.name,
      slug: body.slug || generateSlug(body.name),
      description: body.description,
      parentId: body.parentId,
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canManageBlog(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const category = await updateBlogCategory(body.id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      parentId: body.parentId,
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Error updating category:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await deleteBlogCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
