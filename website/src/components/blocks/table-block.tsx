import { TableBlock } from "@/data/types";

interface TableBlockProps {
  block: TableBlock;
}

export function TableBlockComponent({ block }: TableBlockProps) {
  return (
    <div className="my-6">
      {block.title && (
        <h4 className="text-lg font-medium mb-2 text-foreground">{block.title}</h4>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border rounded-lg">
          <thead>
            <tr className="bg-muted">
              {block.columns.map((column, index) => (
                <th
                  key={index}
                  className="border border-border px-4 py-2 text-left font-semibold text-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border border-border px-4 py-2 text-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.caption && (
        <p className="mt-2 text-sm text-muted-foreground text-center">{block.caption}</p>
      )}
    </div>
  );
} 