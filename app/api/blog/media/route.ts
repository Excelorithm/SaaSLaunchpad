import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/auth-options';
import { canManageBlog, deleteBlogMedia, getBlogMediaById } from '@/lib/db/queries/blog';
import { uploadFile, deleteFile, validateFileType, validateFileSize, ALLOWED_IMAGE_TYPES } from '@/lib/blog/storage';
import { createBlogMedia, getBlogMedia } from '@/lib/db/queries/blog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const uploadedById = searchParams.get('uploadedById') || undefined;

    const result = await getBlogMedia({ page, limit, uploadedById });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || !canManageBlog(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!validateFileType(file.type, ALLOWED_IMAGE_TYPES)) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    if (!validateFileSize(file.size, 10)) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const uploadResult = await uploadFile(file, file.name, file.type, 'blog');
    
    const media = await createBlogMedia({
      filename: uploadResult.filename,
      originalName: uploadResult.originalName,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      path: uploadResult.path,
      url: uploadResult.url,
      altText: formData.get('altText') as string || undefined,
      title: formData.get('title') as string || undefined,
      caption: formData.get('caption') as string || undefined,
      uploadedById: session.user.id,
      storageProvider: uploadResult.storageProvider,
    });

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
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
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }

    const mediaItem = await getBlogMediaById(id);
    if (!mediaItem) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    await deleteFile(mediaItem.path, mediaItem.storageProvider as 'local' | 's3');
    await deleteBlogMedia(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
