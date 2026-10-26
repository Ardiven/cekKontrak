import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Renders markdown text with styled typography appropriate for chat bubbles.
 * Supports: bold, italic, inline code, code blocks, lists, and paragraphs.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className="leading-relaxed mb-2 last:mb-0">{children}</p>
          ),

          // Bold
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">{children}</strong>
          ),

          // Italic
          em: ({ children }) => (
            <em className="italic text-slate-700">{children}</em>
          ),

          // Inline code
          code: ({ inline, children }) =>
            inline ? (
              <code className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800 font-mono text-[11px]">
                {children}
              </code>
            ) : (
              <pre className="mt-2 mb-2 p-3 rounded-xl bg-slate-800 text-slate-100 font-mono text-xs overflow-x-auto">
                <code>{children}</code>
              </pre>
            ),

          // Unordered list
          ul: ({ children }) => (
            <ul className="list-none space-y-1 my-2 pl-0">{children}</ul>
          ),

          // Ordered list
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 pl-1">{children}</ol>
          ),

          // List items with custom bullet
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-slate-800 leading-relaxed">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
              <span className="flex-1">{children}</span>
            </li>
          ),

          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-extrabold text-slate-900 mt-2 mb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-slate-900 mt-2 mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-slate-800 mt-1 mb-0.5">{children}</h3>
          ),

          // Horizontal rule
          hr: () => <hr className="my-2 border-slate-200" />,

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-secondary pl-3 italic text-slate-600 my-2">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary underline underline-offset-2 hover:text-teal-800"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
