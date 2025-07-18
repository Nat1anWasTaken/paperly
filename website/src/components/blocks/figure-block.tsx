import { FigureBlock } from "@/data/types";
import Image from "next/image";

interface FigureBlockProps {
  block: FigureBlock;
}

export function FigureBlockComponent({ block }: FigureBlockProps) {
  return (
    <figure className="my-6">
      {block.image_url ? (
        <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
          <Image src={block.image_url} alt={block.caption || "Figure"} fill className="object-contain" />
        </div>
      ) : (
        <div className="w-full h-64 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">Figure placeholder</span>
        </div>
      )}
      {(block.caption || block.figure_number) && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center">
          {block.figure_number && `Figure ${block.figure_number}: `}
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}
