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
  QUIZ = "quiz",
}

export interface Paper {
  id: string;
  title: string;
  doi: string;
  created_at: string;
}

// Base Block interface
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
  correct_answer: string; // The correct answer from the options
  explanation?: string; // Explanation for the correct answer
}

// Union type for all block types
export type PaperBlock = 
  | ParagraphBlock 
  | HeaderBlock 
  | FigureBlock 
  | TableBlock 
  | EquationBlock 
  | CodeBlockBlock 
  | QuoteBlock 
  | CalloutBlock 
  | ReferenceBlock 
  | FootnoteBlock 
  | QuizBlock;

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
  paper: Paper;
  totalPages: number;
  pages: PaperPage[];
} 