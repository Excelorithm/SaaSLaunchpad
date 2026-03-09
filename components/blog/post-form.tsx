'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TipTapEditor } from './tiptap-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Upload, Loader2 } from 'lucide-react';
import { generateSlug, extractExcerpt } from '@/lib/blog/utils';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface Media {
  id: number;
  url: string;
  originalName: string;
}

interface PostFormProps {
  post?: {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    status: string;
    visibility: string;
    metaTitle: string | null;
    metaDescription: string | null;
    metaKeywords: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    canonicalUrl: string | null;
    allowComments: boolean;
    featuredImageId: number | null;
    ogImageId: number | null;
    categories: { categoryId: number }[];
    tags: { tagId: number }[];
  } | null;
  categories: Category[];
  tags: Tag[];
}

export function PostForm({ post, categories, tags }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [content, setContent] = useState(post?.content || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [status, setStatus] = useState(post?.status || 'draft');
  const [visibility, setVisibility] = useState(post?.visibility || 'public');
  const [allowComments, setAllowComments] = useState(post?.allowComments ?? true);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    post?.categories.map(c => c.categoryId) || []
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    post?.tags.map(t => t.tagId) || []
  );
  const [featuredImageId, setFeaturedImageId] = useState<number | null>(
    post?.featuredImageId || null
  );
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || '');
  const [metaKeywords, setMetaKeywords] = useState(post?.metaKeywords || '');
  const [ogTitle, setOgTitle] = useState(post?.ogTitle || '');
  const [ogDescription, setOgDescription] = useState(post?.ogDescription || '');
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl || '');
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/blog/media?limit=50');
      const data = await res.json();
      setMedia(data.media || []);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/blog/media', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to upload image');
    
    const data = await res.json();
    setMedia(prev => [data.media, ...prev]);
    return data.media.url;
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!post && !slug) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e: React.FormEvent, publishStatus?: string) => {
    e.preventDefault();
    setLoading(true);

    const finalStatus = publishStatus || status;
    const finalExcerpt = excerpt || extractExcerpt(content);

    const postData = {
      id: post?.id,
      title,
      slug: slug || generateSlug(title),
      content,
      excerpt: finalExcerpt,
      status: finalStatus,
      visibility,
      allowComments,
      categoryIds: selectedCategories,
      tagIds: selectedTags,
      featuredImageId,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      metaKeywords: metaKeywords || undefined,
      ogTitle: ogTitle || undefined,
      ogDescription: ogDescription || undefined,
      canonicalUrl: canonicalUrl || undefined,
    };

    try {
      const url = post ? '/api/blog/posts' : '/api/blog/posts';
      const method = post ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save post');
      }

      router.push('/dashboard/blog/posts');
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter post title"
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="post-url-slug"
              required
            />
          </div>

          <div>
            <Label>Content</Label>
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Write your blog post content..."
              onImageUpload={handleImageUpload}
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt (optional)</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of the post (auto-generated if left empty)"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="comments">Allow Comments</Label>
                <Switch
                  id="comments"
                  checked={allowComments}
                  onCheckedChange={setAllowComments}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategories.includes(category.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              {media.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No images uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {media.map((m) => (
                    <div
                      key={m.id}
                      className={`cursor-pointer rounded overflow-hidden border-2 ${
                        featuredImageId === m.id ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setFeaturedImageId(m.id)}
                    >
                      <img src={m.url} alt={m.originalName} className="w-full h-12 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO title (defaults to post title)"
                  maxLength={255}
                />
              </div>
              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="SEO description"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div>
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                  maxLength={500}
                />
              </div>
              <div>
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://example.com/post"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {post ? 'Update Post' : 'Save Draft'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={(e) => handleSubmit(e, 'published')}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publish
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
