import os

from src.logging import get_logger
from src.models.block import (
    Block,
    BlockKind,
    Paragraph,
    Header,
    Table,
    Equation,
    CodeBlock,
    Quote,
    Callout,
    Reference,
    Footnote,
    Quiz,
)
from src.models.translation import Translation, LanguageCode
from src.openai import client, model

logger = get_logger(__name__)

# Block kinds that can be translated (excludes FIGURE)
TRANSLATABLE_BLOCK_KINDS = {
    BlockKind.HEADER,
    BlockKind.PARAGRAPH,
    BlockKind.TABLE,
    BlockKind.EQUATION,
    BlockKind.CODE_BLOCK,
    BlockKind.QUOTE,
    BlockKind.CALLOUT,
    BlockKind.REFERENCE,
    BlockKind.FOOTNOTE,
    BlockKind.QUIZ,
}


def _get_block_content(block: Block) -> str:
    """
    Extract translatable content from a block.

    :param block: The block to extract content from.
    :return: The content to be translated.
    :rtype: str
    :raises ValueError: If the block type is not supported for translation.
    """
    if block.kind == BlockKind.FIGURE:
        raise ValueError("Figure blocks cannot be translated")

    if isinstance(block, Paragraph):
        return (
            f"Title: {block.title}\nText: {block.text}" if block.title else block.text
        )
    elif isinstance(block, Header):
        return block.text
    elif isinstance(block, Table):
        content = ""
        if block.title:
            content += f"Title: {block.title}\n"
        if block.caption:
            content += f"Caption: {block.caption}\n"
        content += f"Columns: {', '.join(block.columns)}\n"
        content += "Rows:\n" + "\n".join([" | ".join(row) for row in block.rows])
        return content
    elif isinstance(block, Equation):
        return (
            f"Caption: {block.caption}\nEquation: {block.equation}"
            if block.caption
            else block.equation
        )
    elif isinstance(block, CodeBlock):
        return block.code
    elif isinstance(block, Quote):
        return (
            f"Text: {block.text}\nAuthor: {block.author}"
            if block.author
            else block.text
        )
    elif isinstance(block, Callout):
        return block.text
    elif isinstance(block, Reference):
        content = f"Title: {block.title}\nAuthors: {', '.join(block.authors)}"
        if block.journal:
            content += f"\nJournal: {block.journal}"
        if block.publication_year:
            content += f"\nYear: {block.publication_year}"
        return content
    elif isinstance(block, Footnote):
        return block.text
    elif isinstance(block, Quiz):
        content = f"Question: {block.question}\nOptions: {', '.join(block.options)}"
        if block.explanation:
            content += f"\nExplanation: {block.explanation}"
        return content
    else:
        raise ValueError(f"Unsupported block type: {type(block)}")


def _get_translation_prompt(
    content: str, target_language: LanguageCode, block_kind: BlockKind
) -> str:
    """
    Generate a translation prompt for the given content and target language.

    :param content: The content to be translated.
    :param target_language: The target language code.
    :param block_kind: The kind of block being translated.
    :return: The translation prompt.
    :rtype: str
    """
    # Get the human-readable language name
    language_name = target_language.full_name

    logger.info(
        f"Generating translation prompt for {block_kind.value} in {language_name}"
    )

    # Read the prompt template
    current_dir = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    prompt_path = os.path.join(current_dir, "prompts", "translate_block.txt")

    try:
        with open(prompt_path, "r") as f:
            prompt_template = f.read()

        return prompt_template.format(content=content, language_name=language_name)
    except FileNotFoundError:
        logger.error(f"Translation prompt template not found: {prompt_path}")
        raise
    except KeyError as e:
        logger.error(f"Template formatting error - missing parameter: {e}")
        raise


async def translate_block(block: Block, target_language: LanguageCode) -> Translation:
    """
    Translate a block's content to the target language.

    :param block: The block to translate.
    :param target_language: The target language code.
    :return: The translation object.
    :rtype: Translation
    :raises ValueError: If the block type is not supported for translation.
    """
    if block.kind not in TRANSLATABLE_BLOCK_KINDS:
        raise ValueError(f"Block kind {block.kind} is not supported for translation")

    # Check if translation already exists
    existing_translation = await Translation.find_one(
        Translation.block.id == block.id, Translation.language == target_language
    )

    if existing_translation:
        return existing_translation

    # Extract content and generate translation
    content = _get_block_content(block)
    prompt = _get_translation_prompt(content, target_language, block.kind)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000,
        )

        translated_content = response.choices[0].message.content.strip()

        # Create and save translation
        translation = Translation(
            block=block, content=translated_content, language=target_language
        )

        await translation.save()
        logger.info(
            f"Created translation for block {block.id} to {target_language.value}"
        )

        return translation

    except Exception as e:
        logger.error(f"Failed to translate block {block.id}: {str(e)}")
        raise
