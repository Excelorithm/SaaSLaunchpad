import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { canManageBlog, getBlogTagsWithPostCount } from '@/lib/db/queries/blog';
import { TagsList } from './tags-list';

export default async function BlogTagsPage() {
  const user = await getUser();
  
  if (!user || !canManageBlog(user.role)) {
    redirect('/dashboard');
  }

  const tags = await getBlogTagsWithPostCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="text-gray-500">Manage tags for your blog posts</p>
      </div>

      <TagsList tags={tags} />
    </div>
  );
}
