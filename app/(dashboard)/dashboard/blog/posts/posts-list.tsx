'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/blog/utils';

interface Post {
  id: number;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: number;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
}

interface PostsListProps {
  posts: Post[];
}

export function PostsList({ posts: initialPosts }: PostsListProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/blog/posts?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete post');

      setPosts(posts.filter(p => p.id !== id));
      router.refresh();
    } catch (error) {
      alert('Failed to delete post');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
      draft: 'secondary',
      published: 'success',
      scheduled: 'warning',
      archived: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getVisibilityBadge = (visibility: string) => {
    return visibility === 'private' 
      ? <Badge variant="outline">Private</Badge>
      : null;
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500">No posts yet. Create your first post!</p>
        <Link href="/dashboard/blog/posts/new">
          <Button className="mt-4">Create Post</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Published</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Engagement</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <div className="flex flex-col">
                  <Link
                    href={`/dashboard/blog/posts/edit/${post.id}`}
                    className="font-medium hover:underline"
                  >
                    {post.title}
                  </Link>
                  <span className="text-sm text-gray-500">{post.slug}</span>
                </div>
              </TableCell>
              <TableCell>
                <span>{post.author.user.name || post.author.user.email}</span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {getStatusBadge(post.status)}
                  {getVisibilityBadge(post.visibility)}
                </div>
              </TableCell>
              <TableCell>
                {post.publishedAt ? formatDate(post.publishedAt) : '-'}
              </TableCell>
              <TableCell>{post.viewCount}</TableCell>
              <TableCell>
                <span className="text-sm">
                  {post.likeCount} likes, {post.commentCount} comments
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/blog/posts/edit/${post.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    {post.status === 'published' && (
                      <DropdownMenuItem asChild>
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(post.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
