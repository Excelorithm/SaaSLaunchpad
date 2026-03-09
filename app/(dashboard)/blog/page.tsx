import { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts, getBlogCategoriesWithPostCount, getBlogTagsWithPostCount } from '@/lib/db/queries/blog';
import { formatDate } from '@/lib/blog/utils';
import { BlogSearch } from './blog-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Folder, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Read our latest articles and insights',
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const search = params.search;

  const [{ posts, total, totalPages }, categories, tags] = await Promise.all([
    getBlogPosts({
      status: 'published',
      visibility: 'public',
      page,
      limit: 10,
      search,
    }),
    getBlogCategoriesWithPostCount(),
    getBlogTagsWithPostCount(),
  ]);

  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl mb-4">
              Blog
              <span className="block text-orange-500">Insights & Articles</span>
            </h1>
            <p className="text-base text-gray-500 sm:text-xl max-w-2xl mx-auto">
              Read our latest articles, tutorials, and insights to help you build better SaaS products.
            </p>
            <div className="mt-8 max-w-md mx-auto">
              <BlogSearch />
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-8">
              {posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">No posts found</p>
                  {search && (
                    <Link href="/blog" className="text-orange-500 hover:text-orange-600 mt-2 inline-block">
                      Clear search
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <article key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                      <Link href={`/blog/${post.slug}`}>
                        <div className="p-6">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                            <span>{String(post.author?.user?.name || 'Anonymous')}</span>
                            <span>·</span>
                            <span>{post.publishedAt ? formatDate(String(post.publishedAt)) : 'Draft'}</span>
                            {post.readingTime && (
                              <>
                                <span>·</span>
                                <span>{String(post.readingTime)} min read</span>
                              </>
                            )}
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-orange-500 transition-colors">
                            {String(post.title)}
                          </h2>
                          {post.excerpt && (
                            <p className="text-gray-600 mb-4">{String(post.excerpt)}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <span>{String(post.viewCount)} views</span>
                              <span>{String(post.likeCount)} likes</span>
                              <span>{String(post.commentCount)} comments</span>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
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
                      href={`/blog?page=${page - 1}${search ? `&search=${search}` : ''}`}
                      className="px-6 py-3 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-6 py-3 text-gray-600 font-medium">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/blog?page=${page + 1}${search ? `&search=${search}` : ''}`}
                      className="px-6 py-3 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </div>

            <aside className="lg:col-span-4 lg:mt-0 mt-8">
              <Card className="mb-6 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-orange-500 text-white">
                      <Folder className="h-4 w-4" />
                    </div>
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/blog/category/${category.slug}`}
                          className="flex justify-between items-center text-gray-600 hover:text-orange-500 transition-colors"
                        >
                          <span>{category.name}</span>
                          <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded-full text-xs">
                            {category.postCount}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-orange-500 text-white">
                      <Tag className="h-4 w-4" />
                    </div>
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/blog/tag/${tag.slug}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-orange-500 hover:text-white transition-colors text-sm font-medium"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}