import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
from .logging import get_logger

load_dotenv()

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
            self.client: AsyncIOMotorClient | None = None
            self.database: AsyncIOMotorDatabase | None = None
            self._initialized = True


def get_database_instance():
    return Database()


async def connect_to_mongo():
    try:
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        database_name = os.getenv("DATABASE_NAME", "paperly")

        db_instance = get_database_instance()

        logger.info(f"Connecting to MongoDB at {mongodb_url}")
        db_instance.client = AsyncIOMotorClient(mongodb_url)
        db_instance.database = db_instance.client.get_database(database_name)

        await db_instance.client.admin.command("ping")
        logger.info(
            f"Successfully connected to MongoDB database: {db_instance.database.name}"
        )

    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    db_instance = get_database_instance()
    if db_instance.client:
        db_instance.client.close()
        logger.info("Disconnected from MongoDB")
    else:
        logger.warning("No MongoDB connection to close")


def get_database():
    return get_database_instance().database
