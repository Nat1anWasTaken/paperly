from typing import List
from fastapi import APIRouter
from pydantic import BaseModel

from src.models.translation import LanguageCode

router = APIRouter()


class LanguageInfo(BaseModel):
    """
    Language information model.

    :param code: Language code (BCP 47 format).
    :param name: Full language name.
    """

    code: str
    name: str


@router.get("/languages", response_model=List[LanguageInfo])
async def get_supported_languages():
    """
    Get all supported language codes for translation.

    :return: List of supported language codes with their full names.
    :rtype: List[LanguageInfo]
    """
    languages = [
        LanguageInfo(code=lang_code.value, name=lang_code.full_name)
        for lang_code in LanguageCode
    ]

    return languages
