"""
Custom DRF pagination classes.

Kept in a dedicated module so settings.py can reference them via
DEFAULT_PAGINATION_CLASS without importing api.views, which would
cause a circular import at Django startup.
"""

from rest_framework.pagination import PageNumberPagination


class ProjectPagination(PageNumberPagination):
    """
    Pagination for the project list endpoint.

    - Default page size comes from settings (DRF_PAGE_SIZE env var, default 50).
    - Clients can override per-request via ?page_size=N.
    - Hard cap of 200 prevents runaway queries from large page_size values.

    page_size_query_param must be set explicitly — the DRF base class leaves it
    as None by design, which means ?page_size is silently ignored without this.
    """
    page_size_query_param = "page_size"
    max_page_size = 200


class NoPagination(PageNumberPagination):
    """
    Disables pagination for lookup endpoints (managers, employees).

    These are used to populate form dropdowns and always need the full list.
    Paginating them would mean the dropdown silently shows only the first page.
    """
    page_size = None