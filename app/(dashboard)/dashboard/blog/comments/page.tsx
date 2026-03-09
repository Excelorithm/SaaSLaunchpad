import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { canManageBlog, getAllComments } from '@/lib/db/queries/blog';
import { CommentsList } from './comments-list';

export default async function BlogCommentsPage() {
  const user = await getUser();
  
  if (!user || !canManageBlog(user.role)) {
    redirect('/dashboard');
  }

  const { comments, total, totalPages } = await getAllComments({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comments</h1>
        <p className="text-gray-500">Manage and moderate blog comments</p>
      </div>

      <CommentsList comments={comments} />
    </div>
  );
}
