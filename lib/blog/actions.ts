'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import {
  validatedActionWithUser,
  ActionState,
} from '@/lib/auth/middleware';
import { getUser } from '@/lib/db/queries';
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  createBlogTag,
  deleteBlogTag,
  createBlogComment,
  updateBlogCommentStatus,
  deleteBlogComment,
  createBlogMedia,
  deleteBlogMedia,
  togglePostLike,
  ensureBlogAuthor,
  canManageBlog,
  canManageAllPosts,
  getBlogAuthorByUserId,
} from '@/lib/db/queries/blog';
import { uploadFile, deleteFile, validateFileType, validateFileSize, ALLOWED_IMAGE_TYPES } from '@/lib/blog/storage';
import { BlogPostStatus, BlogPostVisibility, BlogCommentStatus } from '@/lib/db/schema';

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

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(120),
  description: z.string().optional(),
  parentId: z.coerce.number().optional(),
});

export const createCategory = validatedActionWithUser(
  categorySchema,
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to manage categories' };
    }

    try {
      const category = await createBlogCategory({
        name: data.name,
        slug: data.slug || generateSlug(data.name),
        description: data.description,
        parentId: data.parentId,
      });
      revalidatePath('/dashboard/blog/categories');
      return { success: 'Category created successfully', category };
    } catch (error: any) {
      if (error.code === '23505') {
        return { error: 'A category with this slug already exists' };
      }
      return { error: 'Failed to create category' };
    }
  }
);

export const updateCategory = validatedActionWithUser(
  z.object({
    id: z.coerce.number(),
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(120),
    description: z.string().optional(),
    parentId: z.coerce.number().optional(),
  }),
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to manage categories' };
    }

    try {
      const category = await updateBlogCategory(data.id, {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
      });
      revalidatePath('/dashboard/blog/categories');
      return { success: 'Category updated successfully', category };
    } catch (error: any) {
      if (error.code === '23505') {
        return { error: 'A category with this slug already exists' };
      }
      return { error: 'Failed to update category' };
    }
  }
);

export const deleteCategory = validatedActionWithUser(
  z.object({ id: z.coerce.number() }),
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to manage categories' };
    }

    await deleteBlogCategory(data.id);
    revalidatePath('/dashboard/blog/categories');
    return { success: 'Category deleted successfully' };
  }
);

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  slug: z.string().min(1, 'Slug is required').max(60),
});

export const createTag = validatedActionWithUser(
  tagSchema,
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to manage tags' };
    }

    try {
      const tag = await createBlogTag({
        name: data.name,
        slug: data.slug || generateSlug(data.name),
      });
      revalidatePath('/dashboard/blog/tags');
      return { success: 'Tag created successfully', tag };
    } catch (error: any) {
      if (error.code === '23505') {
        return { error: 'A tag with this slug already exists' };
      }
      return { error: 'Failed to create tag' };
    }
  }
);

export const deleteTag = validatedActionWithUser(
  z.object({ id: z.coerce.number() }),
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to manage tags' };
    }

    await deleteBlogTag(data.id);
    revalidatePath('/dashboard/blog/tags');
    return { success: 'Tag deleted successfully' };
  }
);

const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(300),
  excerpt: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  featuredImageId: z.coerce.number().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
  visibility: z.enum(['public', 'private']).default('public'),
  publishedAt: z.string().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.string().max(500).optional(),
  ogTitle: z.string().max(255).optional(),
  ogDescription: z.string().max(500).optional(),
  ogImageId: z.coerce.number().optional(),
  canonicalUrl: z.string().max(500).optional(),
  allowComments: z.coerce.boolean().default(true),
  categoryIds: z.array(z.coerce.number()).optional(),
  tagIds: z.array(z.coerce.number()).optional(),
});

export const createPost = validatedActionWithUser(
  postSchema,
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to create posts' };
    }

    const author = await ensureBlogAuthor(user.id);
    
    const publishedAt = data.status === 'published' && !data.publishedAt
      ? new Date()
      : data.publishedAt ? new Date(data.publishedAt) : undefined;

    try {
      const post = await createBlogPost({
        title: data.title,
        slug: data.slug || generateSlug(data.title),
        excerpt: data.excerpt,
        content: data.content,
        authorId: author.id,
        featuredImageId: data.featuredImageId,
        status: data.status,
        visibility: data.visibility,
        publishedAt,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        ogImageId: data.ogImageId,
        canonicalUrl: data.canonicalUrl,
        readingTime: calculateReadingTime(data.content),
        allowComments: data.allowComments,
        categoryIds: data.categoryIds,
        tagIds: data.tagIds,
      });
      
      revalidatePath('/dashboard/blog/posts');
      revalidatePath('/blog');
      return { success: 'Post created successfully', post };
    } catch (error: any) {
      if (error.code === '23505') {
        return { error: 'A post with this slug already exists' };
      }
      return { error: 'Failed to create post' };
    }
  }
);

export const updatePost = validatedActionWithUser(
  z.object({
    id: z.coerce.number(),
    title: z.string().min(1).max(255),
    slug: z.string().min(1).max(300),
    excerpt: z.string().optional(),
    content: z.string().min(1),
    featuredImageId: z.coerce.number().optional(),
    status: z.enum(['draft', 'published', 'scheduled', 'archived']),
    visibility: z.enum(['public', 'private']),
    publishedAt: z.string().optional(),
    metaTitle: z.string().max(255).optional(),
    metaDescription: z.string().max(500).optional(),
    metaKeywords: z.string().max(500).optional(),
    ogTitle: z.string().max(255).optional(),
    ogDescription: z.string().max(500).optional(),
    ogImageId: z.coerce.number().optional(),
    canonicalUrl: z.string().max(500).optional(),
    allowComments: z.coerce.boolean(),
    categoryIds: z.array(z.coerce.number()).optional(),
    tagIds: z.array(z.coerce.number()).optional(),
  }),
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to update posts' };
    }

    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : undefined;

    try {
      const post = await updateBlogPost(data.id, {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImageId: data.featuredImageId,
        status: data.status,
        visibility: data.visibility,
        publishedAt,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        ogTitle: data.ogTitle,
        ogDescription: data.ogDescription,
        ogImageId: data.ogImageId,
        canonicalUrl: data.canonicalUrl,
        readingTime: calculateReadingTime(data.content),
        allowComments: data.allowComments,
        categoryIds: data.categoryIds,
        tagIds: data.tagIds,
      });
      
      revalidatePath('/dashboard/blog/posts');
      revalidatePath('/blog');
      revalidatePath(`/blog/${data.slug}`);
      return { success: 'Post updated successfully', post };
    } catch (error: any) {
      if (error.code === '23505') {
        return { error: 'A post with this slug already exists' };
      }
      return { error: 'Failed to update post' };
    }
  }
);

export const deletePost = validatedActionWithUser(
  z.object({ id: z.coerce.number() }),
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to delete posts' };
    }

    await deleteBlogPost(data.id);
    revalidatePath('/dashboard/blog/posts');
    revalidatePath('/blog');
    return { success: 'Post deleted successfully' };
  }
);

const mediaUploadSchema = z.object({
  file: z.any(),
  altText: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
  caption: z.string().optional(),
});

export async function uploadMediaAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getUser();
  if (!user || !canManageBlog(user.role)) {
    return { error: 'You do not have permission to upload media' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { error: 'No file provided' };
  }

  if (!validateFileType(file.type, ALLOWED_IMAGE_TYPES)) {
    return { error: 'Invalid file type. Only images are allowed.' };
  }

  if (!validateFileSize(file.size, 10)) {
    return { error: 'File size must be less than 10MB' };
  }

  try {
    const result = await uploadFile(file, file.name, file.type, 'blog');
    
    const media = await createBlogMedia({
      filename: result.filename,
      originalName: result.originalName,
      mimeType: result.mimeType,
      size: result.size,
      path: result.path,
      url: result.url,
      altText: formData.get('altText') as string || undefined,
      title: formData.get('title') as string || undefined,
      caption: formData.get('caption') as string || undefined,
      uploadedById: user.id,
      storageProvider: result.storageProvider,
    });

    revalidatePath('/dashboard/blog/media');
    return { success: 'Media uploaded successfully', media };
  } catch (error) {
    return { error: 'Failed to upload media' };
  }
}

export const deleteMedia = validatedActionWithUser(
  z.object({ 
    id: z.coerce.number(),
    path: z.string(),
    storageProvider: z.string(),
  }),
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to delete media' };
    }

    await deleteFile(data.path, data.storageProvider as 'local' | 's3');
    await deleteBlogMedia(data.id);
    revalidatePath('/dashboard/blog/media');
    return { success: 'Media deleted successfully' };
  }
);

const commentSchema = z.object({
  postId: z.coerce.number(),
  parentId: z.coerce.number().optional(),
  content: z.string().min(1, 'Comment is required').max(2000),
  guestName: z.string().max(100).optional(),
  guestEmail: z.string().email().max(255).optional(),
});

export async function submitCommentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getUser();
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    'unknown';
  const userAgent = headersList.get('user-agent') || undefined;

  let authorId: number | undefined;
  
  if (user) {
    const author = await ensureBlogAuthor(user.id);
    authorId = author.id;
  }

  const data = {
    postId: parseInt(formData.get('postId') as string),
    parentId: formData.get('parentId') ? parseInt(formData.get('parentId') as string) : undefined,
    content: formData.get('content') as string,
    guestName: authorId ? undefined : formData.get('guestName') as string,
    guestEmail: authorId ? undefined : formData.get('guestEmail') as string,
  };

  const validated = commentSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  if (!authorId && (!validated.data.guestName || !validated.data.guestEmail)) {
    return { error: 'Name and email are required for guest comments' };
  }

  await createBlogComment({
    postId: validated.data.postId,
    parentId: validated.data.parentId,
    authorId,
    guestName: validated.data.guestName,
    guestEmail: validated.data.guestEmail,
    content: validated.data.content,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/blog/${validated.data.postId}`);
  return { success: 'Comment submitted successfully. It will be visible after approval.' };
}

export const moderateComment = validatedActionWithUser(
  z.object({
    id: z.coerce.number(),
    status: z.enum(['pending', 'approved', 'spam', 'trash']),
  }),
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to moderate comments' };
    }

    await updateBlogCommentStatus(data.id, data.status);
    revalidatePath('/dashboard/blog/comments');
    return { success: 'Comment status updated' };
  }
);

export const removeComment = validatedActionWithUser(
  z.object({ id: z.coerce.number() }),
  async (data, _, user) => {
    if (!canManageBlog(user.role)) {
      return { error: 'You do not have permission to delete comments' };
    }

    await deleteBlogComment(data.id);
    revalidatePath('/dashboard/blog/comments');
    return { success: 'Comment deleted successfully' };
  }
);

export async function toggleLikeAction(postId: number): Promise<{ liked: boolean }> {
  const user = await getUser();
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || 
                    headersList.get('x-real-ip') || 
                    'unknown';

  return togglePostLike(postId, user?.id, ipAddress);
}

export const updateAuthorProfile = validatedActionWithUser(
  z.object({
    bio: z.string().max(500).optional(),
    websiteUrl: z.string().url().max(500).optional().or(z.literal('')),
    twitterHandle: z.string().max(100).optional(),
    linkedinUrl: z.string().url().max(500).optional().or(z.literal('')),
  }),
  async (data, _, user) => {
    const author = await ensureBlogAuthor(user.id);
    
    const { db } = await import('@/lib/db/drizzle');
    const { blogAuthors } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    
    const [updatedAuthor] = await db
      .update(blogAuthors)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(blogAuthors.id, author.id))
      .returning();

    return { success: 'Author profile updated successfully', author: updatedAuthor };
  }
);
