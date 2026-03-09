'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, X, Loader2 } from 'lucide-react';
import { generateSlug } from '@/lib/blog/utils';

interface Tag {
  id: number;
  name: string;
  slug: string;
  postCount: number;
}

interface TagsListProps {
  tags: Tag[];
}

export function TagsList({ tags: initialTags }: TagsListProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/blog/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || generateSlug(name),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create tag');
      }

      const data = await res.json();
      setTags([...tags, { ...data.tag, postCount: 0 }]);
      setName('');
      setSlug('');
      setDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const res = await fetch(`/api/blog/tags?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete tag');

      setTags(tags.filter(t => t.id !== id));
      router.refresh();
    } catch (error) {
      alert('Failed to delete tag');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">All Tags</h2>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Tag
          </Button>
        </div>

        {tags.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tags yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="px-3 py-1 text-sm"
              >
                {tag.name}
                <span className="ml-2 text-gray-500">({tag.postCount})</span>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Tag</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
