import { FootnoteBlock } from "@/data/types";

interface FootnoteBlockProps {
  block: FootnoteBlock;
}

export function FootnoteBlockComponent({ block }: FootnoteBlockProps) {
  return (
    <div className="my-2 text-sm border-t border-border pt-2">
      <div className="flex items-start">
        <span className="inline-block w-6 text-muted-foreground font-mono">
          {block.reference_number}.
        </span>
        <p className="flex-1 text-foreground">{block.text}</p>
      </div>
    </div>
  );
}
