from fastapi.testclient import TestClient
import pytest

from src import app as application
from urllib.parse import quote
from src.app import activities


@pytest.fixture
def client():
    return TestClient(application.app)


def test_get_activities(client):
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # expect at least one known activity
    assert "Art Workshop" in data


def test_signup_and_unregister_flow(client):
    activity = "Art Workshop"
    email = "test.user+pytest@me.com"

    # ensure email not present
    original = list(activities[activity]["participants"])
    if email in original:
        activities[activity]["participants"].remove(email)

    try:
        # signup should succeed
        res = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
        assert res.status_code == 200
        assert f"Signed up {email}" in res.json().get("message", "")
        assert email in activities[activity]["participants"]

        # duplicate signup should fail (400)
        res2 = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
        assert res2.status_code == 400

        # unregister should succeed
        res3 = client.delete(f"/activities/{quote(activity)}/signup?email={quote(email)}")
        assert res3.status_code == 200
        assert email not in activities[activity]["participants"]

        # unregistering again should return 404
        res4 = client.delete(f"/activities/{quote(activity)}/signup?email={quote(email)}")
        assert res4.status_code == 404

    finally:
        # restore original participants
        activities[activity]["participants"] = original


def test_capacity_enforced(client):
    # create a temporary activity with capacity 1
    name = "__pytest_temp_capacity__"
    activities[name] = {
        "description": "temp",
        "schedule": "now",
        "max_participants": 1,
        "participants": []
    }

    try:
        e1 = "first@me.com"
        e2 = "second@me.com"
        res1 = client.post(f"/activities/{quote(name)}/signup?email={quote(e1)}")
        assert res1.status_code == 200

        # next signup should fail because full
        res2 = client.post(f"/activities/{quote(name)}/signup?email={quote(e2)}")
        assert res2.status_code == 400
    finally:
        activities.pop(name, None)
