#!/usr/bin/env python
"""
Migrate data from MySQL to PostgreSQL.

Usage: python scripts/migrate_mysql_to_postgres.py

Requires environment variables:
- MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB, MYSQL_PORT
- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT (PostgreSQL)
"""
import os
from datetime import datetime, timezone

import pymysql
import psycopg

# MySQL connection
mysql_conn = pymysql.connect(
    host=os.environ["MYSQL_HOST"],
    user=os.environ["MYSQL_USER"],
    password=os.environ["MYSQL_PASSWORD"],
    database=os.environ["MYSQL_DB"],
    port=int(os.environ.get("MYSQL_PORT", 3306)),
    cursorclass=pymysql.cursors.DictCursor,
)

# PostgreSQL connection
pg_conn = psycopg.connect(
    host=os.environ["DB_HOST"],
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASSWORD"],
    dbname=os.environ["DB_NAME"],
    port=int(os.environ.get("DB_PORT", 5432)),
)


def epoch_to_datetime(epoch: int | None) -> datetime | None:
    """Convert Unix epoch to datetime with UTC timezone."""
    if epoch is None:
        return None
    return datetime.fromtimestamp(epoch, tz=timezone.utc)


def migrate_tasks() -> None:
    """Migrate tasks table."""
    print("Migrating tasks...")
    with mysql_conn.cursor() as mysql_cur:
        mysql_cur.execute("SELECT * FROM task")
        rows = mysql_cur.fetchall()

    with pg_conn.cursor() as pg_cur:
        for row in rows:
            created_at = epoch_to_datetime(row["timestamp"])
            pg_cur.execute(
                """
                INSERT INTO tasks (id, project_id, project_name, user_id, user_name,
                                   title, hours_required, description, status,
                                   created_at, hours_worked, returned)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """,
                (
                    row["id"],
                    row["project_id"],
                    row["project_name"],
                    row["user_id"],
                    row["user_name"],
                    row["title"],
                    row["hours_required"],
                    row["description"],
                    row["status"],
                    created_at,
                    row["hours_worked"],
                    row["returned"],
                ),
            )
    pg_conn.commit()
    print(f"Migrated {len(rows)} tasks")


def migrate_task_logs() -> None:
    """Migrate task_logs table."""
    print("Migrating task logs...")
    with mysql_conn.cursor() as mysql_cur:
        mysql_cur.execute("SELECT * FROM task_log")
        rows = mysql_cur.fetchall()

    with pg_conn.cursor() as pg_cur:
        for row in rows:
            created_at = epoch_to_datetime(row["timestamp"])
            hours_spent = row.get("hours_spent_today", 0.0)
            pg_cur.execute(
                """
                INSERT INTO task_logs (id, created_at, task_id, task_name,
                                      description, user_id, user_name,
                                      project_id, project_name, hours_spent, task_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """,
                (
                    row["id"],
                    created_at,
                    row["task_id"],
                    row["task_name"],
                    row["description"],
                    row["user_id"],
                    row["user_name"],
                    row.get("project_id"),
                    row.get("project_name"),
                    hours_spent,
                    row.get("task_status"),
                ),
            )
    pg_conn.commit()
    print(f"Migrated {len(rows)} task logs")


def migrate_events() -> None:
    """Migrate events table."""
    print("Migrating events...")
    with mysql_conn.cursor() as mysql_cur:
        mysql_cur.execute("SELECT * FROM event")
        rows = mysql_cur.fetchall()

    with pg_conn.cursor() as pg_cur:
        for row in rows:
            event_date = (
                epoch_to_datetime(row["event_date"]).date()
                if row["event_date"]
                else None
            )
            created_at = epoch_to_datetime(row["created_at"])
            # Parse time strings to time objects
            start_time = (
                datetime.strptime(row["start_time"], "%H:%M").time()
                if row.get("start_time")
                else None
            )
            end_time = (
                datetime.strptime(row["end_time"], "%H:%M").time()
                if row.get("end_time")
                else None
            )

            pg_cur.execute(
                """
                INSERT INTO events (id, user_id, title, description, event_type,
                                   event_date, start_time, end_time, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """,
                (
                    row["id"],
                    row["user_id"],
                    row["title"],
                    row.get("description"),
                    row.get("event_type"),
                    event_date,
                    start_time,
                    end_time,
                    created_at,
                ),
            )
    pg_conn.commit()
    print(f"Migrated {len(rows)} events")


def migrate_office_availability() -> None:
    """Migrate office_availability table."""
    print("Migrating office availability...")
    with mysql_conn.cursor() as mysql_cur:
        mysql_cur.execute("SELECT * FROM office_availability")
        rows = mysql_cur.fetchall()

    with pg_conn.cursor() as pg_cur:
        for row in rows:
            pg_cur.execute(
                """
                INSERT INTO office_availability (id, user_id, day, present)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """,
                (row["id"], row["user_id"], row["day"], row["present"]),
            )
    pg_conn.commit()
    print(f"Migrated {len(rows)} office availability records")


def main() -> None:
    print("Starting MySQL to PostgreSQL migration...")
    print(f"MySQL: {os.environ['MYSQL_HOST']}/{os.environ['MYSQL_DB']}")
    print(f"PostgreSQL: {os.environ['DB_HOST']}/{os.environ['DB_NAME']}")

    migrate_tasks()
    migrate_task_logs()
    migrate_events()
    migrate_office_availability()

    mysql_conn.close()
    pg_conn.close()
    print("Migration complete!")


if __name__ == "__main__":
    main()
