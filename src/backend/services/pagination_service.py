from typing import Sequence

from backend.types.pagination import PaginationMeta, PaginationParams


class PaginationService:
    __slots__ = ()

    def calculate(
        self,
        total: int,
        params: PaginationParams,
    ) -> PaginationMeta:
        per_page = min(max(params.per_page, 1), 100)
        total_pages = max((total + per_page - 1) // per_page, 1)
        current_page = min(max(params.page, 1), total_pages)

        has_prev = current_page > 1
        has_next = current_page < total_pages

        start_index = ((current_page - 1) * per_page) + 1 if total > 0 else 0
        end_index = min(current_page * per_page, total)

        page_range = self._calculate_page_range(current_page, total_pages)

        return PaginationMeta(
            total_items=total,
            total_pages=total_pages,
            current_page=current_page,
            per_page=per_page,
            has_next=has_next,
            has_prev=has_prev,
            next_page=current_page + 1 if has_next else None,
            prev_page=current_page - 1 if has_prev else None,
            start_index=start_index,
            end_index=end_index,
            page_range=page_range,
        )

    def _calculate_page_range(
        self,
        current_page: int,
        total_pages: int,
        window: int = 2,
    ) -> Sequence[int]:
        start = max(1, current_page - window)
        end = min(total_pages + 1, current_page + window + 1)
        return list(range(start, end))
