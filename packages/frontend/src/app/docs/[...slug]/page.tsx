'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DocPage() {
  const params = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = params?.slug ? (params.slug as string[]).join('/') : '';
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/docs/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
        }
      } catch (error) {
        console.error('Failed to load documentation:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <div className="inline-block h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm sm:text-base text-gray-500">Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Documentation Not Found</h1>
        <p className="text-sm sm:text-base text-gray-500">The requested documentation page could not be found.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

