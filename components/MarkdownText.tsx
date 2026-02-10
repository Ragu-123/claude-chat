import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownTextProps {
  content: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content }) => {
  return (
    <div className="markdown-content font-serif text-[15px] md:text-base leading-relaxed text-stone-900 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-stone-900 font-sans">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-stone-900 font-sans">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 text-stone-900 font-sans">{children}</h3>,
          
          // Lists
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1 marker:text-stone-400">{children}</li>,
          
          // Code
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <div className="rounded-md overflow-hidden my-4 border border-stone-200 bg-[#2d2d2d] shadow-sm">
                <div className="bg-[#1e1e1e] px-4 py-1 text-xs text-stone-400 font-mono border-b border-[#3e3e3e] flex justify-between items-center">
                    <span>{match ? match[1] : 'code'}</span>
                </div>
                <pre className="p-4 overflow-x-auto text-sm text-stone-200 font-mono leading-relaxed bg-[#2d2d2d] m-0">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-stone-200/60 text-[#D97757] text-sm px-1.5 py-0.5 rounded font-mono border border-stone-300/30" {...props}>
                {children}
              </code>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#D97757]/40 pl-4 py-1 my-4 text-stone-600 italic bg-stone-50/50 rounded-r-lg">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#D97757] hover:underline hover:text-[#c56a4b] transition-colors decoration-2 decoration-[#D97757]/30">
              {children}
            </a>
          ),
          
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-stone-200 shadow-sm">
                <table className="min-w-full divide-y divide-stone-200 text-sm">
                    {children}
                </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-stone-100 font-sans font-semibold text-stone-700">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-stone-200 bg-white">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th className="px-4 py-3 text-left">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 text-stone-600">{children}</td>,
          
          // Separator
          hr: () => <hr className="my-6 border-stone-300" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};