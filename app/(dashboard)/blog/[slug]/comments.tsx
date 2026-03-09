'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSession } from 'next-auth/react';
import { formatRelativeTime } from '@/lib/blog/utils';
import { MessageCircle, Send, Loader2 } from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  } | null;
  guestName: string | null;
  replies?: Comment[];
}

interface CommentsProps {
  postId: number;
}

export function Comments({ postId }: CommentsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    guestName: '',
    guestEmail: '',
  });

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/blog/comments?postId=${postId}&status=approved`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: number) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          parentId,
          content: formData.content,
          guestName: session?.user ? undefined : formData.guestName,
          guestEmail: session?.user ? undefined : formData.guestEmail,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit comment');
      }

      setFormData({ content: '', guestName: '', guestEmail: '' });
      setReplyingTo(null);
      alert('Comment submitted! It will be visible after approval.');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
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
            <p className="text-xs text-gray-500">{formatRelativeTime(comment.createdAt)}</p>
          </div>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        {depth < 2 && (
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-sm text-blue-600 hover:underline mt-2"
          >
            Reply
          </button>
        )}
      </div>

      {replyingTo === comment.id && (
        <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mb-4 ml-8">
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write a reply..."
            rows={3}
            required
          />
          <div className="flex gap-2 mt-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reply'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
    </div>
  );

  if (loading) {
    return <p className="text-gray-500">Loading comments...</p>;
  }

  return (
    <div>
      <form onSubmit={(e) => handleSubmit(e)} className="bg-white rounded-lg border p-6 mb-8">
        <h3 className="font-bold mb-4">Leave a Comment</h3>
        
        {!session?.user && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="guestName">Name</Label>
              <Input
                id="guestName"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                value={formData.guestEmail}
                onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                required
              />
            </div>
          </div>
        )}

        <div className="mb-4">
          <Label htmlFor="content">Comment</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your comment..."
            rows={4}
            required
          />
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Submit Comment
        </Button>
      </form>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div>{comments.map((comment) => renderComment(comment))}</div>
      )}
    </div>
  );
}
