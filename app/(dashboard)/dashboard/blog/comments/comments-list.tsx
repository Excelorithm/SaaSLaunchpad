'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Trash2, ExternalLink, MessageCircle } from 'lucide-react';
import { formatRelativeTime } from '@/lib/blog/utils';

interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  status: string;
  guestName: string | null;
  guestEmail: string | null;
  createdAt: string;
  post: {
    id: number;
    title: string;
    slug: string;
  };
  author: {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  } | null;
}

interface CommentsListProps {
  comments: Comment[];
}

export function CommentsList({ comments: initialComments }: CommentsListProps) {
  const [comments, setComments] = useState(initialComments);
  const [filter, setFilter] = useState<string>('all');

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error('Failed to update comment');

      setComments(comments.map(c => c.id === id ? { ...c, status } : c));
    } catch (error) {
      alert('Failed to update comment status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const res = await fetch(`/api/blog/comments?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete comment');

      setComments(comments.filter(c => c.id !== id));
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
      pending: 'warning',
      approved: 'success',
      spam: 'destructive',
      trash: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const filteredComments = filter === 'all' 
    ? comments 
    : comments.filter(c => c.status === filter);

  if (comments.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No comments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Comments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
            <SelectItem value="trash">Trash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredComments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {comment.author?.user.image ? (
                    <img 
                      src={comment.author.user.image} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium">
                      {(comment.author?.user.name || comment.guestName || 'A')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {comment.author?.user.name || comment.guestName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(comment.createdAt)}
                  </p>
                </div>
                {getStatusBadge(comment.status)}
              </div>
              <div className="flex items-center gap-2">
                <Link 
                  href={`/blog/${comment.post.slug}`}
                  target="_blank"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {comment.post.title}
                  <ExternalLink className="inline ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{comment.content}</p>
            
            <div className="flex gap-2">
              {comment.status !== 'approved' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(comment.id, 'approved')}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Approve
                </Button>
              )}
              {comment.status !== 'spam' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(comment.id, 'spam')}
                >
                  Mark as Spam
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(comment.id)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
