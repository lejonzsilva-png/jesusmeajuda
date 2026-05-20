"""Tests for PWA assets, manifest, and basic /api health."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback: read from frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


ICON_PATHS = [
    ("/favicon.ico", ["image/x-icon", "image/vnd.microsoft.icon", "image/png"]),
    ("/favicon-32.png", ["image/png"]),
    ("/favicon-64.png", ["image/png"]),
    ("/icon-192.png", ["image/png"]),
    ("/icon-512.png", ["image/png"]),
    ("/icon-maskable-512.png", ["image/png"]),
    ("/apple-touch-icon.png", ["image/png"]),
    ("/logo.png", ["image/png"]),
]


@pytest.mark.parametrize("path,expected_types", ICON_PATHS)
def test_icon_served(path, expected_types):
    r = requests.get(f"{BASE_URL}{path}", timeout=10)
    assert r.status_code == 200, f"{path} returned {r.status_code}"
    ct = r.headers.get("content-type", "").lower()
    assert any(t in ct for t in expected_types), f"{path} content-type={ct}, expected one of {expected_types}"
    assert len(r.content) > 100, f"{path} content too small"


def test_manifest_json():
    r = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Setlist Metrônomo"
    assert data["theme_color"] == "#f5b820"
    assert data["display"] == "standalone"
    icons = data.get("icons", [])
    assert len(icons) >= 6, f"expected >=6 icons, got {len(icons)}"
    sizes_purposes = [(i["sizes"], i.get("purpose", "any")) for i in icons]
    assert any(s == "192x192" for s, _ in sizes_purposes)
    assert any(s == "512x512" and "any" in p for s, p in sizes_purposes)
    assert any(s == "512x512" and "maskable" in p for s, p in sizes_purposes)


def test_sw_js_v2():
    r = requests.get(f"{BASE_URL}/sw.js", timeout=10)
    assert r.status_code == 200
    assert "setlist-metronome-v2" in r.text, "service worker cache version not v2"


def test_api_root_ok():
    # The backend is unchanged but should be reachable under /api
    r = requests.get(f"{BASE_URL}/api/", timeout=10)
    # Acceptable: 200 (root), 404 (no root route), 405 (method)
    assert r.status_code in (200, 404, 405), f"/api/ returned {r.status_code}"
