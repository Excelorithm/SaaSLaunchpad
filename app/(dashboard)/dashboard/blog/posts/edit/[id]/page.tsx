import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { canManageBlog, getBlogPostById, getAllBlogCategories, getAllBlogTags } from '@/lib/db/queries/blog';
import { PostForm } from '@/components/blog/post-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const user = await getUser();
  
  if (!user || !canManageBlog(user.role)) {
    redirect('/dashboard');
  }

  const post = await getBlogPostById(parseInt(id));
  
  if (!post) {
    redirect('/dashboard/blog/posts');
  }

  const categories = await getAllBlogCategories();
  const tags = await getAllBlogTags();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/blog/posts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Post</h1>
          <p className="text-gray-500">{post.title}</p>
        </div>
      </div>

      <PostForm post={post as any} categories={categories} tags={tags} />
    </div>
  );
}
