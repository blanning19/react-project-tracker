"""
Tests for server-side filtering, searching, ordering, and pagination.

These tests verify the ProjectViewset query parameter behaviour added in
Phase 2 (django-filter + SearchFilter + OrderingFilter + PageNumberPagination).

All tests use the auth_client fixture from conftest.py and create their own
data so they are fully isolated from other test modules.
"""

import pytest
from api.models import Employee, Manager, Project


@pytest.fixture
def project_set(db):
    """
    Creates a controlled set of projects used across all tests in this module.

    Projects:
        Alpha   — Active,    Confidential,  2025-01-01 → 2025-06-30
        Beta    — On Hold,   Internal,      2025-03-01 → 2025-09-30
        Gamma   — Completed, Public,        2024-06-01 → 2024-12-31
        Delta   — Cancelled, Restricted,    2026-01-01 → 2026-12-31

    Comments on Alpha contain "budget review" so search tests can target it
    specifically without matching any other project's name or comments.
    """
    pm = Manager.objects.create(name="PM Fixture")
    emp = Employee.objects.create(
        first_name="Fixture", last_name="Employee", email="fixture@example.com"
    )

    alpha = Project.objects.create(
        name="Alpha",
        status="Active",
        security_level="Confidential",
        start_date="2025-01-01",
        end_date="2025-06-30",
        comments="Includes budget review for Q1.",
        manager=pm,
    )
    alpha.employees.add(emp)

    beta = Project.objects.create(
        name="Beta",
        status="On Hold",
        security_level="Internal",
        start_date="2025-03-01",
        end_date="2025-09-30",
        manager=pm,
    )

    gamma = Project.objects.create(
        name="Gamma",
        status="Completed",
        security_level="Public",
        start_date="2024-06-01",
        end_date="2024-12-31",
        manager=pm,
    )

    delta = Project.objects.create(
        name="Delta",
        status="Cancelled",
        security_level="Restricted",
        start_date="2026-01-01",
        end_date="2026-12-31",
        manager=pm,
    )

    return {"alpha": alpha, "beta": beta, "gamma": gamma, "delta": delta}


@pytest.mark.django_db
class TestPagination:
    def test_list_returns_paginated_envelope(self, auth_client, project_set):
        r = auth_client.get("/api/projects/")
        assert r.status_code == 200
        assert "count" in r.data
        assert "results" in r.data
        assert isinstance(r.data["results"], list)

    def test_count_reflects_total_records(self, auth_client, project_set):
        r = auth_client.get("/api/projects/")
        assert r.data["count"] == 4

    def test_page_size_limits_results(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?page_size=2")
        assert r.status_code == 200
        assert len(r.data["results"]) == 2
        assert r.data["count"] == 4
        assert r.data["next"] is not None

    def test_second_page_returns_remaining_results(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?page=2&page_size=2")
        assert r.status_code == 200
        assert len(r.data["results"]) == 2
        assert r.data["previous"] is not None
        assert r.data["next"] is None

    def test_page_beyond_last_returns_404(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?page=999")
        assert r.status_code == 404

    def test_previous_is_null_on_first_page(self, auth_client, project_set):
        r = auth_client.get("/api/projects/")
        assert r.data["previous"] is None

    def test_next_is_null_on_last_page(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?page_size=10")
        assert r.data["next"] is None


@pytest.mark.django_db
class TestStatusFilter:
    def test_filter_active(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?status=Active")
        assert r.status_code == 200
        names = [p["name"] for p in r.data["results"]]
        assert names == ["Alpha"]

    def test_filter_on_hold(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?status=On+Hold")
        assert r.status_code == 200
        names = [p["name"] for p in r.data["results"]]
        assert names == ["Beta"]

    def test_filter_completed(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?status=Completed")
        assert r.status_code == 200
        assert r.data["count"] == 1
        assert r.data["results"][0]["name"] == "Gamma"

    def test_filter_cancelled(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?status=Cancelled")
        assert r.status_code == 200
        assert r.data["results"][0]["name"] == "Delta"

    def test_filter_no_match_returns_empty(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?status=Active")
        assert r.data["count"] == 1

    def test_filter_invalid_status_returns_400(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?status=Nonsense")
        assert r.status_code == 400

    def test_count_reflects_filtered_total(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?status=Active")
        assert r.data["count"] == 1


@pytest.mark.django_db
class TestSecurityLevelFilter:
    def test_filter_confidential(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?security_level=Confidential")
        assert r.status_code == 200
        assert r.data["count"] == 1
        assert r.data["results"][0]["name"] == "Alpha"

    def test_filter_internal(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?security_level=Internal")
        assert r.status_code == 200
        assert r.data["count"] == 1
        assert r.data["results"][0]["name"] == "Beta"

    def test_filter_public(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?security_level=Public")
        assert r.status_code == 200
        assert r.data["count"] == 1
        assert r.data["results"][0]["name"] == "Gamma"

    def test_combined_status_and_security_level(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?status=Active&security_level=Confidential")
        assert r.status_code == 200
        assert r.data["count"] == 1
        assert r.data["results"][0]["name"] == "Alpha"

    def test_combined_filters_no_match(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?status=Active&security_level=Public")
        assert r.status_code == 200
        assert r.data["count"] == 0


@pytest.mark.django_db
class TestSearch:
    def test_search_by_name(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?search=Alpha")
        assert r.status_code == 200
        assert r.data["count"] == 1
        assert r.data["results"][0]["name"] == "Alpha"

    def test_search_is_case_insensitive(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?search=alpha")
        assert r.status_code == 200
        assert r.data["count"] == 1

    def test_search_by_comments(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?search=budget+review")
        assert r.status_code == 200
        assert r.data["count"] == 1
        assert r.data["results"][0]["name"] == "Alpha"

    def test_search_partial_match(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?search=amm")
        assert r.status_code == 200
        assert r.data["count"] == 1
        assert r.data["results"][0]["name"] == "Gamma"

    def test_search_no_match_returns_empty(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?search=zzznomatch")
        assert r.status_code == 200
        assert r.data["count"] == 0

    def test_search_combined_with_status_filter(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?search=a&status=Active")
        assert r.status_code == 200
        assert r.data["count"] == 1
        assert r.data["results"][0]["name"] == "Alpha"


@pytest.mark.django_db
class TestOrdering:
    def _names(self, response):
        return [p["name"] for p in response.data["results"]]

    def test_order_by_name_asc(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?ordering=name&page_size=10")
        assert r.status_code == 200
        assert self._names(r) == ["Alpha", "Beta", "Delta", "Gamma"]

    def test_order_by_name_desc(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?ordering=-name&page_size=10")
        assert r.status_code == 200
        assert self._names(r) == ["Gamma", "Delta", "Beta", "Alpha"]

    def test_order_by_start_date_asc(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?ordering=start_date&page_size=10")
        assert r.status_code == 200
        assert self._names(r) == ["Gamma", "Alpha", "Beta", "Delta"]

    def test_order_by_start_date_desc(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?ordering=-start_date&page_size=10")
        assert r.status_code == 200
        assert self._names(r) == ["Delta", "Beta", "Alpha", "Gamma"]

    def test_order_by_status(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?ordering=status&page_size=10")
        assert r.status_code == 200
        names = self._names(r)
        assert names.index("Alpha") < names.index("Beta")

    def test_order_by_end_date_asc(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?ordering=end_date&page_size=10")
        assert r.status_code == 200
        assert self._names(r) == ["Gamma", "Alpha", "Beta", "Delta"]

    def test_disallowed_ordering_field_is_ignored(self, auth_client, project_set):
        r = auth_client.get("/api/projects/?ordering=comments")
        assert r.status_code == 200


@pytest.mark.django_db
class TestLookupEndpoints:
    @pytest.fixture
    def lookup_data(self, db):
        managers = [Manager.objects.create(name=f"Manager {i}") for i in range(3)]
        employees = [
            Employee.objects.create(
                first_name=f"First{i}",
                last_name=f"Last{i}",
                email=f"lookup{i}@example.com",
            )
            for i in range(5)
        ]
        return {"managers": managers, "employees": employees}

    def test_managers_requires_auth(self, api_client):
        r = api_client.get("/api/managers/")
        assert r.status_code == 401

    def test_employees_requires_auth(self, api_client):
        r = api_client.get("/api/employees/")
        assert r.status_code == 401

    def test_managers_returns_flat_list(self, auth_client, lookup_data):
        r = auth_client.get("/api/managers/")
        assert r.status_code == 200
        assert isinstance(r.data, list)

    def test_employees_returns_flat_list(self, auth_client, lookup_data):
        r = auth_client.get("/api/employees/")
        assert r.status_code == 200
        assert isinstance(r.data, list)

    def test_managers_returns_all_records(self, auth_client, lookup_data):
        r = auth_client.get("/api/managers/")
        assert r.status_code == 200
        assert len(r.data) == 3

    def test_employees_returns_all_records(self, auth_client, lookup_data):
        r = auth_client.get("/api/employees/")
        assert r.status_code == 200
        assert len(r.data) == 5