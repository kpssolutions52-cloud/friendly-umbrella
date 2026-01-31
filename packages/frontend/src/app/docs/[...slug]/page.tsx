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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words" {...props} />
          ),
          h2: ({node, ...props}) => (
            <h2 className="text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-gray-800 border-b border-gray-200 pb-2 break-words" {...props} />
          ),
          h3: ({node, ...props}) => (
            <h3 className="text-lg sm:text-xl font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3 text-gray-700 break-words" {...props} />
          ),
          p: ({node, ...props}) => (
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-3 sm:mb-4" {...props} />
          ),
          a: ({node, ...props}) => (
            <a className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors" {...props} />
          ),
          code: ({node, inline, ...props}: any) => {
            if (inline) {
              return <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono break-words" {...props} />;
            }
            return (
              <div className="overflow-x-auto -mx-4 sm:mx-0 my-4 sm:my-6">
                <code className="block bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg text-xs sm:text-sm font-mono whitespace-pre overflow-x-auto" {...props} />
              </div>
            );
          },
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-blue-500 pl-3 sm:pl-4 italic text-sm sm:text-base text-gray-700 my-3 sm:my-4 bg-blue-50 py-2 sm:py-3 rounded-r" {...props} />
          ),
          ul: ({node, ...props}) => (
            <ul className="list-disc pl-5 sm:pl-6 space-y-1 sm:space-y-2 my-3 sm:my-4" {...props} />
          ),
          ol: ({node, ...props}) => (
            <ol className="list-decimal pl-5 sm:pl-6 space-y-1 sm:space-y-2 my-3 sm:my-4" {...props} />
          ),
          li: ({node, ...props}) => (
            <li className="text-sm sm:text-base text-gray-600 my-1 leading-relaxed" {...props} />
          ),
          table: ({node, ...props}) => (
            <div className="my-4 sm:my-6">
              {/* Mobile: Scrollable with visual indicator */}
              <div className="block sm:hidden -mx-4 px-4">
                <div className="relative">
                  <div className="bg-gradient-to-r from-blue-50 to-transparent px-3 py-2 text-[10px] font-bold text-blue-700 uppercase tracking-wider border-b-2 border-blue-200 mb-1 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <span>📊</span>
                      <span>Scroll → to see all columns</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto overscroll-x-contain -mx-4 px-4">
                    <div className="inline-block min-w-full shadow-lg rounded-lg border-2 border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 table-auto" style={{ display: 'table', tableLayout: 'auto' }} {...props} />
                    </div>
                  </div>
                  {/* Scroll indicator gradient */}
                  <div className="absolute right-0 top-8 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                </div>
              </div>
              {/* Desktop: Standard table */}
              <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300" style={{ display: 'table' }} {...props} />
                  </div>
                </div>
              </div>
            </div>
          ),
          thead: ({node, ...props}) => (
            <thead className="bg-blue-50" style={{ display: 'table-header-group' }} {...props} />
          ),
          tbody: ({node, ...props}) => (
            <tbody className="bg-white divide-y divide-gray-200" style={{ display: 'table-row-group' }} {...props} />
          ),
          tr: ({node, ...props}) => (
            <tr style={{ display: 'table-row' }} {...props} />
          ),
          th: ({node, ...props}) => (
            <th className="px-2.5 sm:px-4 py-3 sm:py-3.5 bg-blue-50 sm:bg-blue-50 text-left text-[10px] sm:text-xs font-bold text-gray-800 uppercase tracking-wide border-b-2 border-gray-300 whitespace-nowrap min-w-[90px] sm:min-w-0 first:sticky first:left-0 first:z-20 first:bg-blue-50" style={{ display: 'table-cell' }} {...props} />
          ),
          td: ({node, ...props}) => (
            <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-sm text-gray-700 border-b border-gray-100 break-words align-top min-w-[100px] sm:min-w-0 first:sticky first:left-0 first:z-10 first:bg-white first:font-medium first:text-gray-900" style={{ display: 'table-cell' }} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

