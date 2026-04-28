import json
import os
import random
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
import http.client

API_BASE_URL = os.environ.get("SMOKE_API_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
OPERATOR_EMAIL = os.environ.get("SMOKE_OPERATOR_EMAIL", "operator@streamgate.local")
OPERATOR_PASSWORD = os.environ.get("SEED_OPERATOR_PASSWORD", "ChangeMe123!")
PUBLIC_LINK_URL = os.environ.get("SMOKE_PUBLIC_LINK_URL", "").strip()
TIMEOUT_SECONDS = int(os.environ.get("SMOKE_HTTP_TIMEOUT_SECONDS", "60"))
WORKER_TIMEOUT_SECONDS = int(os.environ.get("SMOKE_WORKER_TIMEOUT_SECONDS", "180"))
POLL_INTERVAL_SECONDS = int(os.environ.get("SMOKE_POLL_INTERVAL_SECONDS", "3"))
HTTP_RETRY_ATTEMPTS = int(os.environ.get("SMOKE_HTTP_RETRY_ATTEMPTS", "4"))
HTTP_RETRY_DELAY_SECONDS = float(os.environ.get("SMOKE_HTTP_RETRY_DELAY_SECONDS", "2"))
HTTP_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def log(message: str) -> None:
    print(message, flush=True)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def request_json(method: str, path_or_url: str, payload: dict | None = None, headers: dict[str, str] | None = None) -> dict:
    url = path_or_url if path_or_url.startswith(("http://", "https://")) else f"{API_BASE_URL}{path_or_url}"
    body = None
    merged_headers = {"Accept": "application/json"}
    if headers:
        merged_headers.update(headers)
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        merged_headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url=url, method=method, data=body, headers=merged_headers)
    for attempt in range(1, HTTP_RETRY_ATTEMPTS + 1):
        try:
            with HTTP_OPENER.open(request, timeout=TIMEOUT_SECONDS) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as error:
            payload_text = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {error.code} on {method} {url}: {payload_text}") from error
        except (TimeoutError, socket.timeout, urllib.error.URLError, http.client.RemoteDisconnected) as error:
            if attempt == HTTP_RETRY_ATTEMPTS:
                raise RuntimeError(f"request failed on {method} {url}: {error}") from error
            time.sleep(HTTP_RETRY_DELAY_SECONDS)

    raise RuntimeError(f"request retries exhausted on {method} {url}")


def candidate_passwords(primary: str) -> list[str]:
    values = [primary, "TrocaNdo123!", "ChangeMe123!"]
    unique_values: list[str] = []
    for value in values:
        if value and value not in unique_values:
            unique_values.append(value)
    return unique_values


def login_operator() -> dict[str, str]:
    token = None
    for password in candidate_passwords(OPERATOR_PASSWORD):
        try:
            response = request_json("POST", "/api/v1/auth/login", payload={"session": {"email": OPERATOR_EMAIL, "password": password}})
            token = response.get("data", {}).get("session", {}).get("access_token")
            if token:
                break
        except RuntimeError as error:
            if "Credenciais invalidas" not in str(error):
                raise
    require(bool(token), "missing access_token in login response")
    return {"Authorization": f"Bearer {token}"}


def ensure_notification_setting(headers: dict[str, str]) -> None:
    setting = request_json("GET", "/api/v1/notification-settings", headers=headers).get("data", {})
    require(setting.get("in_app_enabled") is True, f"in-app notifications are not enabled: {setting}")


def with_idempotency(headers: dict[str, str], key: str) -> dict[str, str]:
    merged = dict(headers)
    merged["Idempotency-Key"] = key
    return merged


def find_job(headers: dict[str, str], job_id: str) -> dict | None:
    query = urllib.parse.urlencode({"page": 1, "per_page": 20, "search": job_id})
    jobs = request_json("GET", f"/api/v1/jobs?{query}", headers=headers).get("data", [])
    for item in jobs:
        if isinstance(item, dict) and item.get("id") == job_id:
            return item
    return None


def wait_for_job_status(headers: dict[str, str], job_id: str, expected_status: str) -> dict:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    last_status = "missing"
    while time.time() < deadline:
        job = find_job(headers, job_id)
        if job:
            last_status = str(job.get("status"))
            if last_status == expected_status:
                return job
            if last_status == "failed" and expected_status != "failed":
                raise RuntimeError(f"job {job_id} failed before reaching {expected_status}: {job}")
        time.sleep(POLL_INTERVAL_SECONDS)
    raise RuntimeError(f"job {job_id} did not reach {expected_status}; last_status={last_status}")


def wait_for_artifacts(headers: dict[str, str], job_id: str) -> list[dict]:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    required = {"processed_dataset", "quality_report", "audit_report"}
    while time.time() < deadline:
        artifacts = request_json("GET", f"/api/v1/jobs/{job_id}/artifacts", headers=headers).get("data", [])
        types = {item.get("artifact_type") for item in artifacts if isinstance(item, dict)}
        if required.issubset(types):
            return artifacts
        time.sleep(POLL_INTERVAL_SECONDS)
    raise RuntimeError(f"artifacts not available for job_id={job_id}")


def wait_for_notification(headers: dict[str, str], job_id: str) -> dict:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    while time.time() < deadline:
        notifications = request_json("GET", "/api/v1/notifications?status=active", headers=headers).get("data", [])
        for notification in notifications:
            if not isinstance(notification, dict):
                continue
            metadata = notification.get("metadata") or {}
            if notification.get("event_name") == "job.completed" and metadata.get("job_id") == job_id:
                return notification
        time.sleep(POLL_INTERVAL_SECONDS)
    raise RuntimeError(f"job.completed notification not found for job_id={job_id}")


def assert_ssrf_block(headers: dict[str, str], suffix: str) -> None:
    try:
        request_json(
            "POST",
            "/api/v1/uploads/public-link",
            payload={"public_link": {"url": "http://127.0.0.1/private.csv", "filename": f"blocked-{suffix}.csv", "content_type": "text/csv"}},
            headers=with_idempotency(headers, f"smoke-public-link-ssrf-{suffix}"),
        )
    except RuntimeError as error:
        require("validation_failed" in str(error) or "HTTP 422" in str(error), f"unexpected SSRF rejection response: {error}")
        return

    raise RuntimeError("private public_link URL was accepted")


def main() -> int:
    require(bool(PUBLIC_LINK_URL), "SMOKE_PUBLIC_LINK_URL must point to a small public CSV file for public_link smoke")
    parsed = urllib.parse.urlparse(PUBLIC_LINK_URL)
    require(parsed.scheme in ("http", "https") and parsed.netloc, "SMOKE_PUBLIC_LINK_URL must be an absolute http(s) URL")

    suffix = f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}"
    filename = f"public-link-smoke-{suffix}.csv"

    log("[public-link-smoke] login operator")
    headers = login_operator()

    log("[public-link-smoke] ensure notification settings")
    ensure_notification_setting(headers)

    log("[public-link-smoke] assert SSRF block")
    assert_ssrf_block(headers, suffix)

    log("[public-link-smoke] create public_link upload")
    created = request_json(
        "POST",
        "/api/v1/uploads/public-link",
        payload={"public_link": {"url": PUBLIC_LINK_URL, "filename": filename, "content_type": "text/csv"}},
        headers=with_idempotency(headers, f"smoke-public-link-{suffix}"),
    )
    data = created.get("data", {})
    upload_id = data.get("upload", {}).get("id")
    job_id = data.get("job", {}).get("id")
    acquisition = data.get("acquisition", {})
    require(bool(upload_id), "missing upload id")
    require(bool(job_id), "missing job id")
    require(acquisition.get("link_mode") == "public_link", f"unexpected acquisition link_mode={acquisition}")
    require("?" not in json.dumps(data), "public_link response exposed query string")

    log("[public-link-smoke] wait worker completion")
    job = wait_for_job_status(headers, job_id, "completed")
    require(job.get("source_type") == "external_link", f"unexpected job source_type={job}")

    log("[public-link-smoke] verify artifacts and notification")
    artifacts = wait_for_artifacts(headers, job_id)
    notification = wait_for_notification(headers, job_id)

    log(
        "[public-link-smoke] success "
        f"upload_id={upload_id} job_id={job_id} "
        f"artifacts={len(artifacts)} notification_id={notification.get('id')}"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"[public-link-smoke] failed: {error}", file=sys.stderr)
        sys.exit(1)
