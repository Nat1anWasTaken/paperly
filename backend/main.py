import asyncio

from src.database import get_database_instance
from src.logging import get_logger, setup_logging


async def main():
    setup_logging()
    logger = get_logger(__name__)

    logger.info("Starting application")

    try:
        db_instance = get_database_instance()
        await db_instance.connect()

    except Exception as e:
        logger.error(f"Application error: {e}")
        raise

    finally:
        db_instance = get_database_instance()
        await db_instance.close()
        logger.info("Application shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
