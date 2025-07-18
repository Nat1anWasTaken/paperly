from enum import Enum
from typing import Optional

from beanie import Document, Link
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


class Block(Document):
    kind: BlockKind
    paper: Link[Paper]
    index: int  # Position of the block in the paper, starting from 0

    class Settings:
        collection = "blocks"
        use_state_management = True


class Paragraph(Block):
    title: Optional[str]
    text: str


class Header(Block):
    level: int  # 1 to 6
    text: str


class Figure(Block):
    caption: Optional[str]
    image_url: Optional[str]
    figure_number: Optional[int]


class Table(Block):
    caption: Optional[str]
    title: Optional[str]
    columns: list[str]  # Column headers
    rows: list[list[str]]  # Rows of data


class Equation(Block):
    caption: Optional[str]
    equation: str  # LaTeX or MathML representation


class CodeBlock(Block):
    code: str
    language: Optional[str]  # Programming language of the code block


class Quote(Block):
    text: str
    author: Optional[str]


class Callout(Block):
    text: str


class Reference(Block):
    title: str
    authors: list[str]  # List of author names
    publication_year: Optional[int]
    journal: Optional[str]
    volume: Optional[str]
    issue: Optional[str]
    pages: Optional[str]
    doi: Optional[str]


class Footnote(Block):
    text: str
    reference_number: int  # Footnote number in the document
    paper: Optional[Paper] = None  # Reference to the paper this footnote belongs to

class Question(BaseModel):
    question: str
    options: list[str]
    correct_answer: int  # The index of the correct option in the options list


class Quiz(Block):
    title: str
    questions: list[Question]
