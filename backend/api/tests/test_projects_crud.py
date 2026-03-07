import pytest
from api.models import Employee, Manager


@pytest.mark.django_db
def test_project_crud(auth_client):
    pm = Manager.objects.create(name="PM One")
    e1 = Employee.objects.create(
        first_name="EmpOne", last_name="One", email="empone@example.com"
    )
    e2 = Employee.objects.create(
        first_name="EmpTwo", last_name="Two", email="emptwo@example.com"
    )

    payload = {
        "name": "Test Project",
        "start_date": "2025-01-01",
        "end_date": "2026-02-25",
        "status": "Active",
        "security_level": "Internal",
        "projectmanager": pm.id,
        "employees": [e1.id, e2.id],
    }

    # Create
    create = auth_client.post("/api/project/", payload, format="json")
    assert create.status_code in (200, 201), getattr(create, "data", None)
    project_id = create.data["id"]

    # List — project should appear
    lst = auth_client.get("/api/project/")
    assert lst.status_code == 200, getattr(lst, "data", None)
    rows = (
        lst.data.get("results", lst.data)
        if isinstance(lst.data, dict)
        else lst.data
    )
    assert any(p["id"] == project_id for p in rows)

    # Update — change status to a valid TextChoices value
    update = auth_client.put(
        f"/api/project/{project_id}/",
        {**payload, "status": "Completed"},
        format="json",
    )
    assert update.status_code in (200, 202), getattr(update, "data", None)
    assert update.data["status"] == "Completed"

    # Delete
    delete = auth_client.delete(f"/api/project/{project_id}/")
    assert delete.status_code in (200, 202, 204)

    # Confirm gone
    get_deleted = auth_client.get(f"/api/project/{project_id}/")
    assert get_deleted.status_code == 404
