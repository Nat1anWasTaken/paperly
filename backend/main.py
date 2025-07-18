import asyncio
from src.database import connect_to_mongo, close_mongo_connection, get_database
from src.logging import setup_logging, get_logger


async def main():
    setup_logging()
    logger = get_logger(__name__)

    logger.info("Starting application")

    try:
        await connect_to_mongo()

        # Example usage
        db = get_database()
        logger.info(f"Database connected: {db.name}")

        # Add your application logic here

    except Exception as e:
        logger.error(f"Application error: {e}")
        raise
    finally:
        await close_mongo_connection()
        logger.info("Application shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
