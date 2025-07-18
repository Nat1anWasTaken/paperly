from enum import Enum
from typing import Optional

from beanie import Document, Link, UnionDoc
from pydantic import BaseModel

from src.models.paper import Paper


class BlockKind(Enum):
    HEADER = "header"
    PARAGRAPH = "paragraph"
    FIGURE = "figure"
    TABLE = "table"
    EQUATION = "equation"
    CODE_BLOCK = "code_block"
    QUOTE = "quote"
    CALLOUT = "callout"
    REFERENCE = "reference"
    FOOTNOTE = "footnote"
    QUIZ = "quiz"


class Block(UnionDoc):
    """Base union document for all block types."""
    kind: BlockKind
    paper: Link[Paper]
    index: int  # Position of the block in the paper, starting from 0

    class Settings:
        name = "blocks"
        class_id = "_class_id"


class Paragraph(Document):
    """Paragraph block containing text content."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    title: Optional[str]
    text: str

    class Settings:
        union_doc = Block


class Header(Document):
    """Header block with hierarchical level and text."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    level: int  # 1 to 6
    text: str

    class Settings:
        union_doc = Block


class Figure(Document):
    """Figure block containing image and caption."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    caption: Optional[str]
    image_url: Optional[str]
    figure_number: Optional[int]

    class Settings:
        union_doc = Block


class Table(Document):
    """Table block with structured data."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    caption: Optional[str]
    title: Optional[str]
    columns: list[str]  # Column headers
    rows: list[list[str]]  # Rows of data

    class Settings:
        union_doc = Block


class Equation(Document):
    """Equation block with mathematical expressions."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    caption: Optional[str]
    equation: str  # LaTeX or MathML representation

    class Settings:
        union_doc = Block


class CodeBlock(Document):
    """Code block with syntax highlighting."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    code: str
    language: Optional[str]  # Programming language of the code block

    class Settings:
        union_doc = Block


class Quote(Document):
    """Quote block with text and optional author."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    text: str
    author: Optional[str]

    class Settings:
        union_doc = Block


class Callout(Document):
    """Callout block for highlighting important information."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    text: str

    class Settings:
        union_doc = Block


class Reference(Document):
    """Reference block for citations and bibliography."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    title: str
    authors: list[str]  # List of author names
    publication_year: Optional[int]
    journal: Optional[str]
    volume: Optional[str]
    issue: Optional[str]
    pages: Optional[str]
    doi: Optional[str]

    class Settings:
        union_doc = Block


class Footnote(Document):
    """Footnote block with reference number and text."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    text: str
    reference_number: int  # Footnote number in the document

    class Settings:
        union_doc = Block

class Question(BaseModel):
    question: str
    options: list[str]
    correct_answer: int  # The index of the correct option in the options list


class Quiz(Document):
    """Quiz block with multiple choice questions."""
    kind: BlockKind
    paper: Link[Paper]
    index: int
    title: str
    questions: list[Question]

    class Settings:
        union_doc = Block
