import hashlib
import json
import os
import random
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
import http.client

API_BASE_URL = os.environ.get("SMOKE_API_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
OPERATOR_EMAIL = os.environ.get("SMOKE_OPERATOR_EMAIL", "operator@streamgate.local")
OPERATOR_PASSWORD = os.environ.get("SEED_OPERATOR_PASSWORD", "ChangeMe123!")
TIMEOUT_SECONDS = int(os.environ.get("SMOKE_HTTP_TIMEOUT_SECONDS", "60"))
WORKER_TIMEOUT_SECONDS = int(os.environ.get("SMOKE_WORKER_TIMEOUT_SECONDS", "180"))
POLL_INTERVAL_SECONDS = int(os.environ.get("SMOKE_POLL_INTERVAL_SECONDS", "3"))
SMOKE_STORAGE_PUBLIC_BASE_URL = os.environ.get("SMOKE_STORAGE_PUBLIC_BASE_URL", "").strip()
HTTP_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
HTTP_RETRY_ATTEMPTS = int(os.environ.get("SMOKE_HTTP_RETRY_ATTEMPTS", "4"))
HTTP_RETRY_DELAY_SECONDS = float(os.environ.get("SMOKE_HTTP_RETRY_DELAY_SECONDS", "2"))


def log(message: str) -> None:
    print(message, flush=True)


def request_json(method: str, path_or_url: str, payload: dict | None = None, headers: dict[str, str] | None = None) -> dict:
    is_absolute = path_or_url.startswith("http://") or path_or_url.startswith("https://")
    url = path_or_url if is_absolute else f"{API_BASE_URL}{path_or_url}"

    body = None
    merged_headers = {"Accept": "application/json"}
    if headers:
        merged_headers.update(headers)

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        merged_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url=url, method=method, data=body, headers=merged_headers)
    for attempt in range(1, HTTP_RETRY_ATTEMPTS + 1):
        try:
            with HTTP_OPENER.open(req, timeout=TIMEOUT_SECONDS) as response:
                raw = response.read().decode("utf-8")
                if not raw:
                    return {}
                return json.loads(raw)
        except (TimeoutError, socket.timeout) as error:
            if attempt == HTTP_RETRY_ATTEMPTS:
                raise RuntimeError(f"timed out after {TIMEOUT_SECONDS}s on {method} {url}") from error
        except urllib.error.HTTPError as error:
            payload_text = error.read().decode("utf-8", errors="replace")
            message = payload_text
            try:
                parsed = json.loads(payload_text)
                if isinstance(parsed, dict):
                    error_payload = parsed.get("error", {})
                    if isinstance(error_payload, dict):
                        message = error_payload.get("message") or payload_text
            except json.JSONDecodeError:
                pass
            raise RuntimeError(f"HTTP {error.code} on {method} {url}: {message}") from error
        except (urllib.error.URLError, http.client.RemoteDisconnected) as error:
            if attempt == HTTP_RETRY_ATTEMPTS:
                raise RuntimeError(f"connection failed on {method} {url}: {error}") from error

        time.sleep(HTTP_RETRY_DELAY_SECONDS)

    raise RuntimeError(f"request retries exhausted on {method} {url}")


def resolve_upload_target(upload_url: str) -> tuple[str, str | None]:
    parsed = urllib.parse.urlparse(upload_url)

    if SMOKE_STORAGE_PUBLIC_BASE_URL:
        public_base = urllib.parse.urlparse(SMOKE_STORAGE_PUBLIC_BASE_URL)
        resolved = urllib.parse.urlunparse(
            (
                public_base.scheme or parsed.scheme,
                public_base.netloc,
                parsed.path,
                parsed.params,
                parsed.query,
                parsed.fragment,
            )
        )
        return resolved, parsed.netloc

    if parsed.hostname == "minio":
        port = f":{parsed.port}" if parsed.port else ""
        resolved = urllib.parse.urlunparse((parsed.scheme, f"localhost{port}", parsed.path, parsed.params, parsed.query, parsed.fragment))
        return resolved, parsed.netloc

    return upload_url, None


def upload_to_signed_url(upload_url: str, content: bytes, required_headers: dict[str, str], content_type: str, host_header: str | None = None) -> None:
    headers = dict(required_headers or {})
    if not any(key.lower() == "content-type" for key in headers):
        headers["Content-Type"] = content_type
    if host_header:
        headers["Host"] = host_header

    req = urllib.request.Request(upload_url, data=content, method="PUT", headers=headers)
    try:
        with HTTP_OPENER.open(req, timeout=TIMEOUT_SECONDS) as response:
            if response.status not in (200, 201, 204):
                raise RuntimeError(f"unexpected storage response status={response.status}")
    except (TimeoutError, socket.timeout) as error:
        raise RuntimeError(f"signed PUT timed out after {TIMEOUT_SECONDS}s on {upload_url}") from error
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"signed PUT failed status={error.code}") from error


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


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
            login = request_json(
                "POST",
                "/api/v1/auth/login",
                payload={"session": {"email": OPERATOR_EMAIL, "password": password}},
            )
            token = login.get("data", {}).get("session", {}).get("access_token")
            if token:
                break
        except RuntimeError as error:
            if "Credenciais invalidas" not in str(error):
                raise
    require(bool(token), "missing access_token in login response")
    return {"Authorization": f"Bearer {token}"}


def analytics_jobs_total(headers: dict[str, str], window_from: datetime) -> int:
    window_to = datetime.now(timezone.utc) + timedelta(minutes=5)
    query = urllib.parse.urlencode(
        {
            "from": window_from.isoformat().replace("+00:00", "Z"),
            "to": window_to.isoformat().replace("+00:00", "Z"),
            "timezone": "UTC",
        }
    )
    analytics = request_json("GET", f"/api/v1/analytics?{query}", headers=headers)
    return int(analytics.get("data", {}).get("kpis", {}).get("jobs_total", 0))


def create_upload_job(headers: dict[str, str], filename: str, csv_content: bytes) -> tuple[str, str]:
    checksum = hashlib.sha256(csv_content).hexdigest()
    content_type = "text/csv"

    signed = request_json(
        "POST",
        "/api/v1/uploads/signed-url",
        payload={
            "upload": {
                "filename": filename,
                "content_type": content_type,
                "byte_size": len(csv_content),
                "checksum_sha256": checksum,
            }
        },
        headers=headers,
    )

    signed_data = signed.get("data", {})
    upload_url = signed_data.get("upload_url")
    storage_key = signed_data.get("storage_key")
    required_headers = signed_data.get("required_headers", {})

    require(bool(upload_url), "missing upload_url in signed-url response")
    require(bool(storage_key), "missing storage_key in signed-url response")

    resolved_upload_url, host_header = resolve_upload_target(upload_url)
    upload_to_signed_url(resolved_upload_url, csv_content, required_headers, content_type, host_header=host_header)

    register = request_json(
        "POST",
        "/api/v1/uploads",
        payload={
            "upload": {
                "filename": filename,
                "content_type": content_type,
                "byte_size": len(csv_content),
                "checksum_sha256": checksum,
                "storage_key": storage_key,
                "metadata": {"smoke": True, "source": "worker-operational-smoke"},
            }
        },
        headers=headers,
    )

    upload_id = register.get("data", {}).get("upload", {}).get("id")
    job_id = register.get("data", {}).get("job", {}).get("id")
    require(bool(upload_id), "missing upload.id in register response")
    require(bool(job_id), "missing job.id in register response")
    return upload_id, job_id


def find_job(headers: dict[str, str], job_id: str) -> dict | None:
    query = urllib.parse.urlencode({"page": 1, "per_page": 20, "search": job_id})
    jobs = request_json("GET", f"/api/v1/jobs?{query}", headers=headers)
    for item in jobs.get("data", []):
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


def wait_for_quarantine_record(headers: dict[str, str], job_id: str) -> dict:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    query = urllib.parse.urlencode({"job_id": job_id, "preset": "last_24h", "page": 1, "per_page": 20})

    while time.time() < deadline:
        quarantine = request_json("GET", f"/api/v1/quarantine?{query}", headers=headers)
        for item in quarantine.get("data", []):
            if isinstance(item, dict) and item.get("job_id") == job_id:
                return item
        time.sleep(POLL_INTERVAL_SECONDS)

    raise RuntimeError(f"quarantine record not found for job_id={job_id}")


def wait_for_analytics_delta(headers: dict[str, str], window_from: datetime, initial_total: int, expected_delta: int) -> int:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    last_total = initial_total

    while time.time() < deadline:
        last_total = analytics_jobs_total(headers, window_from)
        if last_total >= initial_total + expected_delta:
            return last_total
        time.sleep(POLL_INTERVAL_SECONDS)

    raise RuntimeError(f"analytics jobs_total did not increase by {expected_delta}; initial={initial_total} last={last_total}")


def main() -> int:
    suffix = f"{int(time.time())}-{random.randint(1000, 9999)}"
    window_from = datetime.now(timezone.utc) - timedelta(minutes=1)

    log("[worker-smoke] login operator")
    auth_headers = login_operator()
    initial_jobs_total = analytics_jobs_total(auth_headers, window_from)

    log("[worker-smoke] valid csv -> completed")
    valid_filename = f"worker-smoke-valid-{suffix}.csv"
    _, valid_job_id = create_upload_job(auth_headers, valid_filename, b"order_id,amount\n1001,42\n1002,84\n")
    valid_job = wait_for_job_status(auth_headers, valid_job_id, "completed")
    require(int(valid_job.get("quarantined_records_count", 0)) == 0, f"valid job has quarantine records: {valid_job}")

    log("[worker-smoke] csv with empty row -> quarantined_with_warnings")
    invalid_filename = f"worker-smoke-invalid-{suffix}.csv"
    _, invalid_job_id = create_upload_job(auth_headers, invalid_filename, b"order_id,amount\n1001,42\n,\n1003,21\n")
    invalid_job = wait_for_job_status(auth_headers, invalid_job_id, "quarantined_with_warnings")
    require(int(invalid_job.get("quarantined_records_count", 0)) >= 1, f"invalid job did not report quarantine count: {invalid_job}")
    quarantine_record = wait_for_quarantine_record(auth_headers, invalid_job_id)

    log("[worker-smoke] verify analytics delta")
    final_jobs_total = wait_for_analytics_delta(auth_headers, window_from, initial_jobs_total, 2)

    log(
        "[worker-smoke] success "
        f"valid_job_id={valid_job_id} invalid_job_id={invalid_job_id} "
        f"quarantine_record_id={quarantine_record.get('id')} analytics_jobs_total={final_jobs_total}"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"[worker-smoke] failed: {error}", file=sys.stderr)
        sys.exit(1)
