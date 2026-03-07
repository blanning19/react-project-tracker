import pytest
from api.models import Employee, Manager


@pytest.mark.django_db
class TestProjectValidation:
    """
    Validates that the API enforces field-level constraints correctly.

    Tests cover:
    - required fields
    - status TextChoices enforcement
    - security_level TextChoices enforcement
    - duplicate name rejection
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

        r = auth_client.post("/api/project/", payload, format="json")
        assert r.status_code == 400
        assert "name" in r.data

    def test_start_date_required(self, auth_client, base_payload):
        """Start date is required — omitting it should return 400."""
        payload = {**base_payload}
        del payload["start_date"]

        r = auth_client.post("/api/project/", payload, format="json")
        assert r.status_code == 400
        assert "start_date" in r.data

    def test_end_date_required(self, auth_client, base_payload):
        """End date is required — omitting it should return 400."""
        payload = {**base_payload}
        del payload["end_date"]

        r = auth_client.post("/api/project/", payload, format="json")
        assert r.status_code == 400
        assert "end_date" in r.data

    def test_invalid_status_rejected(self, auth_client, base_payload):
        """
        Status uses TextChoices — invalid values should be rejected.

        The API enforces the allowed set: Active | On Hold | Completed | Cancelled.
        """
        r = auth_client.post(
            "/api/project/",
            {**base_payload, "status": "In progress"},  # old invalid value
            format="json",
        )
        assert r.status_code == 400
        assert "status" in r.data

    def test_valid_status_values_accepted(self, auth_client, base_payload):
        """All four TextChoices status values should be accepted by the API."""
        valid_statuses = ["Active", "On Hold", "Completed", "Cancelled"]

        for i, status in enumerate(valid_statuses):
            r = auth_client.post(
                "/api/project/",
                {**base_payload, "name": f"Project {i}", "status": status},
                format="json",
            )
            assert r.status_code in (200, 201), (
                f"Expected status '{status}' to be accepted, got {r.status_code}: {r.data}"
            )

    def test_duplicate_name_rejected(self, auth_client, base_payload):
        """Project names are unique — a duplicate should return 400."""
        auth_client.post("/api/project/", base_payload, format="json")

        r = auth_client.post("/api/project/", base_payload, format="json")
        assert r.status_code == 400
        assert "name" in r.data

    def test_invalid_security_level_rejected(self, auth_client, base_payload):
        """Security level must be one of the defined TextChoices values."""
        r = auth_client.post(
            "/api/project/",
            {**base_payload, "security_level": "TopSecret"},
            format="json",
        )
        assert r.status_code == 400
        assert "security_level" in r.data
