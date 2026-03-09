import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogCategoryBySlug, getBlogPosts } from '@/lib/db/queries/blog';
import { formatDate } from '@/lib/blog/utils';
import { Folder, ArrowLeft, ArrowRight, Clock, Eye, Heart } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getBlogCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name} - Blog`,
    description: category.description || `Posts in ${category.name} category`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1');

  const category = await getBlogCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const { posts, total, totalPages } = await getBlogPosts({
    status: 'published',
    visibility: 'public',
    categoryId: category.id,
    page,
    limit: 10,
  });

  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </div>

          <div className="text-center mb-12">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-orange-500 text-white mx-auto mb-4">
              <Folder className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                {category.description}
              </p>
            )}
            <p className="text-gray-400 mt-2">{total} posts</p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No posts in this category yet</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <span>{post.author.user.name || 'Anonymous'}</span>
                        <span>·</span>
                        <span>{post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}</span>
                        {post.readingTime && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readingTime} min read
                            </span>
                          </>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-orange-500 transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likeCount}
                          </span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-4 mt-12">
              {page > 1 && (
                <Link
                  href={`/blog/category/${slug}?page=${page - 1}`}
                  className="px-6 py-3 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Link>
              )}
              <span className="px-6 py-3 text-gray-600 font-medium">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/blog/category/${slug}?page=${page + 1}`}
                  className="px-6 py-3 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all inline-flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}