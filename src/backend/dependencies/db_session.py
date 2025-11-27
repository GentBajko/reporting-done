from database.adapters.mysql import MySQL
from backend.protocols.session import ISession
from database.sessions.sqlalchemy_session import SQLAlchemySession


async def get_session() -> ISession:
    wrapped_session = SQLAlchemySession(MySQL.session())
    return wrapped_session


def get_session_sync() -> ISession:
    return SQLAlchemySession(MySQL.session())


def get_session_factory():
    return get_session_sync
