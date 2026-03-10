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
    """

    @pytest.fixture
    def projects_with_relations(self, db):
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
                manager=pm,
                start_date="2025-01-01",
                end_date="2025-12-31",
                status="Active",
                comments="",
            )
            project.employees.set(employees[i * 2: i * 2 + 2])
            projects.append(project)

        return projects

    def test_list_uses_fixed_query_count(self, auth_client, projects_with_relations):
        with CaptureQueriesContext(connection) as ctx:
            response = auth_client.get("/api/projects/")

        assert response.status_code == 200

        query_count = len(ctx.captured_queries)
        assert query_count <= 5, (
            f"Expected at most 5 queries for project list, got {query_count}.\n"
            + "\n".join(f"  {i+1}. {q['sql'][:120]}" for i, q in enumerate(ctx.captured_queries))
        )

    def test_query_count_does_not_grow_with_more_projects(self, auth_client, db):
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
                manager=pm,
                start_date="2025-01-01",
                end_date="2025-12-31",
                status="Active",
                comments="",
            )
            p.employees.set(employees[:2])

        with CaptureQueriesContext(connection) as ctx:
            response = auth_client.get("/api/projects/?page_size=10")

        assert response.status_code == 200
        assert len(ctx.captured_queries) <= 5

    def test_list_returns_all_projects(self, auth_client, projects_with_relations):
        response = auth_client.get("/api/projects/")
        assert response.status_code == 200

        rows = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        assert len(rows) == 5

    def test_retrieve_uses_fixed_query_count(self, auth_client, projects_with_relations):
        project_id = projects_with_relations[0].id

        with CaptureQueriesContext(connection) as ctx:
            response = auth_client.get(f"/api/projects/{project_id}/")

        assert response.status_code == 200
        assert len(ctx.captured_queries) <= 3