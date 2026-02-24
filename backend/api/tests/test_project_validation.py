# api/tests/test_project_validation.py
import pytest


@pytest.mark.django_db
def test_project_name_required(auth_client):
    r = auth_client.post("/api/project/", {"status": "Open"}, format="json")
    assert r.status_code == 400
    assert "name" in r.data