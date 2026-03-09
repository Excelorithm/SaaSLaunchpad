import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { canManageBlog, getBlogMedia } from '@/lib/db/queries/blog';
import { MediaGrid } from './media-grid';

export default async function BlogMediaPage() {
  const user = await getUser();
  
  if (!user || !canManageBlog(user.role)) {
    redirect('/dashboard');
  }

  const { media, total } = await getBlogMedia({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="text-gray-500">Manage your uploaded images and files</p>
      </div>

      <MediaGrid media={media} />
    </div>
  );
}
