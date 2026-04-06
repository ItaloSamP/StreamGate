default_operator_password = ENV.fetch("SEED_OPERATOR_PASSWORD", "ChangeMe123!")

operator = User.find_or_create_by!(email: "operator@streamgate.local") do |user|
  user.full_name = "StreamGate Operator"
  user.role = :operator
  user.status = :active
  user.password = default_operator_password
  user.password_confirmation = default_operator_password
end

if operator.password_digest.blank?
  operator.update!(password: default_operator_password, password_confirmation: default_operator_password)
end

result = Uploads::RegisterUploadService.call(
  user: operator,
  filename: "sample-import.csv",
  content_type: "text/csv",
  byte_size: 2048,
  checksum_sha256: "4f16e1f2e91c3b6b8fdd8d4ac6b6ac1ac3d6f68b0c4d9843791d7c7f7c6b5a3a",
  storage_key: "uploads/sample-import.csv",
  metadata: { source: "seeds" },
  request_id: "req_seed_sprint_1",
  trace_id: "trace_seed_sprint_1"
)

job = result.job
batch = job.job_batches.find_or_create_by!(batch_number: 1) do |record|
  record.status = :pending
  record.input_rows = 100
  record.valid_rows = 0
  record.invalid_rows = 0
  record.trace_id = job.trace_id
end

ProcessingAttempt.find_or_create_by!(job: job, attempt_number: 1) do |attempt|
  attempt.initiated_by = operator
  attempt.operation = "worker.process_upload"
  attempt.status = :started
  attempt.trace_id = job.trace_id
  attempt.request_id = job.request_id
  attempt.metadata = { seed: true, batch_id: batch.id }
end
