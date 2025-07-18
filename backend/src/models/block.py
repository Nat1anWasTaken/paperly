from enum import Enum
from typing import Optional

from beanie import Document, Link

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


class Block(Document):
    kind: BlockKind
    paper: Link[Paper]
    next_block: Optional[Link["Block"]] = None

    class Settings:
        name = "blocks"


class Paragraph(Block):
    title: Optional[str] = None
    text: str


class Header(Block):
    level: int  # 1 to 6
    text: str


class Figure(Block):
    caption: Optional[str] = None
    figure_number: Optional[int] = None
    image_url: str


class Table(Block):
    caption: Optional[str] = None
    title: Optional[str] = None
    columns: list[str]  # Column headers
    rows: list[list[str]]  # Rows of data


class Equation(Block):
    caption: Optional[str] = None
    equation: str  # LaTeX or MathML representation


class CodeBlock(Block):
    code: str
    language: Optional[str] = None  # Programming language of the code block


class Quote(Block):
    text: str
    author: Optional[str] = None


class Callout(Block):
    text: str


class Reference(Block):
    title: str
    authors: list[str]  # List of author names
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    volume: Optional[str] = None
    issue: Optional[str] = None
    pages: Optional[str] = None
    doi: Optional[str] = None


class Footnote(Block):
    text: str
    reference_number: int  # Footnote number in the document
    paper: Optional[Paper] = None  # Reference to the paper this footnote belongs to


class Quiz(Block):
    question: str
    options: list[str]  # List of answer options
    correct_answer: str  # The correct answer from the options
    explanation: Optional[str] = None  # Explanation for the correct answer
