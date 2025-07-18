export enum BlockKind {
  HEADER = "header",
  PARAGRAPH = "paragraph",
  FIGURE = "figure",
  TABLE = "table",
  EQUATION = "equation",
  CODE_BLOCK = "code_block",
  QUOTE = "quote",
  CALLOUT = "callout",
  REFERENCE = "reference",
  FOOTNOTE = "footnote",
  QUIZ = "quiz"
}

// API Response Types - matching OpenAPI schema
export interface PaperReference {
  id: string;
  collection: string;
}

export interface NextBlockReference {
  id: string;
  collection: string;
}

export interface Paper {
  _id?: string; // MongoDB ObjectID
  title: string;
  created_at?: string; // ISO date string
}

// Base Block interface from API
export interface ApiBaseBlock {
  _id?: string; // MongoDB ObjectID
  kind: BlockKind;
  paper: PaperReference;
  next_block?: NextBlockReference | null;
}

export interface ApiParagraphBlock extends ApiBaseBlock {
  kind: BlockKind.PARAGRAPH;
  title?: string;
  text: string;
}

export interface ApiHeaderBlock extends ApiBaseBlock {
  kind: BlockKind.HEADER;
  level: number; // 1 to 6
  text: string;
}

export interface ApiFigureBlock extends ApiBaseBlock {
  kind: BlockKind.FIGURE;
  caption?: string;
  image_url: string;
  figure_number?: number;
}

export interface ApiTableBlock extends ApiBaseBlock {
  kind: BlockKind.TABLE;
  caption?: string;
  title?: string;
  columns: string[]; // Column headers
  rows: string[][]; // Rows of data
}

export interface ApiEquationBlock extends ApiBaseBlock {
  kind: BlockKind.EQUATION;
  caption?: string;
  equation: string; // LaTeX or MathML representation
}

export interface ApiCodeBlockBlock extends ApiBaseBlock {
  kind: BlockKind.CODE_BLOCK;
  code: string;
  language?: string; // Programming language of the code block
}

export interface ApiQuoteBlock extends ApiBaseBlock {
  kind: BlockKind.QUOTE;
  text: string;
  author?: string;
}

export interface ApiCalloutBlock extends ApiBaseBlock {
  kind: BlockKind.CALLOUT;
  text: string;
}

export interface ApiReferenceBlock extends ApiBaseBlock {
  kind: BlockKind.REFERENCE;
  title: string;
  authors: string[]; // List of author names
  publication_year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
}

export interface ApiFootnoteBlock extends ApiBaseBlock {
  kind: BlockKind.FOOTNOTE;
  text: string;
  reference_number: number; // Footnote number in the document
}

export interface ApiQuizBlock extends ApiBaseBlock {
  kind: BlockKind.QUIZ;
  question: string;
  options: string[]; // List of answer options
  correct_answer: number; // Index of the correct answer in the options array
  explanation?: string; // Explanation for the correct answer
}

// Union type for all API block types
export type ApiPaperBlock =
  | ApiParagraphBlock
  | ApiHeaderBlock
  | ApiFigureBlock
  | ApiTableBlock
  | ApiEquationBlock
  | ApiCodeBlockBlock
  | ApiQuoteBlock
  | ApiCalloutBlock
  | ApiReferenceBlock
  | ApiFootnoteBlock
  | ApiQuizBlock;

// API Response type
export interface PaperBlocksResponse {
  blocks: ApiPaperBlock[];
}

// Frontend UI Types - simplified for display (legacy support)
export interface FrontendPaper {
  id: string;
  title: string;
  doi: string;
  created_at: string;
}

export interface BaseBlock {
  id: string;
  kind: BlockKind;
  paper_id: string;
  index: number; // Position of the block in the paper, starting from 0
}

export interface ParagraphBlock extends BaseBlock {
  kind: BlockKind.PARAGRAPH;
  title?: string;
  text: string;
}

export interface HeaderBlock extends BaseBlock {
  kind: BlockKind.HEADER;
  level: number; // 1 to 6
  text: string;
}

export interface FigureBlock extends BaseBlock {
  kind: BlockKind.FIGURE;
  caption?: string;
  image_url?: string;
  figure_number?: number;
}

export interface TableBlock extends BaseBlock {
  kind: BlockKind.TABLE;
  caption?: string;
  title?: string;
  columns: string[]; // Column headers
  rows: string[][]; // Rows of data
}

export interface EquationBlock extends BaseBlock {
  kind: BlockKind.EQUATION;
  caption?: string;
  equation: string; // LaTeX or MathML representation
}

export interface CodeBlockBlock extends BaseBlock {
  kind: BlockKind.CODE_BLOCK;
  code: string;
  language?: string; // Programming language of the code block
}

export interface QuoteBlock extends BaseBlock {
  kind: BlockKind.QUOTE;
  text: string;
  author?: string;
}

export interface CalloutBlock extends BaseBlock {
  kind: BlockKind.CALLOUT;
  text: string;
}

export interface ReferenceBlock extends BaseBlock {
  kind: BlockKind.REFERENCE;
  title: string;
  authors: string[]; // List of author names
  publication_year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
}

export interface FootnoteBlock extends BaseBlock {
  kind: BlockKind.FOOTNOTE;
  text: string;
  reference_number: number; // Footnote number in the document
}

export interface QuizBlock extends BaseBlock {
  kind: BlockKind.QUIZ;
  question: string;
  options: string[]; // List of answer options
  correct_answer: number; // Index of the correct answer in the options array
  explanation?: string; // Explanation for the correct answer
}

// Union type for all frontend block types
export type PaperBlock = ParagraphBlock | HeaderBlock | FigureBlock | TableBlock | EquationBlock | CodeBlockBlock | QuoteBlock | CalloutBlock | ReferenceBlock | FootnoteBlock | QuizBlock;

// Utility function to convert API blocks to frontend blocks
export function convertApiBlockToFrontendBlock(apiBlock: ApiPaperBlock, index: number): PaperBlock {
  const baseBlock = {
    id: apiBlock._id || `block-${index}`,
    kind: apiBlock.kind,
    paper_id: apiBlock.paper.id,
    index
  };

  switch (apiBlock.kind) {
    case BlockKind.PARAGRAPH:
      return { ...baseBlock, ...apiBlock } as ParagraphBlock;
    case BlockKind.HEADER:
      return { ...baseBlock, ...apiBlock } as HeaderBlock;
    case BlockKind.FIGURE:
      return { ...baseBlock, ...apiBlock, image_url: apiBlock.image_url } as FigureBlock;
    case BlockKind.TABLE:
      return { ...baseBlock, ...apiBlock } as TableBlock;
    case BlockKind.EQUATION:
      return { ...baseBlock, ...apiBlock } as EquationBlock;
    case BlockKind.CODE_BLOCK:
      return { ...baseBlock, ...apiBlock } as CodeBlockBlock;
    case BlockKind.QUOTE:
      return { ...baseBlock, ...apiBlock } as QuoteBlock;
    case BlockKind.CALLOUT:
      return { ...baseBlock, ...apiBlock } as CalloutBlock;
    case BlockKind.REFERENCE:
      return { ...baseBlock, ...apiBlock } as ReferenceBlock;
    case BlockKind.FOOTNOTE:
      return { ...baseBlock, ...apiBlock } as FootnoteBlock;
    case BlockKind.QUIZ:
      return { ...baseBlock, ...apiBlock } as QuizBlock;
    default:
      throw new Error(`Unknown block kind: ${(apiBlock as { kind: unknown }).kind}`);
  }
}

// For UI purposes - simplified structure
export interface PaperSection {
  id: string;
  title: string;
  level: number;
  blocks: PaperBlock[];
}

export interface PaperPage {
  pageNumber: number;
  sections: PaperSection[];
}

export interface PaperData {
  paper: FrontendPaper;
  totalPages: number;
  pages: PaperPage[];
}
