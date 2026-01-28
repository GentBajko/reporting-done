from backend.protocols.session import ISession
from database.adapters.postgresql import PostgreSQL
from database.sessions.sqlalchemy_session import SQLAlchemySession


async def get_session() -> ISession:
    wrapped_session = SQLAlchemySession(PostgreSQL.session())
    return wrapped_session


def get_session_sync() -> ISession:
    return SQLAlchemySession(PostgreSQL.session())


def get_session_factory():
    return get_session_sync
