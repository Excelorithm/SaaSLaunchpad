import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth-options';
import { headers } from 'next/headers';
import {
  getBlogComments,
  createBlogComment,
  updateBlogCommentStatus,
  deleteBlogComment,
  getAllComments,
  canManageBlog,
  ensureBlogAuthor,
} from '@/lib/db/queries/blog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (postId) {
      const comments = await getBlogComments(parseInt(postId), { 
        status: status || 'approved' 
      });
      return NextResponse.json({ comments });
    }

    const session = await getServerSession();
    if (!session?.user || !canManageBlog(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getAllComments({ status: status || undefined, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      'unknown';
    const userAgent = headersList.get('user-agent') || undefined;

    const body = await request.json();

    let authorId: number | undefined;
    if (session?.user) {
      const author = await ensureBlogAuthor(session.user.id);
      authorId = author.id;
    }

    if (!authorId && (!body.guestName || !body.guestEmail)) {
      return NextResponse.json({ 
        error: 'Name and email are required for guest comments' 
      }, { status: 400 });
    }

    const comment = await createBlogComment({
      postId: body.postId,
      parentId: body.parentId,
      authorId,
      guestName: authorId ? undefined : body.guestName,
      guestEmail: authorId ? undefined : body.guestEmail,
      content: body.content,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ 
      comment,
      message: 'Comment submitted successfully. It will be visible after approval.'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canManageBlog(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const comment = await updateBlogCommentStatus(body.id, body.status);
    
    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
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
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    await deleteBlogComment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
