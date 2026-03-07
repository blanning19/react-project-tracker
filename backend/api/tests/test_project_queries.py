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
    - 1 query for all employees across all projects
    Total: exactly 2 queries regardless of N
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
        List endpoint should cost exactly 2 queries (projects+manager JOIN,
        employees prefetch) regardless of how many projects are returned.

        If this test fails with a query count higher than 4, select_related
        or prefetch_related has been removed from ProjectViewset.queryset.
        """
        with CaptureQueriesContext(connection) as ctx:
            response = auth_client.get("/api/project/")

        assert response.status_code == 200

        # Allow up to 4 to account for pagination count query + auth token lookup
        # in some Django/DRF versions. The key check is that it does NOT scale
        # linearly with the number of projects (which would be 11+ for 5 projects).
        query_count = len(ctx.captured_queries)
        assert query_count <= 4, (
            f"Expected at most 4 queries for project list, got {query_count}. "
            f"This likely means select_related/prefetch_related is missing on "
            f"ProjectViewset.queryset — check backend/api/views.py."
        )

    def test_list_returns_all_projects(self, auth_client, projects_with_relations):
        """Sanity check that the queryset optimization does not drop any rows."""
        response = auth_client.get("/api/project/")
        assert response.status_code == 200

        rows = (
            response.data.get("results", response.data)
            if isinstance(response.data, dict)
            else response.data
        )
        assert len(rows) == 5
