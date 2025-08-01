import os
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel


class DatabaseConfig(BaseModel):
    url: str
    name: str


class S3Config(BaseModel):
    bucket_name: str
    region: str = "us-east-1"
    endpoint_url: Optional[str] = None
    access_key_id: Optional[str] = None
    secret_access_key: Optional[str] = None


class OpenAIConfig(BaseModel):
    endpoint: Optional[str] = None
    api_key: str
    model: str = "gpt-4o"


class APIConfig(BaseModel):
    host: str
    port: int


class Settings(BaseModel):
    database: DatabaseConfig
    s3: S3Config
    api: APIConfig
    openai: OpenAIConfig

    @classmethod
    def from_env(cls) -> "Settings":
        """
        Load settings from environment variables.
        Note: This method loads .env file if it exists.
        :return: Settings instance with loaded configurations.
        """
        load_dotenv()

        return cls(
            database=DatabaseConfig(
                url=os.getenv("MONGODB_URL", "mongodb://localhost:27017"),
                name=os.getenv("DATABASE_NAME", "paperly"),
            ),
            s3=S3Config(
                bucket_name=os.getenv("AWS_S3_BUCKET_NAME", "paperly"),
                region=os.getenv("AWS_REGION", "us-east-1"),
                endpoint_url=os.getenv("AWS_S3_ENDPOINT_URL"),
                access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            ),
            openai=OpenAIConfig(
                endpoint=os.getenv("AZURE_OPENAI_API_ENDPOINT"),
                api_key=os.getenv("AZURE_OPENAI_API_KEY"),
                model=os.getenv("AZURE_OPENAI_MODEL", "gpt-4o"),
            ),
            api=APIConfig(
                host=os.getenv("API_HOST", "0.0.0.0"),
                port=int(os.getenv("API_PORT", 8000)),
            ),
        )


settings = Settings.from_env()
