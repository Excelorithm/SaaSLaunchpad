import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { canManageBlog, getBlogCategoriesWithPostCount } from '@/lib/db/queries/blog';
import { CategoriesList } from './categories-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function BlogCategoriesPage() {
  const user = await getUser();
  
  if (!user || !canManageBlog(user.role)) {
    redirect('/dashboard');
  }

  const categories = await getBlogCategoriesWithPostCount();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-gray-500">Organize your blog posts into categories</p>
        </div>
        <Link href="/dashboard/blog/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        </Link>
      </div>

      <CategoriesList categories={categories} />
    </div>
  );
}
