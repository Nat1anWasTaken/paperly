import { QuoteBlock } from "@/data/types";

interface QuoteBlockProps {
  block: QuoteBlock;
}

export function QuoteBlockComponent({ block }: QuoteBlockProps) {
  return (
    <blockquote className="my-6 border-l-4 border-primary pl-4 italic">
      <p className="text-lg text-foreground mb-2">"{block.text}"</p>
      {block.author && (
        <cite className="text-sm text-muted-foreground not-italic">— {block.author}</cite>
      )}
    </blockquote>
  );
} 