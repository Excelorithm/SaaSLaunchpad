import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { canManageBlog, getBlogPosts, getBlogStats } from '@/lib/db/queries/blog';
import { PostsList } from './posts-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, MessageSquare, Eye } from 'lucide-react';

export default async function BlogPostsPage() {
  const user = await getUser();
  
  if (!user || !canManageBlog(user.role)) {
    redirect('/dashboard');
  }

  const { posts, total } = await getBlogPosts({ 
    limit: 20,
    status: undefined,
  });
  const stats = await getBlogStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-gray-500">Manage your blog content</p>
        </div>
        <Link href="/dashboard/blog/posts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Posts</p>
              <p className="text-2xl font-bold">{stats.totalPosts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold">{stats.totalViews}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Authors</p>
              <p className="text-2xl font-bold">{stats.totalAuthors}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Comments</p>
              <p className="text-2xl font-bold">{stats.pendingComments}</p>
            </div>
          </div>
        </div>
      </div>

      <PostsList posts={posts} />
    </div>
  );
}
