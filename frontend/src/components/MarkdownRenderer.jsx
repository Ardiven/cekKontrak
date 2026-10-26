import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Minimal markdown renderer for chat messages & explanations.
 * Conforms to desain.md v2 specifications.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`markdown-body text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-slate-800">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700">{children}</em>
          ),
          code: ({ inline, children }) =>
            inline ? (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[13px]">
                {children}
              </code>
            ) : (
              <pre className="my-2 p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                <code>{children}</code>
              </pre>
            ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2 text-slate-800 pl-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 text-slate-800 pl-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-slate-300 pl-3 italic text-slate-600 my-2">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline hover:text-accent-hover"
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
