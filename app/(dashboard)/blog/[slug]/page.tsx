import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getBlogPostBySlug, incrementPostViewCount, getRelatedPosts } from '@/lib/db/queries/blog';
import { formatDate } from '@/lib/blog/utils';
import { PostContent } from './post-content';
import { Comments } from './comments';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Heart, MessageCircle, Clock } from 'lucide-react';
import type { BlogPostWithAuthor, BlogMedia } from '@/lib/db/schema';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug) as BlogPostWithAuthor | undefined;

  if (!post) {
    return { title: 'Post Not Found' };
  }

  const featuredImg = post.featuredImage as BlogMedia | undefined;

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || (post.excerpt as string) || '',
    keywords: post.metaKeywords || undefined,
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || post.metaDescription || (post.excerpt as string) || '',
      images: featuredImg ? [featuredImg.url] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author?.user?.name || 'Anonymous'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || post.metaDescription || (post.excerpt as string) || '',
      images: featuredImg ? [featuredImg.url] : [],
    },
    alternates: post.canonicalUrl ? {
      canonical: post.canonicalUrl,
    } : undefined,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug) as BlogPostWithAuthor | undefined;

  if (!post) {
    notFound();
  }

  if (post.status !== 'published') {
    redirect('/blog');
  }

  await incrementPostViewCount(post.id);

  const categoryIds = post.categories.map(c => c.categoryId);
  const relatedPosts = await getRelatedPosts(post.id, categoryIds, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage?.url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.user.name,
    },
    publisher: {
      '@type': 'Organization',
      name: process.env.APP_NAME || 'Blog',
    },
  };

  return (
    <main>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </div>

          <article className="max-w-4xl mx-auto">
            <header className="mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                {post.categories.map((c, i) => (
                  <span key={c.categoryId}>
                    <Link
                      href={`/blog/category/${c.category.slug}`}
                      className="hover:text-orange-500 transition-colors"
                    >
                      {c.category.name}
                    </Link>
                    {i < post.categories.length - 1 && ', '}
                  </span>
                ))}
              </div>

              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl mb-6">
                {post.title}
              </h1>

              <div className="flex items-center gap-4 text-gray-600 mb-6">
                <div className="flex items-center gap-3">
                  {post.author.user.image && (
                    <img
                      src={post.author.user.image}
                      alt={post.author.user.name || ''}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{post.author.user.name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">
                      {post.publishedAt && formatDate(post.publishedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                {post.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readingTime} min read
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {post.likeCount} likes
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post.commentCount} comments
                </span>
              </div>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {post.tags.map((t) => (
                    <Link
                      key={t.tagId}
                      href={`/blog/tag/${t.tag.slug}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-orange-500 hover:text-white transition-colors"
                    >
                      #{t.tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </header>

            {post.featuredImage && (
              <div className="mb-8">
                <img
                  src={post.featuredImage.url}
                  alt={post.featuredImage.altText || post.title}
                  className="w-full rounded-lg"
                />
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <PostContent content={post.content} />
            </div>

            <footer className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between text-gray-500">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.viewCount} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.likeCount} likes
                  </span>
                </div>
              </div>
            </footer>
          </article>

          {post.allowComments && (
            <section className="mt-12 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Comments ({post.commentCount})
              </h2>
              <Comments postId={post.id} />
            </section>
          )}

          {relatedPosts.length > 0 && (
            <section className="mt-16 max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Related Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {relatedPost.featuredImage && (
                      <img
                        src={relatedPost.featuredImage.url}
                        alt={relatedPost.title}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 hover:text-orange-500 transition-colors">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {relatedPost.publishedAt && formatDate(relatedPost.publishedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}