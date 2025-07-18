import { CodeBlockBlock } from "@/data/types";

interface CodeBlockProps {
  block: CodeBlockBlock;
}

export function CodeBlockComponent({ block }: CodeBlockProps) {
  return (
    <div className="my-6">
      {block.language && (
        <div className="bg-muted-foreground text-muted text-xs px-3 py-1 rounded-t-lg font-mono">
          {block.language}
        </div>
      )}
      <pre
        className={`bg-muted text-muted-foreground p-4 overflow-x-auto font-mono text-sm border ${
          block.language ? "rounded-b-lg" : "rounded-lg"
        }`}
      >
        <code>{block.code}</code>
      </pre>
    </div>
  );
}
