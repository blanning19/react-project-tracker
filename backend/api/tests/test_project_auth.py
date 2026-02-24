import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_projects_requires_auth():
    client = APIClient()
    r = client.get("/api/project/")
    assert r.status_code == 401