def ensure_seed_user(email:, full_name:, role:, password:, organization_id:)
  user = User.find_or_initialize_by(email: email)
  user.full_name = full_name
  user.role = role
  user.status = :active
  user.organization_id = organization_id
  user.password = password
  user.password_confirmation = password
  user.save!
  user
end

default_operator_password = ENV.fetch("SEED_OPERATOR_PASSWORD", "ChangeMe123!")
default_admin_password = ENV.fetch("SEED_ADMIN_PASSWORD", default_operator_password)

operator = ensure_seed_user(
  email: "operator@streamgate.local",
  full_name: "StreamGate Operator",
  role: :operator,
  password: default_operator_password,
  organization_id: "org_streamgate"
)

admin = ensure_seed_user(
  email: "admin@streamgate.local",
  full_name: "StreamGate Admin",
  role: :admin,
  password: default_admin_password,
  organization_id: "org_streamgate"
)

seed_trace_id = "trace_seed_sprint_1"
seed_request_id = "req_seed_sprint_1"

upload = Upload.find_or_initialize_by(storage_key: "uploads/sample-import.csv")
upload.assign_attributes(
  user: operator,
  filename: "sample-import.csv",
  content_type: "text/csv",
  byte_size: 2048,
  checksum_sha256: "4f16e1f2e91c3b6b8fdd8d4ac6b6ac1ac3d6f68b0c4d9843791d7c7f7c6b5a3a",
  metadata: { source: "seeds" },
  request_id: seed_request_id,
  trace_id: seed_trace_id
)
upload.save!

job = Job.find_or_initialize_by(upload: upload, source_type: "upload")
job.assign_attributes(
  requested_by: operator,
  request_id: seed_request_id,
  trace_id: seed_trace_id
)
job.save!

seed_occurred_at = Time.zone.parse("2026-04-06 00:00:00 UTC")

AuditEvent.find_or_create_by!(
  actor: operator,
  auditable: upload,
  action: "upload.registered",
  request_id: seed_request_id,
  trace_id: seed_trace_id,
  occurred_at: seed_occurred_at
) do |event|
  event.metadata = {
    upload_id: upload.id,
    job_id: job.id,
    filename: upload.filename
  }
end

batch = job.job_batches.find_or_create_by!(batch_number: 1) do |record|
  record.status = :pending
  record.input_rows = 100
  record.valid_rows = 0
  record.invalid_rows = 0
  record.trace_id = seed_trace_id
end

ProcessingAttempt.find_or_create_by!(job: job, attempt_number: 1) do |attempt|
  attempt.initiated_by = admin
  attempt.operation = "worker.process_upload"
  attempt.status = :started
  attempt.trace_id = seed_trace_id
  attempt.request_id = seed_request_id
  attempt.metadata = { seed: true, batch_id: batch.id }
end
