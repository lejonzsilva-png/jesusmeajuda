"""Backend regression tests for Setlist Metrônomo (iteration 2).
Validates backend template endpoints remain healthy and PWA static assets are served.
"""
import os
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://build-app-br.preview.emergentagent.com').rstrip('/')


class TestBackendHealth:
    def test_root_hello_world(self):
        r = requests.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("message") == "Hello World"

    def test_status_check_create_and_list(self):
        payload = {"client_name": "TEST_iteration2"}
        r = requests.post(f"{BASE_URL}/api/status", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["client_name"] == "TEST_iteration2"
        assert "id" in body and isinstance(body["id"], str)
        assert "timestamp" in body

        # Verify GET returns it (and never leaks _id)
        r2 = requests.get(f"{BASE_URL}/api/status", timeout=15)
        assert r2.status_code == 200
        rows = r2.json()
        assert isinstance(rows, list)
        for row in rows:
            assert "_id" not in row
        assert any(row.get("id") == body["id"] for row in rows)


class TestPWAStaticAssets:
    def test_manifest_served(self):
        r = requests.get(f"{BASE_URL}/manifest.json", timeout=15)
        assert r.status_code == 200
        # JSON content
        data = r.json()
        assert "name" in data or "short_name" in data

    def test_service_worker_served(self):
        r = requests.get(f"{BASE_URL}/sw.js", timeout=15)
        assert r.status_code == 200
        assert "javascript" in r.headers.get("content-type", "").lower() or r.text.strip() != ""
