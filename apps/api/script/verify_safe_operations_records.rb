completed_job_id = ENV.fetch("SAFE_COMPLETED_JOB_ID")
completed_notification_id = ENV.fetch("SAFE_COMPLETED_NOTIFICATION_ID")
quarantined_job_id = ENV.fetch("SAFE_QUARANTINED_JOB_ID")
quarantine_id = ENV.fetch("SAFE_QUARANTINE_ID")
retry_notification_id = ENV.fetch("SAFE_RETRY_NOTIFICATION_ID")
replay_request_id = ENV.fetch("SAFE_REPLAY_REQUEST_ID")
webhook_test_trace_id = ENV.fetch("SAFE_WEBHOOK_TEST_TRACE_ID")

def assert_record!(condition, message)
  raise message unless condition
end

completed_notification = Notification.find_by(id: completed_notification_id)
assert_record!(!completed_notification.nil?, "notification job.completed nao encontrada")
assert_record!(completed_notification.event_name == "job.completed", "notification job.completed com event_name inesperado")
assert_record!((completed_notification.metadata || {})["job_id"] == completed_job_id, "notification job.completed sem job_id esperado")
assert_record!(completed_notification.trace_id.present? && completed_notification.request_id.present?, "notification job.completed sem trace/request id")

retry_notification = Notification.find_by(id: retry_notification_id)
assert_record!(!retry_notification.nil?, "notification job.retry_requested nao encontrada")
assert_record!(retry_notification.event_name == "job.retry_requested", "notification job.retry_requested com event_name inesperado")
assert_record!((retry_notification.metadata || {})["job_id"] == quarantined_job_id, "notification job.retry_requested sem job_id esperado")

resolved_notification = Notification.where(event_name: "quarantine.resolved").order(created_at: :desc).detect do |notification|
  metadata = notification.metadata || {}
  metadata["job_id"] == quarantined_job_id && metadata["quarantine_id"] == quarantine_id
end
assert_record!(!resolved_notification.nil?, "notification quarantine.resolved nao encontrada")

webhook_test_delivery = WebhookDelivery.where(event_name: "notification.webhook_test", channel: "webhook", trace_id: webhook_test_trace_id).order(created_at: :desc).first
assert_record!(!webhook_test_delivery.nil?, "delivery de teste de webhook nao encontrado")
assert_record!(%w[pending delivered failed].include?(webhook_test_delivery.status), "delivery de teste de webhook com status inesperado")

completed_deliveries = WebhookDelivery.where(event_name: "job.completed").order(created_at: :desc).select do |delivery|
  metadata = (delivery.payload || {})["metadata"] || {}
  metadata["job_id"] == completed_job_id
end
assert_record!(completed_deliveries.any? { |delivery| delivery.channel == "email" }, "delivery email de job.completed nao encontrado")
assert_record!(completed_deliveries.any? { |delivery| delivery.channel == "webhook" }, "delivery webhook de job.completed nao encontrado")
assert_record!(completed_deliveries.none? { |delivery| delivery.payload.to_json.downcase.include?("secret") }, "delivery de job.completed expos segredo no payload")

[
  [ "artifact.download_url_created", JobArtifact.where(job_id: completed_job_id, artifact_type: "processed_dataset").order(created_at: :desc).pick(:id) ],
  [ "worker.job.completed", completed_job_id ],
  [ "worker.job.quarantined", quarantined_job_id ],
  [ "quarantine.resolve", quarantine_id ],
  [ "job.retry_requested", quarantined_job_id ],
  [ "dlq_replay.requested", replay_request_id ],
  [ "dlq_replay.approved", replay_request_id ],
  [ "dlq_replay.executed", replay_request_id ]
].each do |action, auditable_id|
  assert_record!(auditable_id.present?, "auditable_id ausente para #{action}")
  event = AuditEvent.where(action: action, auditable_id: auditable_id).order(occurred_at: :desc).first
  assert_record!(!event.nil?, "audit event #{action} nao encontrado")
  assert_record!(event.trace_id.present? && event.request_id.present?, "audit event #{action} sem trace/request id")
end

puts({
  ok: true,
  completed_job_id:,
  quarantined_job_id:,
  replay_request_id:
}.to_json)
