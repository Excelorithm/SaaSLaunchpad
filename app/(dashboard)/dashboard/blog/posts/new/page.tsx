import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { canManageBlog, getAllBlogCategories, getAllBlogTags } from '@/lib/db/queries/blog';
import { PostForm } from '@/components/blog/post-form';

export default async function NewPostPage() {
  const user = await getUser();
  
  if (!user || !canManageBlog(user.role)) {
    redirect('/dashboard');
  }

  const categories = await getAllBlogCategories();
  const tags = await getAllBlogTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Post</h1>
        <p className="text-gray-500">Write a new blog post</p>
      </div>

      <PostForm post={null} categories={categories} tags={tags} />
    </div>
  );
}
