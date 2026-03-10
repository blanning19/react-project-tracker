"""
End-to-end CRUD tests for the Project API.

Covers: create, list, retrieve, full update (PUT), partial update (PATCH),
and delete. Each operation is tested independently so a failure is localised
to the specific action.
"""

import pytest
from api.models import Employee, Manager


@pytest.fixture
def project_payload(db):
    pm = Manager.objects.create(name="PM One")
    e1 = Employee.objects.create(
        first_name="EmpOne", last_name="One", email="empone@example.com"
    )
    e2 = Employee.objects.create(
        first_name="EmpTwo", last_name="Two", email="emptwo@example.com"
    )
    return {
        "name": "Test Project",
        "start_date": "2025-01-01",
        "end_date": "2026-02-25",
        "status": "Active",
        "security_level": "Internal",
        "manager": pm.id,
        "employees": [e1.id, e2.id],
        "comments": "",
    }


@pytest.mark.django_db
def test_project_crud(auth_client, project_payload):
    create = auth_client.post("/api/projects/", project_payload, format="json")
    assert create.status_code in (200, 201), getattr(create, "data", None)
    project_id = create.data["id"]

    lst = auth_client.get("/api/projects/")
    assert lst.status_code == 200
    assert "results" in lst.data
    assert any(p["id"] == project_id for p in lst.data["results"])

    update = auth_client.put(
        f"/api/projects/{project_id}/",
        {**project_payload, "status": "Completed"},
        format="json",
    )
    assert update.status_code in (200, 202), getattr(update, "data", None)
    assert update.data["status"] == "Completed"

    delete = auth_client.delete(f"/api/projects/{project_id}/")
    assert delete.status_code in (200, 202, 204)

    get_deleted = auth_client.get(f"/api/projects/{project_id}/")
    assert get_deleted.status_code == 404


@pytest.mark.django_db
def test_create_returns_201_and_id(auth_client, project_payload):
    r = auth_client.post("/api/projects/", project_payload, format="json")
    assert r.status_code in (200, 201)
    assert "id" in r.data


@pytest.mark.django_db
def test_retrieve_returns_nested_objects(auth_client, project_payload):
    create = auth_client.post("/api/projects/", project_payload, format="json")
    project_id = create.data["id"]

    r = auth_client.get(f"/api/projects/{project_id}/")
    assert r.status_code == 200

    pm = r.data.get("manager")
    assert isinstance(pm, dict), (
        f"Expected manager to be a nested object, got: {type(pm).__name__}"
    )
    assert "id" in pm

    employees = r.data.get("employees", [])
    assert isinstance(employees, list)
    if employees:
        assert isinstance(employees[0], dict)

@pytest.mark.django_db
def test_list_response_has_paginated_envelope(auth_client, project_payload):
    auth_client.post("/api/projects/", project_payload, format="json")
    r = auth_client.get("/api/projects/")
    assert r.status_code == 200
    for key in ("count", "next", "previous", "results"):
        assert key in r.data

@pytest.mark.django_db
def test_put_updates_all_fields(auth_client, project_payload):
    create = auth_client.post("/api/projects/", project_payload, format="json")
    project_id = create.data["id"]

    updated_payload = {**project_payload, "name": "Updated Name", "status": "On Hold"}
    r = auth_client.put(f"/api/projects/{project_id}/", updated_payload, format="json")
    assert r.status_code in (200, 202)
    assert r.data["status"] == "On Hold"

    get = auth_client.get(f"/api/projects/{project_id}/")
    assert get.data["status"] == "On Hold"

@pytest.mark.django_db
def test_patch_updates_single_field(auth_client, project_payload):
    create = auth_client.post("/api/projects/", project_payload, format="json")
    project_id = create.data["id"]

    r = auth_client.patch(
        f"/api/projects/{project_id}/",
        {"status": "Completed"},
        format="json",
    )
    assert r.status_code in (200, 202), getattr(r, "data", None)
    assert r.data["status"] == "Completed"

    get = auth_client.get(f"/api/projects/{project_id}/")
    assert get.data["name"] == project_payload["name"]
    assert get.data["security_level"] == project_payload["security_level"]

@pytest.mark.django_db
def test_patch_invalid_status_rejected(auth_client, project_payload):
    create = auth_client.post("/api/projects/", project_payload, format="json")
    project_id = create.data["id"]

    r = auth_client.patch(
        f"/api/projects/{project_id}/",
        {"status": "NotAStatus"},
        format="json",
    )
    assert r.status_code == 400
    assert "status" in r.data

@pytest.mark.django_db
def test_delete_removes_project(auth_client, project_payload):
    create = auth_client.post("/api/projects/", project_payload, format="json")
    project_id = create.data["id"]

    delete = auth_client.delete(f"/api/projects/{project_id}/")
    assert delete.status_code in (200, 202, 204)

    get = auth_client.get(f"/api/projects/{project_id}/")
    assert get.status_code == 404

@pytest.mark.django_db
def test_retrieve_nonexistent_project_returns_404(auth_client):
    r = auth_client.get("/api/projects/99999/")
    assert r.status_code == 404