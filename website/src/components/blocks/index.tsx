import { PaperBlock, BlockKind } from "@/data/types";
import { HeaderBlockComponent } from "./header-block";
import { ParagraphBlockComponent } from "./paragraph-block";
import { FigureBlockComponent } from "./figure-block";
import { TableBlockComponent } from "./table-block";
import { EquationBlockComponent } from "./equation-block";
import { CodeBlockComponent } from "./code-block";
import { QuoteBlockComponent } from "./quote-block";
import { CalloutBlockComponent } from "./callout-block";
import { ReferenceBlockComponent } from "./reference-block";
import { FootnoteBlockComponent } from "./footnote-block";
import { QuizBlockComponent } from "./quiz-block";
import { SelectableBlockWrapper } from "@/components/selectable-block-wrapper";
import { TranslatedBlockWrapper } from "./translated-block-wrapper";

// Export all block components
export {
  HeaderBlockComponent,
  ParagraphBlockComponent,
  FigureBlockComponent,
  TableBlockComponent,
  EquationBlockComponent,
  CodeBlockComponent,
  QuoteBlockComponent,
  CalloutBlockComponent,
  ReferenceBlockComponent,
  FootnoteBlockComponent,
  QuizBlockComponent
};

// Main block renderer component
interface BlockRendererProps {
  block: PaperBlock;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const renderBlockContent = () => {
    switch (block.kind) {
      case BlockKind.HEADER:
        return <HeaderBlockComponent block={block} />;
      case BlockKind.PARAGRAPH:
        return <ParagraphBlockComponent block={block} />;
      case BlockKind.FIGURE:
        return <FigureBlockComponent block={block} />;
      case BlockKind.TABLE:
        return <TableBlockComponent block={block} />;
      case BlockKind.EQUATION:
        return <EquationBlockComponent block={block} />;
      case BlockKind.CODE_BLOCK:
        return <CodeBlockComponent block={block} />;
      case BlockKind.QUOTE:
        return <QuoteBlockComponent block={block} />;
      case BlockKind.CALLOUT:
        return <CalloutBlockComponent block={block} />;
      case BlockKind.REFERENCE:
        return <ReferenceBlockComponent block={block} />;
      case BlockKind.FOOTNOTE:
        return <FootnoteBlockComponent block={block} />;
      case BlockKind.QUIZ:
        return <QuizBlockComponent block={block} />;
      default:
        return <div>Unknown block type</div>;
    }
  };

  return (
    <SelectableBlockWrapper blockId={block.id}>
      <TranslatedBlockWrapper block={block}>
        {renderBlockContent()}
      </TranslatedBlockWrapper>
    </SelectableBlockWrapper>
  );
}
