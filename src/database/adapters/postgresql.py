from loguru import logger
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config.env import ENV


class PostgreSQL:
    """PostgreSQL database adapter using psycopg driver."""

    logger.info(
        f"Connecting to PostgreSQL database {ENV.DB_NAME} at {ENV.DB_HOST}:{ENV.DB_PORT} as {ENV.DB_USER}"
    )

    engine = create_engine(
        ENV.database_url,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
        pool_pre_ping=True,
        echo=False,
        future=True,
    )

    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    @classmethod
    def session(cls):
        return cls.Session()
