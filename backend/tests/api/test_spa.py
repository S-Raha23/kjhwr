from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import create_app

INDEX_HTML = "<html><body>portal</body></html>"


@pytest.fixture()
def client(tmp_path: Path) -> TestClient:
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text("console.log(1)")
    (tmp_path / "index.html").write_text(INDEX_HTML)
    (tmp_path / "favicon.svg").write_text("<svg/>")
    return TestClient(create_app(static_dir=tmp_path))


def test_root_and_deep_links_serve_the_spa(client: TestClient) -> None:
    assert client.get("/").text == INDEX_HTML
    assert client.get("/?start=2026-01-09&mode=horizon").text == INDEX_HTML
    assert client.get("/some/deep/link").text == INDEX_HTML


def test_assets_and_root_files_are_served(client: TestClient) -> None:
    assert client.get("/assets/app.js").text == "console.log(1)"
    assert client.get("/favicon.svg").text == "<svg/>"


def test_unknown_api_paths_are_404_not_the_spa(client: TestClient) -> None:
    assert client.get("/api/nope").status_code == 404
    assert client.get("/api/nope").headers["content-type"].startswith("application/json")


def test_api_still_works_alongside_the_spa(client: TestClient) -> None:
    with client:
        assert client.get("/api/health").json()["status"] == "ok"


def test_path_traversal_does_not_leak_files(client: TestClient, tmp_path: Path) -> None:
    (tmp_path.parent / "secret.txt").write_text("secret")
    response = client.get("/..%2Fsecret.txt")
    assert "secret" not in response.text


def test_without_a_build_the_app_serves_only_the_api() -> None:
    client = TestClient(create_app(static_dir=Path("does-not-exist")))
    assert client.get("/").status_code == 404
