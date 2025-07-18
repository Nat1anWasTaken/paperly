from openai import AzureOpenAI

from src.config import settings


class OpenAIClient:
    def __init__(self):
        """
        Initialize Azure OpenAI client with configuration from settings.
        
        :raises ValueError: If required Azure OpenAI API key is not configured.
        """
        if not settings.openai.api_key:
            raise ValueError("AZURE_OPENAI_API_KEY environment variable is required")

        if not settings.openai.endpoint:
            raise ValueError("AZURE_OPENAI_API_ENDPOINT environment variable is required")

        self.client = AzureOpenAI(
            api_key=settings.openai.api_key,
            api_version="2024-08-01-preview",
            azure_endpoint=settings.openai.endpoint
        )
        self.model = settings.openai.model

    def get_client(self) -> AzureOpenAI:
        """
        Get the Azure OpenAI client instance.

        :return: The Azure OpenAI client instance.
        :rtype: AzureOpenAI
        """
        return self.client


openai_client = OpenAIClient()
client: AzureOpenAI = openai_client.get_client()
model = openai_client.model