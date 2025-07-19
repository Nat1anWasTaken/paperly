"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// Custom components for ReactMarkdown
/* eslint-disable @typescript-eslint/no-explicit-any */
const markdownComponents: any = {
  // Headers
  h1: ({ children, ...props }: any) => (
    <h1 className="text-2xl font-bold mb-4 mt-6 text-primary" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-xl font-bold mb-3 mt-5 text-primary" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-lg font-bold mb-3 mt-4 text-primary" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 className="text-base font-bold mb-2 mt-3 text-primary" {...props}>
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children, ...props }: any) => (
    <p className="mb-3 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Lists
  ul: ({ children, ...props }: any) => (
    <ul className="mb-3 pl-4 space-y-1 list-disc list-inside" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="mb-3 pl-4 space-y-1 list-decimal list-inside" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Code
  code: ({ inline, children, className, ...props }: any) => {
    if (inline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 text-sm font-mono border rounded" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm font-mono mb-3 border">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },

  // Links
  a: ({ href, children, ...props }: any) => (
    <a href={href} className="text-primary hover:text-primary/80 underline font-medium transition-colors" target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),

  // Strong/Bold
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),

  // Emphasis/Italic
  em: ({ children, ...props }: any) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 my-3 italic text-muted-foreground" {...props}>
      {children}
    </blockquote>
  ),

  // Break lines
  br: () => <br className="my-1" />,

  // Horizontal rules
  hr: ({ ...props }: any) => <hr className="my-4 border-t border-border" {...props} />
};
/* eslint-enable @typescript-eslint/no-explicit-any */

function parseWithMath(content: string): React.ReactNode {
  let keyCounter = 0;

  // First handle display math \[...\]
  const displayMathRegex = /\\\[([s\S]*?)\\\]/g;
  const processedContent = content.replace(displayMathRegex, (match, mathContent) => {
    return `___DISPLAY_MATH_${keyCounter++}___${mathContent}___END_DISPLAY_MATH___`;
  });

  // Then handle inline math \(...\)
  const finalContent = processedContent.replace(/\\\((.*?)\\\)/g, (match, mathContent) => {
    return `___INLINE_MATH_${keyCounter++}___${mathContent}___END_INLINE_MATH___`;
  });

  // Split by math placeholders and process
  const segments = finalContent.split(/(___(?:DISPLAY|INLINE)_MATH_\d+___.*?___END_(?:DISPLAY|INLINE)_MATH___)/);

  return segments.map((segment, index) => {
    if (segment.startsWith("___DISPLAY_MATH_")) {
      const mathContent = segment.match(/___DISPLAY_MATH_\d+___(.*?)___END_DISPLAY_MATH___/)?.[1] || "";
      return (
        <div key={index} className="my-4">
          <BlockMath math={mathContent} />
        </div>
      );
    } else if (segment.startsWith("___INLINE_MATH_")) {
      const mathContent = segment.match(/___INLINE_MATH_\d+___(.*?)___END_INLINE_MATH___/)?.[1] || "";
      return <InlineMath key={index} math={mathContent} />;
    } else {
      // Regular markdown content
      return (
        <ReactMarkdown key={index} remarkPlugins={[remarkBreaks, remarkGfm]} components={markdownComponents} skipHtml={false}>
          {segment}
        </ReactMarkdown>
      );
    }
  });
}

interface MdxRendererProps {
  content: string;
  className?: string;
}

export function MdxRenderer({ content, className = "prose prose-sm max-w-none dark:prose-invert" }: MdxRendererProps) {
  // Clean up the content for better markdown parsing
  const cleanContent = content
    .replace(/\\n/g, "\n") // Convert literal \n to actual newlines
    .replace(/\n\n+/g, "\n\n") // Normalize multiple newlines
    .trim();

  return <div className={className}>{parseWithMath(cleanContent)}</div>;
}