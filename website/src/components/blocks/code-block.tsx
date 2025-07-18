import { CodeBlockBlock } from "@/data/types";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface CodeBlockProps {
  block: CodeBlockBlock;
}

export function CodeBlockComponent({ block }: CodeBlockProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Show a neutral state while mounting to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="my-6">
        {block.language && (
          <div className="bg-muted-foreground text-muted text-xs px-3 py-1 rounded-t-lg font-mono">
            {block.language}
          </div>
        )}
        <div className={`overflow-hidden ${block.language ? "rounded-b-lg" : "rounded-lg"}`}>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <pre>{block.code}</pre>
          </div>
        </div>
      </div>
    );
  }
  
  const isDark = theme === 'dark';

  return (
    <div className="my-6">
      {block.language && (
        <div className="bg-muted-foreground text-muted text-xs px-3 py-1 rounded-t-lg font-mono">
          {block.language}
        </div>
      )}
      <div className={`overflow-hidden ${block.language ? "rounded-b-lg" : "rounded-lg"}`}>
        <SyntaxHighlighter
          language={block.language || 'text'}
          style={isDark ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            borderRadius: block.language ? '0 0 0.5rem 0.5rem' : '0.5rem',
            border: 'none',
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            color: isDark ? '#6b7280' : '#9ca3af',
            borderRight: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            marginRight: '1em',
            userSelect: 'none',
          }}
          wrapLines={false}
          lineProps={{
            style: { 
              display: 'block',
              border: 'none',
              borderBottom: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
            }
          }}
          codeTagProps={{
            style: {
              background: 'transparent',
              padding: 0,
              border: 'none',
            }
          }}
          PreTag="div"
        >
          {block.code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
