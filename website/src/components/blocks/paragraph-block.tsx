import { ParagraphBlock } from "@/data/types";
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { useState, useEffect } from 'react';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

interface ParagraphBlockProps {
  block: ParagraphBlock;
}

// Types for MDX components
interface MDXLinkProps {
  href?: string;
  children: React.ReactNode;
  [key: string]: unknown;
}

interface MDXElementProps {
  children: React.ReactNode;
  [key: string]: unknown;
}

// Custom components for MDX rendering
const mdxComponents = {
  // Custom link component for references
  a: ({ href, children, ...props }: MDXLinkProps) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline font-medium transition-colors"
      onClick={(e) => {
        if (href?.startsWith('#')) {
          e.preventDefault();
          // Scroll to reference if it exists on the page
          const targetElement = document.getElementById(href.slice(1));
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }}
      {...props}
    >
      {children}
    </a>
  ),
  // Custom paragraph to avoid nested paragraphs
  p: ({ children, ...props }: MDXElementProps) => (
    <span {...props}>{children}</span>
  ),
  // Bold text
  strong: ({ children, ...props }: MDXElementProps) => (
    <strong className="font-semibold" {...props}>{children}</strong>
  ),
  // Italic text
  em: ({ children, ...props }: MDXElementProps) => (
    <em className="italic" {...props}>{children}</em>
  ),
  // Code inline
  code: ({ children, ...props }: MDXElementProps) => (
    <code className="bg-muted px-1.5 py-0.5 text-sm font-mono border rounded" {...props}>
      {children}
    </code>
  ),
};

export function ParagraphBlockComponent({ block }: ParagraphBlockProps) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function serializeMDX() {
      try {
        // Serialize the MDX content
        const serialized = await serialize(block.text, {
          mdxOptions: {
            remarkPlugins: [],
            rehypePlugins: [],
            development: process.env.NODE_ENV === 'development',
          },
        });
        setMdxSource(serialized);
        setError(null);
      } catch (err) {
        console.error('Error serializing MDX:', err);
        setError('Failed to render content');
        // Fallback to plain text if MDX fails
        setMdxSource(null);
      }
    }

    serializeMDX();
  }, [block.text]);

  return (
    <div className="mb-4">
      {block.title && (
        <h4 className="text-lg font-medium mb-2">{block.title}</h4>
      )}
      <div className="text-base leading-relaxed">
        {error ? (
          // Fallback to plain text if MDX fails
          <p className="text-base leading-relaxed">{block.text}</p>
        ) : mdxSource ? (
          <MDXRemote {...mdxSource} components={mdxComponents} />
        ) : (
          // Loading state
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        )}
      </div>
    </div>
  );
}
