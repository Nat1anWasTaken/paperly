from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.logging import get_logger
from src.models.translation import Translation, LanguageCode
from src.utils.object_id import validate_object_id_or_raise_http_exception
from src.utils.translation import translate_block
from src.utils.blocks import get_typed_block

logger = get_logger(__name__)

router = APIRouter(prefix="/translations")


class TranslationResponse(BaseModel):
    """
    Response model for block translation.

    :param id: Translation ID.
    :param block_id: ID of the translated block.
    :param content: Translated content.
    :param language: Language code of the translation.
    """

    id: str
    block_id: str
    content: str
    language: LanguageCode

    @classmethod
    def from_translation(cls, translation: Translation) -> "TranslationResponse":
        """
        Create a response model from a Translation document.

        :param translation: The translation document.
        :return: The response model.
        :rtype: TranslationResponse
        """
        return cls(
            id=str(translation.id),
            block_id=str(translation.block.ref.id),
            content=translation.content,
            language=translation.language,
        )


@router.get("/blocks/{block_id}", response_model=List[TranslationResponse])
async def get_block_translations(block_id: str):
    """
    Get all translations for a specific block.

    :param block_id: ID of the block to get translations for.
    :return: List of translations for the block.
    :rtype: List[TranslationResponse]
    :raises HTTPException: If block is not found.
    """
    object_id = validate_object_id_or_raise_http_exception(block_id)

    # Get the typed block with full information
    block = await get_typed_block(object_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    # Get all translations for the block
    translations = await Translation.find(Translation.block.id == block.id).to_list()

    return [TranslationResponse.from_translation(t) for t in translations]


@router.get(
    "/blocks/{block_id}/language/{language}", response_model=TranslationResponse
)
async def get_block_translation(block_id: str, language: LanguageCode):
    """
    Get a specific translation for a block in the given language.
    If the translation doesn't exist, it will be created automatically.

    :param block_id: ID of the block to get translation for.
    :param language: Language code of the desired translation.
    :return: The translation for the block in the specified language.
    :rtype: TranslationResponse
    :raises HTTPException: If block is not found or translation fails.
    """
    object_id = validate_object_id_or_raise_http_exception(block_id)

    # Get the typed block with full information
    block = await get_typed_block(object_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    # Find the specific translation
    translation = await Translation.find_one(
        Translation.block.id == block.id, Translation.language == language
    )

    # If translation doesn't exist, create it
    if not translation:
        try:
            translation = await translate_block(block, language)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Translation failed for block {block_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Translation failed")

    return TranslationResponse.from_translation(translation)


@router.delete("/blocks/{block_id}/language/{language}")
async def delete_block_translation(block_id: str, language: LanguageCode):
    """
    Delete a specific translation for a block in the given language.

    :param block_id: ID of the block to delete translation for.
    :param language: Language code of the translation to delete.
    :return: Success message.
    :rtype: dict
    :raises HTTPException: If block or translation is not found.
    """
    object_id = validate_object_id_or_raise_http_exception(block_id)

    # Get the typed block with full information
    block = await get_typed_block(object_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    # Find and delete the translation
    translation = await Translation.find_one(
        Translation.block.id == block.id, Translation.language == language
    )

    if not translation:
        raise HTTPException(
            status_code=404,
            detail=f"Translation not found for block {block_id} in language {language.value}",
        )

    await translation.delete()
    logger.info(
        f"Deleted translation for block {block_id} in language {language.value}"
    )

    return {"message": "Translation deleted successfully"}
