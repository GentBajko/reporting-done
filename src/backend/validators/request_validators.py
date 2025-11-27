import re
from datetime import datetime

from backend.types.result import Result, Ok, Err

EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
ULID_PATTERN = re.compile(r"^[0-9A-HJKMNP-TV-Z]{26}$")
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")

VALID_TASK_STATUSES = frozenset([
    "Planning",
    "Research",
    "Implementation",
    "Done",
    "Cancelled",
    "On Hold",
    "Testing",
    "Review",
])

VALID_AVAILABILITY_STATUSES = frozenset(["Office", "Remote", "Off"])


def validate_email(email: str) -> Result[str, str]:
    if not email:
        return Err("Email is required")
    
    email = email.strip().lower()
    
    if len(email) > 255:
        return Err("Email must be at most 255 characters")
    
    if not EMAIL_PATTERN.match(email):
        return Err("Invalid email format")
    
    return Ok(email)


def validate_password(password: str) -> Result[str, str]:
    if not password:
        return Err("Password is required")
    
    if len(password) < 8:
        return Err("Password must be at least 8 characters")
    
    if len(password) > 128:
        return Err("Password must be at most 128 characters")
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    if not (has_upper and has_lower and has_digit):
        return Err("Password must contain uppercase, lowercase, and digit")
    
    return Ok(password)


def validate_ulid(ulid_str: str) -> Result[str, str]:
    if not ulid_str:
        return Err("ID is required")
    
    ulid_str = ulid_str.strip().upper()
    
    if not ULID_PATTERN.match(ulid_str):
        return Err("Invalid ID format")
    
    return Ok(ulid_str)


def validate_date_string(date_str: str) -> Result[datetime, str]:
    if not date_str:
        return Err("Date is required")
    
    date_str = date_str.strip()
    
    if not DATE_PATTERN.match(date_str):
        return Err("Invalid date format. Use YYYY-MM-DD")
    
    try:
        parsed = datetime.strptime(date_str, "%Y-%m-%d")
        return Ok(parsed)
    except ValueError:
        return Err("Invalid date value")


def validate_positive_float(
    value: float,
    field_name: str = "Value",
    max_value: float | None = None,
) -> Result[float, str]:
    if value <= 0:
        return Err(f"{field_name} must be positive")
    
    if max_value and value > max_value:
        return Err(f"{field_name} must be at most {max_value}")
    
    return Ok(value)


def validate_status(
    status: str,
    valid_statuses: frozenset[str],
    field_name: str = "Status",
) -> Result[str, str]:
    if not status:
        return Err(f"{field_name} is required")
    
    status = status.strip()
    
    normalized = status.title()
    
    if normalized not in valid_statuses:
        valid_list = ", ".join(sorted(valid_statuses))
        return Err(f"Invalid {field_name.lower()}. Must be one of: {valid_list}")
    
    return Ok(normalized)


def sanitize_string(
    value: str,
    max_length: int = 10000,
    allow_html: bool = False,
) -> str:
    if not value:
        return ""
    
    value = value.strip()
    
    if not allow_html:
        value = re.sub(r"<[^>]*>", "", value)
    
    value = value[:max_length]
    
    return value

