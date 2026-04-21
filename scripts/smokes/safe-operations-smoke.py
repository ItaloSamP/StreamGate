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

API_BASE_URL = os.environ.get("SMOKE_API_BASE_URL", "http://localhost:3000").rstrip("/")
OPERATOR_EMAIL = os.environ.get("SMOKE_OPERATOR_EMAIL", "operator@streamgate.local")
OPERATOR_PASSWORD = os.environ.get("SEED_OPERATOR_PASSWORD", "ChangeMe123!")
ADMIN_EMAIL = os.environ.get("SMOKE_ADMIN_EMAIL", "admin@streamgate.local")
ADMIN_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "ChangeMe123!")
SECOND_ADMIN_EMAIL = os.environ.get("SMOKE_SECOND_ADMIN_EMAIL", "second-admin@streamgate.local")
SECOND_ADMIN_PASSWORD = os.environ.get("SMOKE_SECOND_ADMIN_PASSWORD", "ChangeMe123!")
SMOKE_WEBHOOK_URL = os.environ.get("SMOKE_WEBHOOK_URL", "https://hooks.example.test/streamgate")
TIMEOUT_SECONDS = int(os.environ.get("SMOKE_HTTP_TIMEOUT_SECONDS", "60"))
WORKER_TIMEOUT_SECONDS = int(os.environ.get("SMOKE_WORKER_TIMEOUT_SECONDS", "180"))
POLL_INTERVAL_SECONDS = int(os.environ.get("SMOKE_POLL_INTERVAL_SECONDS", "3"))
SMOKE_STORAGE_PUBLIC_BASE_URL = os.environ.get("SMOKE_STORAGE_PUBLIC_BASE_URL", "").strip()


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

    request = urllib.request.Request(url=url, method=method, data=body, headers=merged_headers)
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            raw = response.read().decode("utf-8")
            if not raw:
                return {}
            return json.loads(raw)
    except (TimeoutError, socket.timeout) as error:
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

    request = urllib.request.Request(upload_url, data=content, method="PUT", headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            if response.status not in (200, 201, 204):
                raise RuntimeError(f"unexpected storage response status={response.status}")
    except (TimeoutError, socket.timeout) as error:
        raise RuntimeError(f"signed PUT timed out after {TIMEOUT_SECONDS}s on {upload_url}") from error
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"signed PUT failed status={error.code}") from error


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def login(email: str, password: str) -> dict[str, str]:
    session = request_json("POST", "/api/v1/auth/login", payload={"session": {"email": email, "password": password}})
    token = session.get("data", {}).get("session", {}).get("access_token")
    require(bool(token), f"missing access_token for {email}")
    return {"Authorization": f"Bearer {token}"}


def make_idempotency_key(prefix: str, suffix: str) -> str:
    return f"{prefix}-{suffix}-{random.randint(1000, 9999)}"


def with_idempotency(headers: dict[str, str], key: str) -> dict[str, str]:
    merged = dict(headers)
    merged["Idempotency-Key"] = key
    return merged


def create_upload_job(headers: dict[str, str], filename: str, csv_content: bytes) -> tuple[str, str]:
    checksum = hashlib.sha256(csv_content).hexdigest()
    signed = request_json(
        "POST",
        "/api/v1/uploads/signed-url",
        payload={
            "upload": {
                "filename": filename,
                "content_type": "text/csv",
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
    require(bool(upload_url), "missing upload_url in signed response")
    require(bool(storage_key), "missing storage_key in signed response")

    resolved_upload_url, host_header = resolve_upload_target(upload_url)
    upload_to_signed_url(resolved_upload_url, csv_content, required_headers, "text/csv", host_header=host_header)

    register = request_json(
        "POST",
        "/api/v1/uploads",
        payload={
            "upload": {
                "filename": filename,
                "content_type": "text/csv",
                "byte_size": len(csv_content),
                "checksum_sha256": checksum,
                "storage_key": storage_key,
                "metadata": {"smoke": True, "source": "safe-operations-smoke"},
            }
        },
        headers=headers,
    )

    upload_id = register.get("data", {}).get("upload", {}).get("id")
    job_id = register.get("data", {}).get("job", {}).get("id")
    require(bool(upload_id), "missing upload id in register response")
    require(bool(job_id), "missing job id in register response")
    return upload_id, job_id


def list_jobs(headers: dict[str, str], search: str) -> list[dict]:
    query = urllib.parse.urlencode({"page": 1, "per_page": 20, "search": search})
    return request_json("GET", f"/api/v1/jobs?{query}", headers=headers).get("data", [])


def wait_for_job_status(headers: dict[str, str], job_id: str, expected_status: str) -> dict:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    last_status = "missing"
    while time.time() < deadline:
        for job in list_jobs(headers, job_id):
            if isinstance(job, dict) and job.get("id") == job_id:
                last_status = str(job.get("status"))
                if last_status == expected_status:
                    return job
                if last_status == "failed" and expected_status != "failed":
                    raise RuntimeError(f"job {job_id} failed before reaching {expected_status}")
        time.sleep(POLL_INTERVAL_SECONDS)
    raise RuntimeError(f"job {job_id} did not reach {expected_status}; last_status={last_status}")


def wait_for_quarantine_record(headers: dict[str, str], job_id: str) -> dict:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    query = urllib.parse.urlencode({"job_id": job_id, "preset": "last_24h", "page": 1, "per_page": 20})
    while time.time() < deadline:
        data = request_json("GET", f"/api/v1/quarantine?{query}", headers=headers).get("data", [])
        for item in data:
            if isinstance(item, dict) and item.get("job_id") == job_id:
                return item
        time.sleep(POLL_INTERVAL_SECONDS)
    raise RuntimeError(f"quarantine record not found for job_id={job_id}")


def wait_for_artifacts(headers: dict[str, str], job_id: str) -> list[dict]:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    required_types = {"processed_dataset", "quality_report", "audit_report"}
    while time.time() < deadline:
        artifacts = request_json("GET", f"/api/v1/jobs/{job_id}/artifacts", headers=headers).get("data", [])
        by_type = {artifact.get("artifact_type"): artifact for artifact in artifacts if isinstance(artifact, dict)}
        if required_types.issubset(by_type.keys()) and all(by_type[name].get("status") == "available" for name in required_types):
            return artifacts
        time.sleep(POLL_INTERVAL_SECONDS)
    raise RuntimeError(f"artifacts did not become available for job_id={job_id}")


def ensure_notification_settings(headers: dict[str, str]) -> None:
    payload = {
        "notification_setting": {
            "in_app_enabled": True,
            "email_enabled": True,
            "webhook_enabled": True,
            "webhook_url": SMOKE_WEBHOOK_URL,
        }
    }
    data = request_json("PATCH", "/api/v1/notification-settings", payload=payload, headers=headers).get("data", {})
    require(data.get("webhook_enabled") is True, "webhook setting was not enabled")


def expect_notification(headers: dict[str, str], event_name: str, job_id: str | None = None, quarantine_id: str | None = None) -> dict:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    while time.time() < deadline:
        notifications = request_json("GET", "/api/v1/notifications?status=active", headers=headers).get("data", [])
        for notification in notifications:
            if not isinstance(notification, dict) or notification.get("event_name") != event_name:
                continue
            metadata = notification.get("metadata") or {}
            if job_id and metadata.get("job_id") != job_id:
                continue
            if quarantine_id and metadata.get("quarantine_id") != quarantine_id:
                continue
            return notification
        time.sleep(POLL_INTERVAL_SECONDS)
    raise RuntimeError(f"notification {event_name} was not found")


def expect_audit_event(headers: dict[str, str], action_name: str, auditable_id: str) -> dict:
    deadline = time.time() + WORKER_TIMEOUT_SECONDS
    query = urllib.parse.urlencode(
        {
            "preset": "last_24h",
            "action": action_name,
            "sort_by": "occurred_at",
            "sort_order": "desc",
            "page": 1,
            "per_page": 100,
        }
    )
    while time.time() < deadline:
        events = request_json("GET", f"/api/v1/audit?{query}", headers=headers).get("data", [])
        for event in events:
            if isinstance(event, dict) and event.get("auditable_id") == auditable_id and event.get("action") == action_name:
                return event
        time.sleep(POLL_INTERVAL_SECONDS)
    raise RuntimeError(f"audit event {action_name} for {auditable_id} was not found")


def create_dlq_payload(message_suffix: str, upload_id: str, job_id: str) -> dict:
    return {
        "event_id": f"event-{message_suffix}",
        "event_name": "upload.received.v1",
        "occurred_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "producer": "worker",
        "payload_version": 1,
        "correlation_id": f"req-{message_suffix}",
        "trace_id": f"trace-{message_suffix}",
        "request_id": f"req-{message_suffix}",
        "upload_id": upload_id,
        "job_id": job_id,
        "payload": {
            "storage_key": f"uploads/{message_suffix}.csv",
            "checksum_sha256": "a" * 64,
            "content_type": "text/csv",
            "byte_size": 128,
        },
    }


def main() -> int:
    suffix = f"{int(time.time())}-{random.randint(1000, 9999)}"

    log("[safe-smoke] login operator/admins")
    operator_headers = login(OPERATOR_EMAIL, OPERATOR_PASSWORD)
    admin_headers = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    approver_headers = login(SECOND_ADMIN_EMAIL, SECOND_ADMIN_PASSWORD)

    log("[safe-smoke] configure notification channels + webhook test")
    ensure_notification_settings(operator_headers)
    test_delivery = request_json(
        "POST",
        "/api/v1/notification-settings/webhook/test",
        payload={"operation": {"reason": "Smoke operacional de webhook."}},
        headers=with_idempotency(operator_headers, make_idempotency_key("webhook-test", suffix)),
    ).get("data", {})
    require(test_delivery.get("status") == "pending", "webhook test delivery was not queued")

    log("[safe-smoke] create completed job and wait artifacts")
    valid_upload_id, valid_job_id = create_upload_job(
        operator_headers,
        f"safe-smoke-valid-{suffix}.csv",
        b"order_id,amount\n1001,42\n1002,84\n",
    )
    completed_job = wait_for_job_status(operator_headers, valid_job_id, "completed")
    require(completed_job.get("status") == "completed", "valid job did not complete")
    artifacts = wait_for_artifacts(operator_headers, valid_job_id)
    artifact_types = {artifact.get("artifact_type") for artifact in artifacts if isinstance(artifact, dict)}
    require(
        {"processed_dataset", "quality_report", "audit_report"}.issubset(artifact_types),
        f"unexpected artifact types for job {valid_job_id}: {sorted(artifact_types)}",
    )
    dataset_artifact = next(artifact for artifact in artifacts if artifact.get("artifact_type") == "processed_dataset")
    download = request_json(
        "POST",
        f"/api/v1/jobs/{valid_job_id}/artifacts/{dataset_artifact['id']}/download-url",
        headers=operator_headers,
    ).get("data", {})
    require("X-Amz-Signature=" in str(download.get("download_url", "")), "artifact download url is missing signature")
    expect_notification(operator_headers, "job.completed", job_id=valid_job_id)
    expect_audit_event(admin_headers, "artifact.download_url_created", dataset_artifact["id"])

    log("[safe-smoke] create quarantined job and resolve quarantine")
    invalid_upload_id, invalid_job_id = create_upload_job(
        operator_headers,
        f"safe-smoke-invalid-{suffix}.csv",
        b"order_id,amount\n1001,42\n,\n1003,21\n",
    )
    quarantined_job = wait_for_job_status(operator_headers, invalid_job_id, "quarantined_with_warnings")
    require(quarantined_job.get("status") == "quarantined_with_warnings", "invalid job did not reach quarantine")
    quarantine_record = wait_for_quarantine_record(operator_headers, invalid_job_id)
    expect_notification(operator_headers, "job.quarantined_with_warnings", job_id=invalid_job_id)
    resolution = request_json(
        "POST",
        f"/api/v1/quarantine/{quarantine_record['id']}/resolve",
        payload={"operation": {"reason": "Smoke operacional: registro revisado."}},
        headers=with_idempotency(admin_headers, make_idempotency_key("resolve", suffix)),
    ).get("data", {})
    require(resolution.get("resolution_status") == "resolved", "quarantine resolution did not complete")
    expect_notification(operator_headers, "quarantine.resolved", job_id=invalid_job_id, quarantine_id=quarantine_record["id"])
    expect_audit_event(admin_headers, "quarantine.resolve", quarantine_record["id"])

    log("[safe-smoke] request retry on quarantined job")
    retry_response = request_json(
        "POST",
        f"/api/v1/jobs/{invalid_job_id}/retry",
        payload={"operation": {"reason": "Smoke operacional: retry controlado."}},
        headers=with_idempotency(admin_headers, make_idempotency_key("retry", suffix)),
    ).get("data", {})
    require(retry_response.get("status") == "retry_requested", "retry request was not accepted")
    expect_notification(operator_headers, "job.retry_requested", job_id=invalid_job_id)
    expect_audit_event(admin_headers, "job.retry_requested", invalid_job_id)

    log("[safe-smoke] create/approve/execute DLQ replay request")
    replay_request = request_json(
        "POST",
        f"/api/v1/quarantine/dlq/message-{suffix}/replay-requests",
        payload={
            "operation": {
                "reason": "Smoke operacional: solicitar replay DLQ.",
                "payload": create_dlq_payload(suffix, invalid_upload_id, invalid_job_id),
            }
        },
        headers=with_idempotency(admin_headers, make_idempotency_key("replay-request", suffix)),
    ).get("data", {})
    require(replay_request.get("status") == "requested", "dlq replay request was not created")

    approved = request_json(
        "POST",
        f"/api/v1/dlq-replay-requests/{replay_request['id']}/approve",
        payload={"operation": {"reason": "Smoke operacional: aprovar replay."}},
        headers=with_idempotency(approver_headers, make_idempotency_key("replay-approve", suffix)),
    ).get("data", {})
    require(approved.get("status") == "approved", "dlq replay request was not approved")

    executed = request_json(
        "POST",
        f"/api/v1/dlq-replay-requests/{replay_request['id']}/execute",
        payload={"operation": {"reason": "Smoke operacional: executar replay."}},
        headers=with_idempotency(admin_headers, make_idempotency_key("replay-execute", suffix)),
    ).get("data", {})
    require(executed.get("status") == "executed", "dlq replay request was not executed")
    expect_audit_event(admin_headers, "dlq_replay.requested", replay_request["id"])
    expect_audit_event(admin_headers, "dlq_replay.approved", replay_request["id"])
    expect_audit_event(admin_headers, "dlq_replay.executed", replay_request["id"])

    log(
        "[safe-smoke] success "
        f"completed_job_id={valid_job_id} quarantined_job_id={invalid_job_id} "
        f"quarantine_id={quarantine_record['id']} replay_request_id={replay_request['id']}"
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"[safe-smoke] failed: {error}", file=sys.stderr)
        sys.exit(1)
