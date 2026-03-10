import pytest
from api.models import Employee, Manager


@pytest.mark.django_db
class TestProjectValidation:
    @pytest.fixture
    def base_payload(self, db):
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

            # REMARK: API payload field renamed from `projectmanager` to `manager`.
            "manager": pm.id,

            "employees": [emp.id],
        }

    def test_name_required(self, auth_client, base_payload):
        payload = {**base_payload}
        del payload["name"]

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "name" in r.data

    def test_start_date_required(self, auth_client, base_payload):
        payload = {**base_payload}
        del payload["start_date"]

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "start_date" in r.data

    def test_end_date_required(self, auth_client, base_payload):
        payload = {**base_payload}
        del payload["end_date"]

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "end_date" in r.data

    def test_whitespace_only_name_rejected(self, auth_client, base_payload):
        payload = {
            **base_payload,
            "name": "     ",
        }

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "name" in r.data

    def test_name_is_trimmed_before_save(self, auth_client, base_payload):
        payload = {
            **base_payload,
            "name": "  Valid Project Trimmed  ",
        }

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code in (200, 201)
        assert r.data["name"] == "Valid Project Trimmed"

    def test_end_date_cannot_be_before_start_date(self, auth_client, base_payload):
        payload = {
            **base_payload,
            "start_date": "2025-12-31",
            "end_date": "2025-01-01",
        }

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code == 400
        assert "end_date" in r.data

    def test_invalid_status_rejected(self, auth_client, base_payload):
        r = auth_client.post(
            "/api/projects/",
            {**base_payload, "status": "In progress"},
            format="json",
        )
        assert r.status_code == 400
        assert "status" in r.data

    def test_valid_status_values_accepted(self, auth_client, base_payload):
        valid_statuses = ["Active", "On Hold", "Completed", "Cancelled"]

        for i, status in enumerate(valid_statuses):
            r = auth_client.post(
                "/api/projects/",
                {**base_payload, "name": f"Project {i}", "status": status},
                format="json",
            )
            assert r.status_code in (200, 201)

    def test_duplicate_name_rejected(self, auth_client, base_payload):
        auth_client.post("/api/projects/", base_payload, format="json")

        r = auth_client.post("/api/projects/", base_payload, format="json")
        assert r.status_code == 400
        assert "name" in r.data

    def test_invalid_security_level_rejected(self, auth_client, base_payload):
        r = auth_client.post(
            "/api/projects/",
            {**base_payload, "security_level": "TopSecret"},
            format="json",
        )
        assert r.status_code == 400
        assert "security_level" in r.data

    def test_patch_rejects_invalid_date_range(self, auth_client, base_payload):
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

    def test_comments_defaults_to_empty_string_when_omitted(self, auth_client, base_payload):
        """
        Submitting a payload with no `comments` key must succeed and store "".

        This documents the serializer contract introduced alongside the NOT NULL
        migration: the `comments` CharField on ProjectWriteSerializer declares
        default="" so that an absent key never reaches the DB as NULL.
        """
        payload = {k: v for k, v in base_payload.items() if k != "comments"}

        r = auth_client.post("/api/projects/", payload, format="json")
        assert r.status_code in (200, 201), r.data

        get = auth_client.get(f"/api/projects/{r.data['id']}/")
        assert get.status_code == 200
        assert get.data["comments"] == ""