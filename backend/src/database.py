from typing import Optional

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.config import settings
from src.logging import get_logger
from src.models.analysis import Analysis
from src.models.block import Block, Paragraph, Header, Figure, Table, Equation, CodeBlock, Quote, Callout, Reference, \
    Footnote, Quiz
from src.models.paper import Paper

logger = get_logger(__name__)


class Database:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self.client: Optional[AsyncIOMotorClient] = None
            self.database: Optional[AsyncIOMotorDatabase] = None
            self._initialized = True

    async def connect(self):
        try:
            mongodb_url = settings.database.url
            database_name = settings.database.name

            logger.info(f"Connecting to MongoDB at {mongodb_url}")
            self.client = AsyncIOMotorClient(mongodb_url)
            self.database = self.client.get_database(database_name)

            await self.client.admin.command("ping")
            logger.info(
                f"Successfully connected to MongoDB database: {self.database.name}"
            )

        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
        else:
            logger.warning("No MongoDB connection to close")

    async def initialize_beanie(self):
        if self.database is None:
            raise RuntimeError("Database connection is not established.")

        document_models = [
            Analysis,
            Paper,
            Block,
            Paragraph,
            Header,
            Figure,
            Table,
            Equation,
            CodeBlock,
            Quote,
            Callout,
            Reference,
            Footnote,
            Quiz
        ]

        await init_beanie(database=self.database, document_models=document_models)


def get_database_instance():
    return Database()


def get_database():
    return get_database_instance().database
