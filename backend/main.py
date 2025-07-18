import asyncio

import uvicorn

from src.config import settings
from src.database import get_database_instance
from src.fastapi import app
from src.logging import get_logger, setup_logging
from src.storage.s3 import S3Storage
from src.worker.extract_markdown import MarkdownExtractionWorker
from src.worker.into_blocks import IntoBlocksWorker
from src.worker.metadata_generator import MetadataGeneratorWorker


async def setup_database():
    db_instance = get_database_instance()

    await db_instance.connect()
    await db_instance.initialize_beanie()

    return db_instance


async def setup_storage() -> S3Storage:
    storage = S3Storage()  # S3Storage is a singleton

    return storage

async def start_workers():
    MarkdownExtractionWorker().start()
    MetadataGeneratorWorker().start()
    IntoBlocksWorker().start()


async def main():
    setup_logging()
    logger = get_logger(__name__)

    logger.info("Starting application")

    try:
        await setup_database()
        await setup_storage()
        await start_workers()

        config = uvicorn.Config(app, host=settings.api.host, port=settings.api.port, log_level="info")
        server = uvicorn.Server(config)

        await server.serve()

    except Exception as e:
        logger.error(f"Application error: {e}")
        raise

    finally:
        db_instance = get_database_instance()
        await db_instance.close()
        logger.info("Application shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
