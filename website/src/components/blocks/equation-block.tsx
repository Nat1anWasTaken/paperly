import { EquationBlock } from "@/data/types";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface EquationBlockProps {
  block: EquationBlock;
}

export function EquationBlockComponent({ block }: EquationBlockProps) {
  // Remove $$ delimiters if present, as BlockMath handles them
  const cleanEquation = block.equation.replace(/^\$\$\s*|\s*\$\$$/g, '');
  
  return (
    <div className="my-6">
      <div className="bg-muted border rounded-lg p-4 text-center">
        <BlockMath math={cleanEquation} />
      </div>
      {block.caption && (
        <p className="mt-2 text-sm text-muted-foreground text-center">
          {block.caption}
        </p>
      )}
    </div>
  );
}
