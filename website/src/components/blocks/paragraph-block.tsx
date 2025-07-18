import { ParagraphBlock } from "@/data/types";

interface ParagraphBlockProps {
  block: ParagraphBlock;
}

export function ParagraphBlockComponent({ block }: ParagraphBlockProps) {
  return (
    <div className="mb-4">
      {block.title && (
        <h4 className="text-lg font-medium mb-2">{block.title}</h4>
      )}
      <p className="text-base leading-relaxed whitespace-pre-line">
        {block.text}
      </p>
    </div>
  );
}
