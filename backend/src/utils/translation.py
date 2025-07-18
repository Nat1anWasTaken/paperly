from typing import Dict, Any

from src.models.block import Block, BlockKind, Paragraph, Header, Table, Equation, CodeBlock, Quote, Callout, Reference, Footnote, Quiz
from src.models.translation import Translation, LanguageCode
from src.openai import client, model
from src.logging import get_logger

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


class TranslationService:
    """Service for translating block content using OpenAI GPT-4o."""

    def __init__(self):
        """Initialize the translation service."""
        self.client = client
        self.model = model

    def _get_block_content(self, block: Block) -> str:
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
            return f"Title: {block.title}\nText: {block.text}" if block.title else block.text
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
            return f"Caption: {block.caption}\nEquation: {block.equation}" if block.caption else block.equation
        elif isinstance(block, CodeBlock):
            return block.code
        elif isinstance(block, Quote):
            return f"Text: {block.text}\nAuthor: {block.author}" if block.author else block.text
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

    def _get_translation_prompt(self, content: str, target_language: LanguageCode, block_kind: BlockKind) -> str:
        """
        Generate a translation prompt for the given content and target language.
        
        :param content: The content to be translated.
        :param target_language: The target language code.
        :param block_kind: The kind of block being translated.
        :return: The translation prompt.
        :rtype: str
        """
        language_name = target_language.name.replace('_', ' ').title()
        
        if block_kind == BlockKind.CODE_BLOCK:
            return f"""Translate any comments in this code block to {language_name}. Keep the code itself unchanged:

{content}

Return only the translated code block with comments in {language_name}."""
        
        elif block_kind == BlockKind.EQUATION:
            return f"""Translate any captions or text in this equation to {language_name}. Keep the mathematical notation unchanged:

{content}

Return only the translated content with mathematical notation preserved."""
        
        elif block_kind == BlockKind.TABLE:
            return f"""Translate this table content to {language_name}. Preserve the table structure:

{content}

Return only the translated table content maintaining the original format."""
        
        else:
            return f"""Translate the following text to {language_name}. Maintain the original formatting and structure:

{content}

Return only the translated text."""

    async def translate_block(self, block: Block, target_language: LanguageCode) -> Translation:
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
            Translation.block.id == block.id,
            Translation.language == target_language
        )
        
        if existing_translation:
            return existing_translation
        
        # Extract content and generate translation
        content = self._get_block_content(block)
        prompt = self._get_translation_prompt(content, target_language, block.kind)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional translator. Translate the given text accurately while preserving formatting and structure."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            translated_content = response.choices[0].message.content.strip()
            
            # Create and save translation
            translation = Translation(
                block=block,
                content=translated_content,
                language=target_language
            )
            
            await translation.save()
            logger.info(f"Created translation for block {block.id} to {target_language.value}")
            
            return translation
            
        except Exception as e:
            logger.error(f"Failed to translate block {block.id}: {str(e)}")
            raise


translation_service = TranslationService()