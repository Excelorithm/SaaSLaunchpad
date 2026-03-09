'use client';

import { useEffect, useRef, useState } from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const images = contentRef.current.querySelectorAll('img');
      images.forEach((img) => {
        img.classList.add('rounded-lg', 'max-w-full', 'h-auto');
      });
    }
  }, [content]);

  return (
    <div 
      ref={contentRef}
      className="prose prose-lg max-w-none 
        prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
        prose-p:mb-4 prose-p:leading-relaxed
        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
        prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:overflow-x-auto
        prose-img:rounded-lg prose-img:max-w-full
        prose-ul:list-disc prose-ul:pl-6
        prose-ol:list-decimal prose-ol:pl-6
        prose-li:mb-1"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
