from enum import Enum

from beanie import Document, Link

from src.models.block import Block


class LanguageCode(Enum):
    """Language codes, using BCP 47 format."""
    EN = "en"  # English
    ES = "es"  # Spanish
    FR = "fr"  # French
    DE = "de"  # German
    JA = "ja"  # Japanese
    KO = "ko"  # Korean
    PT = "pt"  # Portuguese
    RU = "ru"  # Russian
    AR = "ar"  # Arabic
    HI = "hi"  # Hindi
    ZH_CN = "zh-CN"  # Chinese (Simplified)
    ZH_TW = "zh-TW"  # Chinese (Traditional)

    @property
    def full_name(self) -> str:
        """Get the full language name."""
        language_names = {
            LanguageCode.EN: "English",
            LanguageCode.ES: "Spanish", 
            LanguageCode.FR: "French",
            LanguageCode.DE: "German",
            LanguageCode.JA: "Japanese",
            LanguageCode.KO: "Korean",
            LanguageCode.PT: "Portuguese",
            LanguageCode.RU: "Russian",
            LanguageCode.AR: "Arabic",
            LanguageCode.HI: "Hindi",
            LanguageCode.ZH_CN: "Chinese (Simplified)",
            LanguageCode.ZH_TW: "Chinese (Traditional)",
        }
        return language_names[self]


class Translation(Document):
    """
    A translation of a Block's content.
    
    This model stores translated content for blocks, allowing the same block
    to be available in multiple languages.
    """

    block: Link[Block]
    content: str
    language: LanguageCode

    class Settings:
        name = "translations"
