import { ParagraphBlock } from "@/data/types";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { useState, useEffect } from "react";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import ReactMarkdown from "react-markdown";

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
        if (href?.startsWith("#")) {
          e.preventDefault();
          // Scroll to reference if it exists on the page
          const targetElement = document.getElementById(href.slice(1));
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth" });
          }
        }
      }}
      {...props}
    >
      {children}
    </a>
  ),
  // Custom paragraph to avoid nested paragraphs
  p: ({ children, ...props }: MDXElementProps) => <span {...props}>{children}</span>,
  // Bold text
  strong: ({ children, ...props }: MDXElementProps) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  // Italic text
  em: ({ children, ...props }: MDXElementProps) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
  // Code inline
  code: ({ children, ...props }: MDXElementProps) => (
    <code className="bg-muted px-1.5 py-0.5 text-sm font-mono border rounded" {...props}>
      {children}
    </code>
  )
};

// Simple markdown components for fallback rendering
const simpleMarkdownComponents: any = {
  p: ({ children }: any) => <span>{children}</span>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  code: ({ children }: any) => (
    <code className="bg-muted px-1.5 py-0.5 text-sm font-mono border rounded">
      {children}
    </code>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline font-medium transition-colors"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
};

// Function to sanitize content for MDX processing
function sanitizeContentForMDX(content: string): string {
  return content
    // Escape standalone angle brackets that might be interpreted as JSX
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Escape curly braces that might be interpreted as JSX expressions
    .replace(/{/g, "&#123;")
    .replace(/}/g, "&#125;")
    // Handle common problematic patterns that cause JSX parsing errors
    .replace(/\/>/g, "/&gt;")
    .replace(/<\//g, "&lt;/")
    .replace(/\/[^/\s]*>/g, (match) => match.replace(/\//g, "&#47;"))
    // Escape backslashes that might be problematic
    .replace(/\\/g, "&#92;")
    // Clean up multiple spaces and normalize line breaks
    .replace(/\s+/g, " ")
    .trim();
}

// Function to check if content might be safe for MDX processing
function isContentSafeForMDX(content: string): boolean {
  // Check for patterns that commonly cause MDX parsing errors
  const problematicPatterns = [
    /<[^>]*>/,           // HTML-like tags
    /\/>/,               // Self-closing JSX syntax
    /<\//,               // Closing JSX tags
    /\{.*\}/,            // JSX expressions
    /<\w+\s+/,           // Opening tags with attributes
    /<\/\w+>/,           // Explicit closing tags
    /\\[^a-zA-Z\s]/,     // Escape sequences that aren't common markdown
    /<[^>]*\/[^>]*>/,    // Any tag containing forward slash
    /\/[^/\s]*>/,        // Forward slash followed by non-whitespace and closing bracket
  ];
  
  return !problematicPatterns.some(pattern => pattern.test(content));
}

export function ParagraphBlockComponent({ block }: ParagraphBlockProps) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    async function serializeMDX() {
      try {
        // Check if content is safe for MDX processing
        if (!isContentSafeForMDX(block.text)) {
          console.warn("Content contains potentially problematic patterns for MDX, using fallback rendering");
          setUseFallback(true);
          return;
        }

        // Sanitize content before processing
        const sanitizedContent = sanitizeContentForMDX(block.text);
        
        // Serialize the MDX content
        const serialized = await serialize(sanitizedContent, {
          mdxOptions: {
            remarkPlugins: [],
            rehypePlugins: [],
            development: process.env.NODE_ENV === "development"
          }
        });
        setMdxSource(serialized);
        setError(null);
        setUseFallback(false);
      } catch (err) {
        console.error("Error serializing MDX:", err);
        setError("Failed to render content");
        // Fallback to plain text if MDX fails
        setMdxSource(null);
        setUseFallback(true);
      }
    }

    serializeMDX();
  }, [block.text]);

  return (
    <div className="mb-4">
      {block.title && <h4 className="text-lg font-medium mb-2">{block.title}</h4>}
      <div className="text-base leading-relaxed">
        {error ? (
          // Complete fallback to plain text if everything fails
          <p className="text-base leading-relaxed">{block.text}</p>
        ) : useFallback ? (
          // Fallback to simple markdown if MDX processing is unsafe
          <ReactMarkdown components={simpleMarkdownComponents}>
            {block.text}
          </ReactMarkdown>
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
