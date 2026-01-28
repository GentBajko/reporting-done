from enum import Enum


class SubscriptionTier(Enum):
    """
    Subscription levels with associated resource limits
    and feature access controls based on OCRDone pricing.
    """

    FREE = "Free"
    TIER_1 = "Tier 1"
    TIER_2 = "Tier 2"
    TIER_3 = "Tier 3"
    TIER_4 = "Tier 4"

    @property
    def ocr_page_limit(self) -> int:
        """Monthly OCR page limit for the tier."""
        return {
            self.FREE: 10,
            self.TIER_1: 300,
            self.TIER_2: 1000,
            self.TIER_3: 3500,
            self.TIER_4: 14000,
        }[self]
