import { HeaderBlock } from "@/data/types";

interface HeaderBlockProps {
  block: HeaderBlock;
}

export function HeaderBlockComponent({ block }: HeaderBlockProps) {
  const level = Math.min(Math.max(block.level, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;

  const classNames: Record<number, string> = {
    1: "text-4xl font-bold mb-6 mt-8",
    2: "text-3xl font-semibold mb-4 mt-6",
    3: "text-2xl font-semibold mb-3 mt-5",
    4: "text-xl font-semibold mb-2 mt-4",
    5: "text-lg font-semibold mb-2 mt-3",
    6: "text-base font-semibold mb-1 mt-2",
  };

  const className = classNames[level];

  switch (level) {
    case 1:
      return <h1 className={className}>{block.text}</h1>;
    case 2:
      return <h2 className={className}>{block.text}</h2>;
    case 3:
      return <h3 className={className}>{block.text}</h3>;
    case 4:
      return <h4 className={className}>{block.text}</h4>;
    case 5:
      return <h5 className={className}>{block.text}</h5>;
    case 6:
      return <h6 className={className}>{block.text}</h6>;
    default:
      return <h1 className={className}>{block.text}</h1>;
  }
}
