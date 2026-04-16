import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API_BASE_URL = os.environ.get("SMOKE_API_BASE_URL", "http://localhost:3000").rstrip("/")
OPERATOR_EMAIL = os.environ.get("SMOKE_OPERATOR_EMAIL", "operator@streamgate.local")
OPERATOR_PASSWORD = os.environ.get("SEED_OPERATOR_PASSWORD", "ChangeMe123!")
TIMEOUT_SECONDS = int(os.environ.get("SMOKE_HTTP_TIMEOUT_SECONDS", "20"))
SMOKE_STORAGE_PUBLIC_BASE_URL = os.environ.get("SMOKE_STORAGE_PUBLIC_BASE_URL", "").strip()


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
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
            raw = response.read().decode("utf-8")
            if not raw:
                return {}
            return json.loads(raw)
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

    req = urllib.request.Request(upload_url, data=content, method="PUT", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
            if response.status not in (200, 201, 204):
                raise RuntimeError(f"unexpected storage response status={response.status}")
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"signed PUT failed status={error.code}") from error


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def main() -> int:
    csv_content = b"order_id,amount\n1001,42\n"
    checksum = hashlib.sha256(csv_content).hexdigest()
    filename = "smoke-upload.csv"
    content_type = "text/csv"

    print("[smoke] login operator")
    login = request_json(
        "POST",
        "/api/v1/auth/login",
        payload={"session": {"email": OPERATOR_EMAIL, "password": OPERATOR_PASSWORD}},
    )
    token = login.get("data", {}).get("session", {}).get("access_token")
    require(bool(token), "missing access_token in login response")
    auth_headers = {"Authorization": f"Bearer {token}"}

    print("[smoke] request signed-url")
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
        headers=auth_headers,
    )

    signed_data = signed.get("data", {})
    upload_url = signed_data.get("upload_url")
    storage_key = signed_data.get("storage_key")
    required_headers = signed_data.get("required_headers", {})

    require(bool(upload_url), "missing upload_url in signed-url response")
    require(bool(storage_key), "missing storage_key in signed-url response")

    print("[smoke] put object on storage")
    resolved_upload_url, host_header = resolve_upload_target(upload_url)
    upload_to_signed_url(resolved_upload_url, csv_content, required_headers, content_type, host_header=host_header)

    print("[smoke] register upload + job")
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
                "metadata": {"smoke": True, "source": "ci"},
            }
        },
        headers=auth_headers,
    )

    upload_id = register.get("data", {}).get("upload", {}).get("id")
    job_id = register.get("data", {}).get("job", {}).get("id")
    require(bool(upload_id), "missing upload.id in register response")
    require(bool(job_id), "missing job.id in register response")

    print("[smoke] verify listings")
    uploads = request_json("GET", "/api/v1/uploads?page=1&per_page=20&search=smoke-upload", headers=auth_headers)
    jobs = request_json("GET", "/api/v1/jobs?page=1&per_page=20", headers=auth_headers)

    upload_ids = {item.get("id") for item in uploads.get("data", []) if isinstance(item, dict)}
    job_ids = {item.get("id") for item in jobs.get("data", []) if isinstance(item, dict)}

    require(upload_id in upload_ids, "registered upload not found in /uploads listing")
    require(job_id in job_ids, "registered job not found in /jobs listing")

    print(f"[smoke] success upload_id={upload_id} job_id={job_id}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:
        print(f"[smoke] failed: {error}", file=sys.stderr)
        sys.exit(1)
