"""
Query count tests for the ProjectViewset list endpoint.

Verifies that select_related/prefetch_related prevents N+1 queries and that
the total query count stays bounded as the number of projects grows.
"""

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from api.models import Employee, Manager, Project


@pytest.mark.django_db
class TestProjectListQueryCount:
    """
    Verifies that the ProjectViewset list endpoint does not produce N+1 queries.

    Without select_related/prefetch_related, fetching N projects fires:
    - 1 query for the project list
    - 1 query per project for its project manager  (N queries)
    - 1 query per project for its employees        (N queries)
    Total: 2N + 1 queries

    With select_related("projectmanager") + prefetch_related("employees"):
    - 1 query for projects + manager (JOIN)
    - 1 query for all employees across all projects (prefetch)
    Total: 2 core queries

    Phase 2 (django-filter + PageNumberPagination) adds up to 2 additional
    fixed-cost queries:
    - 1 COUNT(*) query for the pagination total
    - 1 auth token lookup (some DRF/JWT versions)
    Ceiling is therefore 5 regardless of project count.
    """

    @pytest.fixture
    def projects_with_relations(self, db):
        """Creates 5 projects each with a manager and two employees."""
        employees = [
            Employee.objects.create(
                first_name=f"First{i}",
                last_name=f"Last{i}",
                email=f"emp{i}@example.com",
            )
            for i in range(10)
        ]

        projects = []
        for i in range(5):
            pm = Manager.objects.create(name=f"Manager {i}")
            project = Project.objects.create(
                name=f"Project {i}",
                projectmanager=pm,
                start_date="2025-01-01",
                end_date="2025-12-31",
                status="Active",
            )
            project.employees.set(employees[i * 2 : i * 2 + 2])
            projects.append(project)

        return projects

    def test_list_uses_fixed_query_count(self, auth_client, projects_with_relations):
        """
        List endpoint should cost a fixed number of queries regardless of how
        many projects are returned.

        Budget breakdown:
          1  — COUNT(*) for DRF pagination total
          1  — SELECT project + JOIN manager (select_related)
          1  — SELECT employees for all projects (prefetch_related)
          1  — Auth token lookup (JWT, some versions)
          1  — spare for any incidental framework query
        Total ceiling: 5

        If this test fails with a count > 5, select_related or
        prefetch_related has been removed from ProjectViewset.queryset.
        N+1 for 5 projects would produce 11+ queries.
        """
        with CaptureQueriesContext(connection) as ctx:
            response = auth_client.get("/api/project/")

        assert response.status_code == 200

        query_count = len(ctx.captured_queries)
        assert query_count <= 5, (
            f"Expected at most 5 queries for project list, got {query_count}.\n"
            f"Queries fired:\n"
            + "\n".join(f"  {i+1}. {q['sql'][:120]}" for i, q in enumerate(ctx.captured_queries))
            + "\nThis likely means select_related/prefetch_related is missing — "
            "check backend/api/views.py ProjectViewset.queryset."
        )

    def test_query_count_does_not_grow_with_more_projects(self, auth_client, db):
        """
        Regression guard: adding more projects must not increase the query count.

        Creates 10 projects and asserts the same ceiling of 5 queries.
        If the count scales linearly, N+1 is present.
        """
        pm = Manager.objects.create(name="Scale PM")
        employees = [
            Employee.objects.create(
                first_name=f"S{i}", last_name="Scale", email=f"scale{i}@example.com"
            )
            for i in range(4)
        ]

        for i in range(10):
            p = Project.objects.create(
                name=f"Scale Project {i}",
                projectmanager=pm,
                start_date="2025-01-01",
                end_date="2025-12-31",
                status="Active",
            )
            p.employees.set(employees[:2])

        with CaptureQueriesContext(connection) as ctx:
            response = auth_client.get("/api/project/?page_size=10")

        assert response.status_code == 200
        assert len(ctx.captured_queries) <= 5, (
            f"Query count grew to {len(ctx.captured_queries)} with 10 projects — "
            "select_related/prefetch_related may be missing or misconfigured."
        )

    def test_list_returns_all_projects(self, auth_client, projects_with_relations):
        """Sanity check: the queryset optimisation must not drop any rows."""
        response = auth_client.get("/api/project/")
        assert response.status_code == 200

        rows = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        assert len(rows) == 5

    def test_retrieve_uses_fixed_query_count(self, auth_client, projects_with_relations):
        """
        GET /api/project/:id/ (single record) should also avoid N+1.

        The retrieve action uses the same queryset as list, so select_related
        and prefetch_related apply. Expected cost: 1–3 queries maximum.
        """
        project_id = projects_with_relations[0].id

        with CaptureQueriesContext(connection) as ctx:
            response = auth_client.get(f"/api/project/{project_id}/")

        assert response.status_code == 200
        assert len(ctx.captured_queries) <= 3, (
            f"Expected at most 3 queries for single project retrieve, "
            f"got {len(ctx.captured_queries)}."
        )
