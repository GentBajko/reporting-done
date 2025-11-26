import re
from typing import Any, Sequence, Mapping, List
from datetime import datetime

from sqlalchemy import asc, desc

FilterMapping = Mapping[str, str]
SortMapping = Mapping[str, Any]
FilterResult = dict[str, str | int | float | bool]
OrderByResult = List[Any]

OPERATOR_MAP: Mapping[str, str] = {
    ">": "gt",
    "<": "lt",
    ">=": "gte",
    "<=": "lte",
    "=": "eq",
    "has": "has",
}


def get_filters(
    combined_filters: str | None,
    filter_mapping: FilterMapping,
    default_field: str,
    date_fields: Sequence[str] | None = None,
) -> FilterResult:
    filters: FilterResult = {}
    date_fields_set = set(date_fields) if date_fields else set()
    
    if not combined_filters:
        return filters
    
    mini_filters = [f.strip() for f in combined_filters.split(",") if f.strip()]
    
    for mf in mini_filters:
        if " has " in mf.lower():
            parts = re.split(r"\s+has\s+", mf, flags=re.IGNORECASE)
            if len(parts) == 2:
                field_part = parts[0].strip().title()
                value_part = parts[1].strip()
                db_field = filter_mapping.get(field_part)
                if db_field:
                    filters[f"{db_field}__contains"] = value_part
            continue
        
        pattern = r"^(?P<field>.*?)\s*(?P<op>>=|<=|>|<|=)\s*(?P<value>.*)$"
        match = re.match(pattern, mf)
        
        if match:
            field_part = match.group("field").strip().title()
            op_part = match.group("op").strip()
            value_part = match.group("value").strip()
            
            processed_value: str | int | float = value_part
            
            if field_part in date_fields_set:
                try:
                    processed_value = datetime.strptime(value_part, "%d-%m-%Y").timestamp()
                except ValueError:
                    continue
            elif value_part.lower() == "yes":
                processed_value = 1
            elif value_part.lower() == "no":
                processed_value = 0
            
            db_field = filter_mapping.get(field_part)
            if db_field and op_part in OPERATOR_MAP:
                op_key = OPERATOR_MAP[op_part]
                filters[f"{db_field}__{op_key}"] = processed_value
        else:
            search_field = filter_mapping.get(default_field)
            if search_field:
                filters[f"{search_field}__contains"] = mf
    
    return filters


def get_sorting(
    sort: str | None,
    order: str | None,
    sort_mapping: SortMapping,
) -> OrderByResult:
    order_by: OrderByResult = []
    
    if not sort:
        return order_by
    
    sort_field = sort_mapping.get(sort)
    if not sort_field:
        return order_by
    
    if order and order.lower() == "desc":
        order_by.append(desc(sort_field))  # type: ignore
    else:
        order_by.append(asc(sort_field))  # type: ignore
    
    return order_by
