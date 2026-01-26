from typing import TYPE_CHECKING, List, Optional
from datetime import datetime, timezone

from ulid import ULID

from core.enums import Roles, UserStatus, Permissions, SubscriptionTier

if TYPE_CHECKING:
    from core.models.task import Task
    from core.models.project import Project


class User:
    """
    Comprehensive user management with integrated permission systems
    and resource tracking.
    Features:
    - Role-based access control
    - Resource quota management
    - Security and authentication tracking
    - Organization membership management
    """

    if TYPE_CHECKING:
        id: str
        email: str
        password: str
        name: str
        last_name: str
        phone: Optional[str]
        organization_id: Optional[str]
        role_type: int
        permissions: int
        month_usage: Optional[int]
        is_verified: bool
        status: Optional[int]
        subscription: str
        limit: int
        last_login: Optional[datetime]
        failed_login_attempts: int
        created_at: Optional[datetime]
        updated_at: Optional[datetime]
        monthly_at: Optional[datetime]
        projects: List["Project"]
        tasks: List["Task"]
        password_reset_required: bool

    def __init__(
        self,
        email: str,
        password: str,
        name: str,
        last_name: str,
        subscription: str,
        role_type: int,
        limit: int,
        stripe_customer_id: Optional[str] = None,
        stripe_subscription_id: Optional[str] = None,
        subscription_status: Optional[str] = None,
        trial_end_date: Optional[datetime] = None,
        default_payment_method_id: Optional[str] = None,
        subscription_start_date: Optional[datetime] = None,
        subscription_cancel_date: Optional[datetime] = None,
        stripe_price_id: Optional[str] = None,
        stripe_subscription_item_id: Optional[str] = None,
        id: Optional[str] = None,
        is_verified: bool = False,
        organization_id: Optional[str] = None,
        phone: Optional[str] = None,
        status: Optional[int] = None,
        permissions: Optional[int] = None,
        month_usage: Optional[int] = None,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
        last_login: Optional[datetime] = None,
        failed_login_attempts: int = 0,
        monthly_at: Optional[datetime] = None,
        projects: Optional[List["Project"]] = None,
        tasks: Optional[List["Task"]] = None,
        password_reset_required: bool = False,
    ):
        # Core identifiers
        self.id = str(id) if id is not None else str(ULID())
        self.email = email.lower()
        self.password = password

        # Store primitive values directly
        self.role_type = role_type
        self.subscription = subscription
        self.status = status or UserStatus.ACTIVE.value
        self.permissions = (
            permissions or Roles(self.role_type).permissions.value
        )

        # Profile information
        self.name = name
        self.last_name = last_name
        self.phone = phone

        # Organization relationships
        self.organization_id = (
            str(organization_id) if organization_id else None
        )

        # Resource management
        self.month_usage = month_usage
        self.limit = limit

        # Account status
        self.is_verified = is_verified
        self.password_reset_required = password_reset_required

        # Security tracking
        self.last_login = last_login
        self.failed_login_attempts = failed_login_attempts

        # Stripe integration
        self.stripe_customer_id = stripe_customer_id
        self.stripe_subscription_id = stripe_subscription_id
        self.subscription_status = subscription_status
        self.trial_end_date = trial_end_date
        self.default_payment_method_id = default_payment_method_id
        self.subscription_start_date = subscription_start_date
        self.subscription_cancel_date = subscription_cancel_date
        self.stripe_price_id = stripe_price_id
        self.stripe_subscription_item_id = stripe_subscription_item_id

        # Timestamps
        self.created_at = created_at or datetime.now(timezone.utc)
        self.updated_at = updated_at or self.created_at
        self.monthly_at = monthly_at or datetime.now(timezone.utc)

        # Relationships
        self.projects = projects or []
        self.tasks = tasks or []

    @property
    def _id(self) -> ULID:
        return ULID.from_str(self.id) if isinstance(self.id, str) else self.id

    @property
    def role(self) -> Roles:
        return Roles(self.role_type)

    @property
    def subscription_tier(self) -> SubscriptionTier:
        return SubscriptionTier(self.subscription)

    @property
    def status_enum(self) -> UserStatus:
        return UserStatus(self.status)

    @property
    def _permissions(self) -> Permissions:
        return Permissions(self.permissions)

    @property
    def full_name(self) -> str:
        return f"{self.name} {self.last_name}"

    def to_dict(self, visited=None):
        if visited is None:
            visited = set()

        if id(self) in visited:
            return {
                "id": self.id,
                "email": self.email,
                "name": self.name,
                "last_name": self.last_name,
                "permissions": self.permissions,
            }

        visited.add(id(self))

        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "last_name": self.last_name,
            "phone": self.phone,
            "organizationId": self.organization_id,
            "role_type": self.role_type,
            "permissions": self.permissions,
            "subscription": self.subscription,
            "limit": self.limit,
            "stripe_customer_id": self.stripe_customer_id,
            "stripe_subscription_id": self.stripe_subscription_id,
            "subscription_status": self.subscription_status,
            "trial_end_date": self.trial_end_date.isoformat()
            if self.trial_end_date
            else None,
            "default_payment_method_id": self.default_payment_method_id,
            "subscription_start_date": self.subscription_start_date.isoformat()
            if self.subscription_start_date
            else None,
            "subscription_cancel_date": self.subscription_cancel_date.isoformat()
            if self.subscription_cancel_date
            else None,
            "stripe_price_id": self.stripe_price_id,
            "stripe_subscription_item_id": self.stripe_subscription_item_id,
            "is_verified": self.is_verified,
            "status": self.status,
            "quotas": self.month_usage,
            "last_login": self.last_login.isoformat()
            if self.last_login
            else None,
            "failed_login_attempts": self.failed_login_attempts,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None,
            "updated_at": self.updated_at.isoformat()
            if self.updated_at
            else None,
            "monthly_at": self.monthly_at.isoformat()
            if self.monthly_at
            else None,
            "password_reset_required": self.password_reset_required,
            "projects": [
                project.to_dict(visited) for project in self.projects
            ],
            "tasks": [task.to_dict(visited) for task in self.tasks],
        }

    @classmethod
    def from_dict(cls, data):
        from core.models.task import Task
        from core.models.project import Project

        return cls(
            id=data.get("id"),
            email=data["email"],
            password=data["password"],
            name=data["name"],
            last_name=data["last_name"],
            subscription=data["subscription"],
            role_type=data["role_type"],
            limit=data["limit"],
            stripe_customer_id=data.get("stripe_customer_id"),
            stripe_subscription_id=data.get("stripe_subscription_id"),
            subscription_status=data.get("subscription_status"),
            trial_end_date=data.get("trial_end_date"),
            default_payment_method_id=data.get("default_payment_method_id"),
            subscription_start_date=data.get("subscription_start_date"),
            subscription_cancel_date=data.get("subscription_cancel_date"),
            stripe_price_id=data.get("stripe_price_id"),
            stripe_subscription_item_id=data.get(
                "stripe_subscription_item_id"
            ),
            phone=data.get("phone"),
            organization_id=data.get("organization_id"),
            status=data.get("status"),
            permissions=data.get("permissions"),
            month_usage=data.get("month_usage"),
            is_verified=data.get("is_verified", False),
            created_at=datetime.fromisoformat(data["created_at"])
            if data.get("created_at")
            else None,
            updated_at=datetime.fromisoformat(data["updated_at"])
            if data.get("updated_at")
            else None,
            last_login=datetime.fromisoformat(data["last_login"])
            if data.get("last_login")
            else None,
            monthly_at=datetime.fromisoformat(data["monthly_at"])
            if data.get("monthly_at")
            else None,
            password_reset_required=data.get("password_reset_required", False),
            projects=[Project.from_dict(p) for p in data.get("projects", [])],
            tasks=[Task.from_dict(t) for t in data.get("tasks", [])],
        )
