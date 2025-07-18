import { EquationBlock } from "@/data/types";

interface EquationBlockProps {
  block: EquationBlock;
}

export function EquationBlockComponent({ block }: EquationBlockProps) {
  return (
    <div className="my-6">
      <div className="bg-muted border rounded-lg p-4 text-center">
        <div className="font-mono text-lg text-foreground">{block.equation}</div>
      </div>
      {block.caption && (
        <p className="mt-2 text-sm text-muted-foreground text-center">
          {block.caption}
        </p>
      )}
    </div>
  );
}
