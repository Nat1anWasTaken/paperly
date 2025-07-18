import { ReferenceBlock } from "@/data/types";

interface ReferenceBlockProps {
  block: ReferenceBlock;
}

export function ReferenceBlockComponent({ block }: ReferenceBlockProps) {
  return (
    <div className="my-3 p-2 bg-muted/50 rounded border-l-2 border-primary text-xs">
      <div className="text-foreground font-medium mb-1">{block.title}</div>
      <div className="text-muted-foreground">
        {block.authors.join(", ")}
        {block.publication_year && ` (${block.publication_year})`}
        {block.journal && `. ${block.journal}`}
        {block.volume && `, Vol. ${block.volume}`}
        {block.issue && `, Issue ${block.issue}`}
        {block.pages && `, pp. ${block.pages}`}
        {block.doi && (
          <>
            .{" "}
            <a href={`https://doi.org/${block.doi}`} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              DOI: {block.doi}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
