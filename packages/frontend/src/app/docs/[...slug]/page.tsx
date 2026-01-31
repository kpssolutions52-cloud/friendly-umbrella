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
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => (
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" {...props} />
          ),
          h2: ({node, ...props}) => (
            <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-800 border-b border-gray-200 pb-2" {...props} />
          ),
          h3: ({node, ...props}) => (
            <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-700" {...props} />
          ),
          p: ({node, ...props}) => (
            <p className="text-gray-600 leading-relaxed mb-4" {...props} />
          ),
          a: ({node, ...props}) => (
            <a className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors" {...props} />
          ),
          code: ({node, inline, ...props}: any) => {
            if (inline) {
              return <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />;
            }
            return <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto" {...props} />;
          },
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4 bg-blue-50 py-2 rounded-r" {...props} />
          ),
          ul: ({node, ...props}) => (
            <ul className="list-disc pl-6 space-y-2 my-4" {...props} />
          ),
          ol: ({node, ...props}) => (
            <ol className="list-decimal pl-6 space-y-2 my-4" {...props} />
          ),
          li: ({node, ...props}) => (
            <li className="text-gray-600 my-1" {...props} />
          ),
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg" {...props} />
            </div>
          ),
          th: ({node, ...props}) => (
            <th className="px-4 py-3 bg-blue-50 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b" {...props} />
          ),
          td: ({node, ...props}) => (
            <td className="px-4 py-3 text-sm text-gray-600 border-b" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

