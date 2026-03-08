import pytest
from api.models import Employee, Manager


@pytest.mark.django_db
class TestProjectValidation:
    """
    Validates that the API enforces field-level and cross-field constraints.

    Tests cover:
    - required fields
    - whitespace normalization and rejection
    - status TextChoices enforcement
    - security_level TextChoices enforcement
    - duplicate name rejection
    - date-range business validation
    """

    @pytest.fixture
    def base_payload(self, db):
        """A valid minimal payload that all tests can build on."""
        pm = Manager.objects.create(name="Test PM")
        emp = Employee.objects.create(
            first_name="Test",
            last_name="Employee",
            email="test.employee@example.com",
        )

        return {
            "name": "Valid Project",
            "start_date": "2025-01-01",
            "end_date": "2025-12-31",
            "status": "Active",
            "security_level": "Internal",
            "projectmanager": pm.id,
            "employees": [emp.id],
        }

    def test_name_required(self, auth_client, base_payload):
        """Project name is required — omitting it should return 400."""
        payload = {**base_payload}
        del payload["name"]

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "name" in r.data

    def test_start_date_required(self, auth_client, base_payload):
        """Start date is required — omitting it should return 400."""
        payload = {**base_payload}
        del payload["start_date"]

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "start_date" in r.data

    def test_end_date_required(self, auth_client, base_payload):
        """End date is required — omitting it should return 400."""
        payload = {**base_payload}
        del payload["end_date"]

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "end_date" in r.data

    def test_whitespace_only_name_rejected(self, auth_client, base_payload):
        """A name containing only spaces should be rejected by the API."""
        payload = {
            **base_payload,
            "name": "     ",
        }

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "name" in r.data

    def test_name_is_trimmed_before_save(self, auth_client, base_payload):
        """Leading and trailing spaces should be removed before save."""
        payload = {
            **base_payload,
            "name": "  Valid Project Trimmed  ",
        }

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code in (200, 201)
        assert r.data["name"] == "Valid Project Trimmed"

    def test_end_date_cannot_be_before_start_date(self, auth_client, base_payload):
        """The API must reject projects whose end date is before the start date."""
        payload = {
            **base_payload,
            "start_date": "2025-12-31",
            "end_date": "2025-01-01",
        }

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "end_date" in r.data

    def test_invalid_status_rejected(self, auth_client, base_payload):
        """
        Status uses TextChoices — invalid values should be rejected.

        The API enforces the allowed set: Active | On Hold | Completed | Cancelled.
        """
        r = auth_client.post(
            "/api/projects/",
            {**base_payload, "status": "In progress"},
            format="json",
        )
        assert r.status_code == 400
        assert "status" in r.data

    def test_valid_status_values_accepted(self, auth_client, base_payload):
        """All four TextChoices status values should be accepted by the API."""
        valid_statuses = ["Active", "On Hold", "Completed", "Cancelled"]

        for i, status in enumerate(valid_statuses):
            r = auth_client.post(
                "/api/projects/",
                {**base_payload, "name": f"Project {i}", "status": status},
                format="json",
            )
            assert r.status_code in (200, 201), (
                f"Expected status '{status}' to be accepted, got {r.status_code}: {r.data}"
            )

    def test_duplicate_name_rejected(self, auth_client, base_payload):
        """Project names are unique — a duplicate should return 400."""
        auth_client.post("/api/projects/", base_payload, format="json")

        r = auth_client.post("/api/projects/", base_payload, format="json")
        assert r.status_code == 400
        assert "name" in r.data

    def test_invalid_security_level_rejected(self, auth_client, base_payload):
        """Security level must be one of the defined TextChoices values."""
        r = auth_client.post(
            "/api/projects/",
            {**base_payload, "security_level": "TopSecret"},
            format="json",
        )
        assert r.status_code == 400
        assert "security_level" in r.data

    def test_patch_rejects_invalid_date_range(self, auth_client, base_payload):
        """PATCH must not allow a valid project to become invalid."""
        create = auth_client.post("/api/projects/", base_payload, format="json")
        assert create.status_code in (200, 201)

        project_id = create.data["id"]

        r = auth_client.patch(
            f"/api/projects/{project_id}/",
            {"end_date": "2024-01-01"},
            format="json",
        )
        assert r.status_code == 400
        assert "end_date" in r.data

    def test_put_rejects_invalid_date_range(self, auth_client, base_payload):
        """PUT must enforce the same date-range validation as create."""
        create = auth_client.post("/api/projects/", base_payload, format="json")
        assert create.status_code in (200, 201)

        project_id = create.data["id"]

        payload = {
            **base_payload,
            "name": "Updated Project",
            "start_date": "2025-10-01",
            "end_date": "2025-01-01",
        }

        r = auth_client.put(f"/api/projects/{project_id}/", payload, format="json")
        assert r.status_code == 400
        assert "end_date" in r.data