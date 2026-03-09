import { and, desc, eq, ilike, inArray, or, sql, count, isNull, isNotNull } from 'drizzle-orm';
import { db } from '../drizzle';
import {
  blogAuthors,
  blogCategories,
  blogTags,
  blogPosts,
  blogPostCategories,
  blogPostTags,
  blogComments,
  blogMedia,
  blogPostLikes,
  users,
  BlogAuthor,
  BlogCategory,
  BlogPost,
  BlogPostWithAuthor,
  BlogCommentWithReplies,
  BlogMedia,
  BlogTag,
  User,
} from '../schema';
import { getUser } from './user';

export async function getBlogAuthorByUserId(userId: string) {
  const result = await db.query.blogAuthors.findFirst({
    where: eq(blogAuthors.userId, userId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
  return result;
}

export async function getBlogAuthorById(id: number) {
  const result = await db.query.blogAuthors.findFirst({
    where: eq(blogAuthors.id, id),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
  return result;
}

export async function createBlogAuthor(data: {
  userId: string;
  bio?: string;
  avatarUrl?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
}) {
  const [author] = await db.insert(blogAuthors).values(data).returning();
  return author;
}

export async function updateBlogAuthor(id: number, data: Partial<{
  bio: string;
  avatarUrl: string;
  websiteUrl: string;
  twitterHandle: string;
  linkedinUrl: string;
}>) {
  const [author] = await db
    .update(blogAuthors)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(blogAuthors.id, id))
    .returning();
  return author;
}

export async function getAllBlogAuthors() {
  return db.query.blogAuthors.findMany({
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [desc(blogAuthors.createdAt)],
  });
}

export async function getBlogCategoryBySlug(slug: string) {
  return db.query.blogCategories.findFirst({
    where: eq(blogCategories.slug, slug),
  });
}

export async function getBlogCategoryById(id: number) {
  return db.query.blogCategories.findFirst({
    where: eq(blogCategories.id, id),
  });
}

export async function getAllBlogCategories() {
  return db.query.blogCategories.findMany({
    orderBy: [blogCategories.name],
  });
}

export async function getBlogCategoriesWithPostCount() {
  const result = await db
    .select({
      id: blogCategories.id,
      name: blogCategories.name,
      slug: blogCategories.slug,
      description: blogCategories.description,
      parentId: blogCategories.parentId,
      createdAt: blogCategories.createdAt,
      updatedAt: blogCategories.updatedAt,
      postCount: count(blogPostCategories.postId),
    })
    .from(blogCategories)
    .leftJoin(blogPostCategories, eq(blogCategories.id, blogPostCategories.categoryId))
    .leftJoin(blogPosts, and(
      eq(blogPostCategories.postId, blogPosts.id),
      eq(blogPosts.status, 'published')
    ))
    .groupBy(blogCategories.id)
    .orderBy(blogCategories.name);
  
  return result;
}

export async function createBlogCategory(data: {
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
}) {
  const [category] = await db.insert(blogCategories).values(data).returning();
  return category;
}

export async function updateBlogCategory(id: number, data: Partial<{
  name: string;
  slug: string;
  description: string;
  parentId: number;
}>) {
  const [category] = await db
    .update(blogCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(blogCategories.id, id))
    .returning();
  return category;
}

export async function deleteBlogCategory(id: number) {
  await db.delete(blogCategories).where(eq(blogCategories.id, id));
}

export async function getBlogTagBySlug(slug: string) {
  return db.query.blogTags.findFirst({
    where: eq(blogTags.slug, slug),
  });
}

export async function getAllBlogTags() {
  return db.query.blogTags.findMany({
    orderBy: [blogTags.name],
  });
}

export async function getBlogTagsWithPostCount() {
  const result = await db
    .select({
      id: blogTags.id,
      name: blogTags.name,
      slug: blogTags.slug,
      createdAt: blogTags.createdAt,
      postCount: count(blogPostTags.postId),
    })
    .from(blogTags)
    .leftJoin(blogPostTags, eq(blogTags.id, blogPostTags.tagId))
    .leftJoin(blogPosts, and(
      eq(blogPostTags.postId, blogPosts.id),
      eq(blogPosts.status, 'published')
    ))
    .groupBy(blogTags.id)
    .orderBy(blogTags.name);
  
  return result;
}

export async function createBlogTag(data: { name: string; slug: string }) {
  const [tag] = await db.insert(blogTags).values(data).returning();
  return tag;
}

export async function deleteBlogTag(id: number) {
  await db.delete(blogTags).where(eq(blogTags.id, id));
}

export async function getBlogPostBySlug(slug: string) {
  const result = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.slug, slug),
    with: {
      author: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      featuredImage: true,
      ogImage: true,
      categories: {
        with: {
          category: true,
        },
      },
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });
  return result;
}

export async function getBlogPostById(id: number) {
  const result = await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, id),
    with: {
      author: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      featuredImage: true,
      ogImage: true,
      categories: {
        with: {
          category: true,
        },
      },
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });
  return result;
}

export interface BlogPostsQueryOptions {
  status?: string;
  visibility?: string;
  authorId?: number;
  categoryId?: number;
  tagId?: number;
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: 'publishedAt' | 'createdAt' | 'viewCount' | 'likeCount';
  orderDirection?: 'asc' | 'desc';
}

export async function getBlogPosts(options: BlogPostsQueryOptions = {}) {
  const {
    status,
    visibility = 'public',
    authorId,
    categoryId,
    tagId,
    search,
    page = 1,
    limit = 10,
    orderBy = 'publishedAt',
    orderDirection = 'desc',
  } = options;

  const offset = (page - 1) * limit;

  let query = db.select({
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    excerpt: blogPosts.excerpt,
    authorId: blogPosts.authorId,
    status: blogPosts.status,
    visibility: blogPosts.visibility,
    publishedAt: blogPosts.publishedAt,
    featuredImageId: blogPosts.featuredImageId,
    metaTitle: blogPosts.metaTitle,
    metaDescription: blogPosts.metaDescription,
    readingTime: blogPosts.readingTime,
    viewCount: blogPosts.viewCount,
    likeCount: blogPosts.likeCount,
    commentCount: blogPosts.commentCount,
    createdAt: blogPosts.createdAt,
    updatedAt: blogPosts.updatedAt,
    author: {
      id: blogAuthors.id,
      bio: blogAuthors.bio,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    },
  }).from(blogPosts);

  const conditions = [];
  
  if (status) {
    conditions.push(eq(blogPosts.status, status));
  }
  
  if (visibility) {
    conditions.push(eq(blogPosts.visibility, visibility));
  }
  
  if (authorId) {
    conditions.push(eq(blogPosts.authorId, authorId));
  }

  if (search) {
    conditions.push(
      or(
        ilike(blogPosts.title, `%${search}%`),
        ilike(blogPosts.excerpt, `%${search}%`),
        ilike(blogPosts.content, `%${search}%`)
      )
    );
  }

  query = query
    .innerJoin(blogAuthors, eq(blogPosts.authorId, blogAuthors.id))
    .innerJoin(users, eq(blogAuthors.userId, users.id));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const orderColumn = orderBy === 'publishedAt' ? blogPosts.publishedAt 
    : orderBy === 'viewCount' ? blogPosts.viewCount
    : orderBy === 'likeCount' ? blogPosts.likeCount
    : blogPosts.createdAt;

  const posts = await query
    .orderBy(orderDirection === 'desc' ? desc(orderColumn) : orderColumn)
    .limit(limit)
    .offset(offset);

  let filteredPosts = posts;
  
  if (categoryId) {
    const postIdsInCategory = await db
      .select({ postId: blogPostCategories.postId })
      .from(blogPostCategories)
      .where(eq(blogPostCategories.categoryId, categoryId));
    
    const postIds = postIdsInCategory.map(p => p.postId);
    filteredPosts = posts.filter(p => postIds.includes(p.id));
  }

  if (tagId) {
    const postIdsWithTag = await db
      .select({ postId: blogPostTags.postId })
      .from(blogPostTags)
      .where(eq(blogPostTags.tagId, tagId));
    
    const postIds = postIdsWithTag.map(p => p.postId);
    filteredPosts = filteredPosts.filter(p => postIds.includes(p.id));
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(blogPosts)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    posts: filteredPosts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createBlogPost(data: {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  authorId: number;
  featuredImageId?: number;
  status?: string;
  visibility?: string;
  publishedAt?: Date;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageId?: number;
  canonicalUrl?: string;
  readingTime?: number;
  allowComments?: boolean;
  categoryIds?: number[];
  tagIds?: number[];
}) {
  const { categoryIds, tagIds, ...postData } = data;
  
  const [post] = await db.insert(blogPosts).values({
    ...postData,
    status: postData.status || 'draft',
    visibility: postData.visibility || 'public',
    allowComments: postData.allowComments ?? true,
  }).returning();

  if (categoryIds && categoryIds.length > 0) {
    await db.insert(blogPostCategories).values(
      categoryIds.map(categoryId => ({
        postId: post.id,
        categoryId,
      }))
    );
  }

  if (tagIds && tagIds.length > 0) {
    await db.insert(blogPostTags).values(
      tagIds.map(tagId => ({
        postId: post.id,
        tagId,
      }))
    );
  }

  return post;
}

export async function updateBlogPost(id: number, data: Partial<{
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageId: number;
  status: string;
  visibility: string;
  publishedAt: Date;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageId: number;
  canonicalUrl: string;
  readingTime: number;
  allowComments: boolean;
  categoryIds: number[];
  tagIds: number[];
}>) {
  const { categoryIds, tagIds, ...postData } = data;
  
  const [post] = await db
    .update(blogPosts)
    .set({ ...postData, updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning();

  if (categoryIds !== undefined) {
    await db.delete(blogPostCategories).where(eq(blogPostCategories.postId, id));
    if (categoryIds.length > 0) {
      await db.insert(blogPostCategories).values(
        categoryIds.map(categoryId => ({
          postId: id,
          categoryId,
        }))
      );
    }
  }

  if (tagIds !== undefined) {
    await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
    if (tagIds.length > 0) {
      await db.insert(blogPostTags).values(
        tagIds.map(tagId => ({
          postId: id,
          tagId,
        }))
      );
    }
  }

  return post;
}

export async function deleteBlogPost(id: number) {
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

export async function incrementPostViewCount(id: number) {
  await db
    .update(blogPosts)
    .set({
      viewCount: sql`${blogPosts.viewCount} + 1`,
    })
    .where(eq(blogPosts.id, id));
}

export async function getBlogComments(postId: number, options: { status?: string } = {}) {
  const conditions = [eq(blogComments.postId, postId)];
  
  if (options.status) {
    conditions.push(eq(blogComments.status, options.status));
  }

  const comments = await db.query.blogComments.findMany({
    where: and(...conditions),
    with: {
      author: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: [desc(blogComments.createdAt)],
  });

  return buildCommentTree(comments);
}

function buildCommentTree(comments: any[]): BlogCommentWithReplies[] {
  const commentMap = new Map<number, BlogCommentWithReplies>();
  const rootComments: BlogCommentWithReplies[] = [];

  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach(comment => {
    const node = commentMap.get(comment.id)!;
    if (comment.parentId && commentMap.has(comment.parentId)) {
      const parent = commentMap.get(comment.parentId)!;
      parent.replies!.push(node);
    } else {
      rootComments.push(node);
    }
  });

  return rootComments;
}

export async function createBlogComment(data: {
  postId: number;
  parentId?: number;
  authorId?: number;
  guestName?: string;
  guestEmail?: string;
  content: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const [comment] = await db.insert(blogComments).values({
    ...data,
    status: 'pending',
  }).returning();

  await db
    .update(blogPosts)
    .set({
      commentCount: sql`${blogPosts.commentCount} + 1`,
    })
    .where(eq(blogPosts.id, data.postId));

  return comment;
}

export async function updateBlogCommentStatus(id: number, status: string) {
  const [comment] = await db
    .update(blogComments)
    .set({ status, updatedAt: new Date() })
    .where(eq(blogComments.id, id))
    .returning();
  return comment;
}

export async function deleteBlogComment(id: number) {
  const [comment] = await db
    .select()
    .from(blogComments)
    .where(eq(blogComments.id, id))
    .limit(1);

  if (comment) {
    await db
      .update(blogPosts)
      .set({
        commentCount: sql`${blogPosts.commentCount} - 1`,
      })
      .where(eq(blogPosts.id, comment.postId));
    
    await db.delete(blogComments).where(eq(blogComments.id, id));
  }
}

export async function getPendingCommentsCount() {
  const [{ total }] = await db
    .select({ total: count() })
    .from(blogComments)
    .where(eq(blogComments.status, 'pending'));
  return total;
}

export async function getAllComments(options: { status?: string; page?: number; limit?: number } = {}) {
  const { status, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const conditions = status ? [eq(blogComments.status, status)] : [];

  const comments = await db.query.blogComments.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      post: {
        columns: {
          id: true,
          title: true,
          slug: true,
        },
      },
      author: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: [desc(blogComments.createdAt)],
    limit,
    offset,
  });

  const [{ total }] = await db
    .select({ total: count() })
    .from(blogComments)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    comments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getBlogMedia(options: { uploadedById?: string; page?: number; limit?: number } = {}) {
  const { uploadedById, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const conditions = uploadedById ? [eq(blogMedia.uploadedById, uploadedById)] : [];

  const media = await db.query.blogMedia.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(blogMedia.createdAt)],
    limit,
    offset,
  });

  const [{ total }] = await db
    .select({ total: count() })
    .from(blogMedia)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    media,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getBlogMediaById(id: number) {
  return db.query.blogMedia.findFirst({
    where: eq(blogMedia.id, id),
  });
}

export async function createBlogMedia(data: {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  altText?: string;
  title?: string;
  caption?: string;
  uploadedById?: string;
  storageProvider: string;
}) {
  const [media] = await db.insert(blogMedia).values(data).returning();
  return media;
}

export async function updateBlogMedia(id: number, data: Partial<{
  altText: string;
  title: string;
  caption: string;
}>) {
  const [media] = await db
    .update(blogMedia)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(blogMedia.id, id))
    .returning();
  return media;
}

export async function deleteBlogMedia(id: number) {
  await db.delete(blogMedia).where(eq(blogMedia.id, id));
}

export async function togglePostLike(postId: number, userId?: string, ipAddress?: string) {
  const conditions = userId
    ? and(eq(blogPostLikes.postId, postId), eq(blogPostLikes.userId, userId))
    : and(eq(blogPostLikes.postId, postId), eq(blogPostLikes.ipAddress, ipAddress));

  const existingLike = await db.query.blogPostLikes.findFirst({
    where: conditions,
  });

  if (existingLike) {
    await db.delete(blogPostLikes).where(eq(blogPostLikes.id, existingLike.id));
    await db
      .update(blogPosts)
      .set({
        likeCount: sql`${blogPosts.likeCount} - 1`,
      })
      .where(eq(blogPosts.id, postId));
    return { liked: false };
  } else {
    await db.insert(blogPostLikes).values({
      postId,
      userId,
      ipAddress,
    });
    await db
      .update(blogPosts)
      .set({
        likeCount: sql`${blogPosts.likeCount} + 1`,
      })
      .where(eq(blogPosts.id, postId));
    return { liked: true };
  }
}

export async function hasUserLiked(postId: number, userId?: string, ipAddress?: string) {
  const conditions = userId
    ? and(eq(blogPostLikes.postId, postId), eq(blogPostLikes.userId, userId))
    : and(eq(blogPostLikes.postId, postId), eq(blogPostLikes.ipAddress, ipAddress));

  const like = await db.query.blogPostLikes.findFirst({
    where: conditions,
  });

  return !!like;
}

export async function searchBlogPosts(query: string, options: { limit?: number } = {}) {
  const { limit = 10 } = options;
  
  const posts = await db.query.blogPosts.findMany({
    where: and(
      eq(blogPosts.status, 'published'),
      eq(blogPosts.visibility, 'public'),
      or(
        ilike(blogPosts.title, `%${query}%`),
        ilike(blogPosts.excerpt, `%${query}%`),
        ilike(blogPosts.content, `%${query}%`)
      )
    ),
    with: {
      author: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      featuredImage: true,
      categories: {
        with: {
          category: true,
        },
      },
    },
    orderBy: [desc(blogPosts.publishedAt)],
    limit,
  });

  return posts;
}

export async function getRelatedPosts(postId: number, categoryIds: number[], limit: number = 3) {
  if (categoryIds.length === 0) return [];

  const postIds = await db
    .select({ postId: blogPostCategories.postId })
    .from(blogPostCategories)
    .where(
      and(
        inArray(blogPostCategories.categoryId, categoryIds),
        sql`${blogPostCategories.postId} != ${postId}`
      )
    )
    .groupBy(blogPostCategories.postId)
    .limit(limit);

  if (postIds.length === 0) return [];

  const posts = await db.query.blogPosts.findMany({
    where: and(
      inArray(blogPosts.id, postIds.map(p => p.postId)),
      eq(blogPosts.status, 'published'),
      eq(blogPosts.visibility, 'public')
    ),
    with: {
      author: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      featuredImage: true,
    },
    orderBy: [desc(blogPosts.publishedAt)],
    limit,
  });

  return posts;
}

export async function getBlogStats() {
  const [{ totalPosts }] = await db
    .select({ totalPosts: count() })
    .from(blogPosts)
    .where(eq(blogPosts.status, 'published'));

  const [{ totalViews }] = await db
    .select({ totalViews: sql<number>`COALESCE(SUM(${blogPosts.viewCount}), 0)` })
    .from(blogPosts);

  const [{ totalComments }] = await db
    .select({ totalComments: count() })
    .from(blogComments)
    .where(eq(blogComments.status, 'approved'));

  const [{ totalAuthors }] = await db
    .select({ totalAuthors: count() })
    .from(blogAuthors);

  const pendingComments = await getPendingCommentsCount();

  return {
    totalPosts,
    totalViews: Number(totalViews),
    totalComments,
    totalAuthors,
    pendingComments,
  };
}

export async function ensureBlogAuthor(userId: string) {
  let author = await getBlogAuthorByUserId(userId);
  
  if (!author) {
    author = await createBlogAuthor({ userId });
  }
  
  return author;
}

export function canManageBlog(userRole: string): boolean {
  return userRole === 'owner' || userRole === 'admin' || userRole === 'author';
}

export function canManageAllPosts(userRole: string): boolean {
  return userRole === 'owner' || userRole === 'admin';
}
