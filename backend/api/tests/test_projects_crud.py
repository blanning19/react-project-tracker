"""
End-to-end CRUD tests for the Project API.

Covers: create, list, retrieve, full update (PUT), partial update (PATCH),
and delete. Each operation is tested independently so a failure is localised
to the specific action.
"""

import pytest
from api.models import Employee, Manager


# ---------------------------------------------------------------------------
# Shared fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def project_payload(db):
    """A valid project payload. Tests may override individual fields."""
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
        "projectmanager": pm.id,
        "employees": [e1.id, e2.id],
    }


# ---------------------------------------------------------------------------
# Full CRUD flow (kept for regression coverage)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_project_crud(auth_client, project_payload):
    """
    Happy-path create → list → update → delete flow.

    Kept as a single flow test so a regression anywhere in the chain is
    immediately visible. Individual operations have dedicated tests below.
    """
    # Create
    create = auth_client.post("/api/project/", project_payload, format="json")
    assert create.status_code in (200, 201), getattr(create, "data", None)
    project_id = create.data["id"]

    # List — paginated envelope always present after Phase 2
    lst = auth_client.get("/api/project/")
    assert lst.status_code == 200
    assert "results" in lst.data, "List endpoint must return a paginated envelope."
    assert any(p["id"] == project_id for p in lst.data["results"])

    # PUT — full update
    update = auth_client.put(
        f"/api/project/{project_id}/",
        {**project_payload, "status": "Completed"},
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


# ---------------------------------------------------------------------------
# Individual operation tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_create_returns_201_and_id(auth_client, project_payload):
    r = auth_client.post("/api/project/", project_payload, format="json")
    assert r.status_code in (200, 201)
    assert "id" in r.data


@pytest.mark.django_db
def test_retrieve_returns_nested_objects(auth_client, project_payload):
    """
    GET /api/project/:id/ uses ProjectReadSerializer which returns nested
    objects for projectmanager and employees, not bare IDs.
    """
    create = auth_client.post("/api/project/", project_payload, format="json")
    project_id = create.data["id"]

    r = auth_client.get(f"/api/project/{project_id}/")
    assert r.status_code == 200

    # projectmanager should be a dict (nested), not a bare integer
    pm = r.data.get("projectmanager")
    assert isinstance(pm, dict), (
        f"Expected projectmanager to be a nested object, got: {type(pm).__name__}"
    )
    assert "id" in pm

    # employees should be a list of dicts
    employees = r.data.get("employees", [])
    assert isinstance(employees, list)
    if employees:
        assert isinstance(employees[0], dict), (
            "Each employee entry should be a nested object with at least an id field."
        )


@pytest.mark.django_db
def test_list_response_has_paginated_envelope(auth_client, project_payload):
    """
    Phase 2: list endpoint must always return a paginated envelope with
    count, next, previous, and results keys.
    """
    auth_client.post("/api/project/", project_payload, format="json")
    r = auth_client.get("/api/project/")
    assert r.status_code == 200
    for key in ("count", "next", "previous", "results"):
        assert key in r.data, f"Expected '{key}' in list response, got: {list(r.data.keys())}"


@pytest.mark.django_db
def test_put_updates_all_fields(auth_client, project_payload):
    """PUT should replace all mutable fields."""
    create = auth_client.post("/api/project/", project_payload, format="json")
    project_id = create.data["id"]

    updated_payload = {**project_payload, "name": "Updated Name", "status": "On Hold"}
    r = auth_client.put(f"/api/project/{project_id}/", updated_payload, format="json")
    assert r.status_code in (200, 202)
    assert r.data["status"] == "On Hold"

    # Confirm persisted via retrieve
    get = auth_client.get(f"/api/project/{project_id}/")
    assert get.data["status"] == "On Hold"


@pytest.mark.django_db
def test_patch_updates_single_field(auth_client, project_payload):
    """
    PATCH (partial update) should update only the supplied fields and leave
    the rest unchanged.

    Previously untested — this is a new test added in Phase 3.
    """
    create = auth_client.post("/api/project/", project_payload, format="json")
    project_id = create.data["id"]

    r = auth_client.patch(
        f"/api/project/{project_id}/",
        {"status": "Completed"},
        format="json",
    )
    assert r.status_code in (200, 202), getattr(r, "data", None)
    assert r.data["status"] == "Completed"

    # All other fields must be unchanged
    get = auth_client.get(f"/api/project/{project_id}/")
    assert get.data["name"] == project_payload["name"]
    assert get.data["security_level"] == project_payload["security_level"]


@pytest.mark.django_db
def test_patch_invalid_status_rejected(auth_client, project_payload):
    """PATCH with an invalid status value should return 400."""
    create = auth_client.post("/api/project/", project_payload, format="json")
    project_id = create.data["id"]

    r = auth_client.patch(
        f"/api/project/{project_id}/",
        {"status": "NotAStatus"},
        format="json",
    )
    assert r.status_code == 400
    assert "status" in r.data


@pytest.mark.django_db
def test_delete_removes_project(auth_client, project_payload):
    create = auth_client.post("/api/project/", project_payload, format="json")
    project_id = create.data["id"]

    delete = auth_client.delete(f"/api/project/{project_id}/")
    assert delete.status_code in (200, 202, 204)

    get = auth_client.get(f"/api/project/{project_id}/")
    assert get.status_code == 404


@pytest.mark.django_db
def test_retrieve_nonexistent_project_returns_404(auth_client):
    r = auth_client.get("/api/project/99999/")
    assert r.status_code == 404
