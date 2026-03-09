'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Trash2, Loader2, Copy, Check } from 'lucide-react';

interface Media {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText: string | null;
  title: string | null;
  caption: string | null;
  createdAt: string;
}

interface MediaGridProps {
  media: Media[];
}

export function MediaGrid({ media: initialMedia }: MediaGridProps) {
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [copied, setCopied] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/blog/media', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Failed to upload file');

        const data = await res.json();
        setMedia(prev => [data.media, ...prev]);
      }
    } catch (error) {
      alert('Failed to upload file(s)');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const mediaItem = media.find(m => m.id === id);
      const res = await fetch(
        `/api/blog/media?id=${id}&path=${mediaItem?.url}&storageProvider=local`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Failed to delete file');

      setMedia(media.filter(m => m.id !== id));
      setSelectedMedia(null);
    } catch (error) {
      alert('Failed to delete file');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <Button asChild disabled={uploading}>
            <span>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Images
            </span>
          </Button>
        </label>
        <span className="text-sm text-gray-500">
          Supported: JPG, PNG, GIF, WebP, SVG (max 10MB)
        </span>
      </div>

      {media.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No media uploaded yet</p>
          <p className="text-sm text-gray-400 mt-1">Upload images to use in your blog posts</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border overflow-hidden cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedMedia(item)}
            >
              <div className="aspect-square relative">
                <img
                  src={item.url}
                  alt={item.altText || item.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-xs truncate">{item.originalName}</p>
                <p className="text-xs text-gray-400">{formatFileSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media Details</DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-4">
              <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.altText || selectedMedia.originalName}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Filename</Label>
                  <p className="text-sm">{selectedMedia.originalName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Size</Label>
                  <p className="text-sm">{formatFileSize(selectedMedia.size)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Type</Label>
                  <p className="text-sm">{selectedMedia.mimeType}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Uploaded</Label>
                  <p className="text-sm">
                    {new Date(selectedMedia.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <Label>URL</Label>
                <div className="flex gap-2">
                  <Input value={selectedMedia.url} readOnly />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(selectedMedia.url)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => selectedMedia && handleDelete(selectedMedia.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
