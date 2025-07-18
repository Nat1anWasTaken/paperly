import re
from typing import List, TypedDict, Union, Optional


class HeaderBlock(TypedDict):
    type: str
    level: int
    text: str


class CodeBlock(TypedDict):
    type: str
    code: str
    language: Optional[str]


class TableBlock(TypedDict):
    type: str
    caption: Optional[str]
    title: Optional[str]
    columns: List[str]
    rows: List[List[str]]


class FigureBlock(TypedDict):
    type: str
    caption: Optional[str]
    figure_number: Optional[int]
    image_url: str


class QuoteBlock(TypedDict):
    type: str
    text: str
    author: Optional[str]


class EquationBlock(TypedDict):
    type: str
    caption: Optional[str]
    equation: str


class ParagraphBlock(TypedDict):
    type: str
    title: Optional[str]
    text: str


class CalloutBlock(TypedDict):
    type: str
    text: str


class ReferenceBlock(TypedDict):
    type: str
    title: str
    authors: List[str]
    publication_year: Optional[int]
    journal: Optional[str]
    volume: Optional[str]
    issue: Optional[str]
    pages: Optional[str]
    doi: Optional[str]


class FootnoteBlock(TypedDict):
    type: str
    text: str
    reference_number: int


class QuizBlock(TypedDict):
    type: str
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str]


MarkdownBlock = Union[HeaderBlock, CodeBlock, TableBlock, FigureBlock, QuoteBlock, EquationBlock, ParagraphBlock, CalloutBlock, ReferenceBlock, FootnoteBlock, QuizBlock]


def parse_markdown_to_blocks(markdown_content: str) -> List[MarkdownBlock]:
    """
    Parse markdown content into structured blocks.

    :param markdown_content: The markdown content to parse.
    :return: List of block dictionaries with type and content information.
    :rtype: List[MarkdownBlock]
    """
    if not markdown_content:
        return []

    blocks = []
    lines = markdown_content.split('\n')
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # Skip empty lines
        if not line:
            i += 1
            continue

        # Header detection
        header_match = re.match(r'^(#{1,6})\s+(.+)$', line)
        if header_match:
            level = len(header_match.group(1))
            text = header_match.group(2).strip()
            blocks.append({
                'type': 'header',
                'level': level,
                'text': text
            })
            i += 1
            continue

        # Code block detection
        if line.startswith('```'):
            language = line[3:].strip() if len(line) > 3 else None
            code_lines = []
            i += 1

            while i < len(lines) and not lines[i].strip().startswith('```'):
                code_lines.append(lines[i])
                i += 1

            blocks.append({
                'type': 'code_block',
                'code': '\n'.join(code_lines),
                'language': language
            })
            i += 1
            continue

        # Table detection
        if '|' in line and i + 1 < len(lines) and '|' in lines[i + 1]:
            table_lines = [line]
            i += 1

            # Skip separator line
            if re.match(r'^\s*\|[\s\-\|]*\|\s*$', lines[i]):
                i += 1

            # Collect table rows
            while i < len(lines) and '|' in lines[i].strip():
                table_lines.append(lines[i].strip())
                i += 1

            if len(table_lines) >= 2:
                headers = [cell.strip() for cell in table_lines[0].split('|')[1:-1]]
                rows = []
                for row_line in table_lines[1:]:
                    row = [cell.strip() for cell in row_line.split('|')[1:-1]]
                    if row:
                        rows.append(row)

                blocks.append({
                    'type': 'table',
                    'columns': headers,
                    'rows': rows
                })
            continue

        # Figure detection (markdown image)
        image_match = re.match(r'!\[(.*?)\]\((.*?)\)', line)
        if image_match:
            caption = image_match.group(1)
            image_url = image_match.group(2)
            blocks.append({
                'type': 'figure',
                'caption': caption if caption else None,
                'image_url': image_url
            })
            i += 1
            continue

        # Quote detection
        if line.startswith('>'):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith('>'):
                quote_lines.append(lines[i].strip()[1:].strip())
                i += 1

            blocks.append({
                'type': 'quote',
                'text': '\n'.join(quote_lines)
            })
            continue

        # Equation detection (LaTeX style)
        if line.startswith('$$') or line.startswith('\\['):
            equation_lines = [line]
            i += 1

            while i < len(lines):
                equation_lines.append(lines[i])
                if lines[i].strip().endswith('$$') or lines[i].strip().endswith('\\]'):
                    break
                i += 1

            blocks.append({
                'type': 'equation',
                'equation': '\n'.join(equation_lines)
            })
            i += 1
            continue

        # Default to paragraph
        paragraph_lines = [line]
        i += 1

        # Collect consecutive non-special lines
        while i < len(lines):
            next_line = lines[i].strip()
            if (not next_line or
                    next_line.startswith('#') or
                    next_line.startswith('```') or
                    next_line.startswith('>') or
                    next_line.startswith('$$') or
                    next_line.startswith('\\[') or
                    '|' in next_line or
                    re.match(r'!\[(.*?)\]\((.*?)\)', next_line)):
                break
            paragraph_lines.append(next_line)
            i += 1

        text = '\n'.join(paragraph_lines).strip()
        if text:
            blocks.append({
                'type': 'paragraph',
                'text': text
            })

    return blocks
