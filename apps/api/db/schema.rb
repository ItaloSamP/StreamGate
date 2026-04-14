# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_13_000600) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "analytics_job_snapshots", id: :string, force: :cascade do |t|
    t.string "actor_id", null: false
    t.datetime "created_at", null: false
    t.datetime "job_created_at", null: false
    t.string "job_id", null: false
    t.datetime "last_synced_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.string "organization_id", null: false
    t.integer "quarantined_records_count", default: 0, null: false
    t.string "source_type", null: false
    t.string "status", null: false
    t.datetime "updated_at", null: false
    t.string "upload_id", null: false
    t.index ["actor_id", "job_created_at"], name: "index_analytics_job_snapshots_on_actor_id_and_job_created_at"
    t.index ["actor_id"], name: "index_analytics_job_snapshots_on_actor_id"
    t.index ["job_created_at", "status"], name: "index_analytics_job_snapshots_on_job_created_at_and_status"
    t.index ["job_id"], name: "index_analytics_job_snapshots_on_job_id"
    t.index ["organization_id", "job_created_at"], name: "idx_on_organization_id_job_created_at_8ecb6ddbb2"
    t.index ["source_type", "job_created_at"], name: "idx_on_source_type_job_created_at_fece9eb76e"
    t.index ["upload_id"], name: "index_analytics_job_snapshots_on_upload_id"
  end

  create_table "audit_events", id: :string, force: :cascade do |t|
    t.string "action", null: false
    t.string "actor_id"
    t.string "auditable_id", null: false
    t.string "auditable_type", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "occurred_at", null: false
    t.string "request_id", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["action", "occurred_at"], name: "index_audit_events_on_action_and_occurred_at"
    t.index ["actor_id", "occurred_at"], name: "index_audit_events_on_actor_id_and_occurred_at"
    t.index ["actor_id"], name: "index_audit_events_on_actor_id"
    t.index ["auditable_type", "auditable_id"], name: "index_audit_events_on_auditable_type_and_auditable_id"
    t.index ["auditable_type", "occurred_at"], name: "index_audit_events_on_auditable_type_and_occurred_at"
    t.index ["occurred_at"], name: "index_audit_events_on_occurred_at"
    t.index ["trace_id"], name: "index_audit_events_on_trace_id"
  end

  create_table "auth_sessions", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "ip_address"
    t.datetime "last_seen_at"
    t.string "request_id"
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.string "user_id", null: false
    t.index ["expires_at"], name: "index_auth_sessions_on_expires_at"
    t.index ["token_digest"], name: "index_auth_sessions_on_token_digest", unique: true
    t.index ["trace_id"], name: "index_auth_sessions_on_trace_id"
    t.index ["user_id", "created_at"], name: "index_auth_sessions_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_auth_sessions_on_user_id"
    t.check_constraint "expires_at > created_at", name: "auth_sessions_expires_after_create"
  end

  create_table "integration_outbox_events", id: :string, force: :cascade do |t|
    t.integer "attempts_count", default: 0, null: false
    t.datetime "available_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "created_at", null: false
    t.datetime "dispatched_at"
    t.string "event_id", null: false
    t.string "event_name", null: false
    t.jsonb "headers", default: {}, null: false
    t.text "last_error"
    t.jsonb "payload", default: {}, null: false
    t.string "request_id", null: false
    t.string "routing_key", null: false
    t.string "status", default: "pending", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_integration_outbox_events_on_event_id", unique: true
    t.index ["status", "available_at"], name: "index_integration_outbox_events_on_status_and_available_at"
    t.index ["trace_id"], name: "index_integration_outbox_events_on_trace_id"
  end

  create_table "job_batches", id: :string, force: :cascade do |t|
    t.integer "batch_number", null: false
    t.datetime "created_at", null: false
    t.integer "input_rows", default: 0, null: false
    t.integer "invalid_rows", default: 0, null: false
    t.string "job_id", null: false
    t.string "status", default: "pending", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.integer "valid_rows", default: 0, null: false
    t.index ["job_id", "batch_number"], name: "index_job_batches_on_job_id_and_batch_number", unique: true
    t.index ["job_id"], name: "index_job_batches_on_job_id"
    t.index ["trace_id"], name: "index_job_batches_on_trace_id"
    t.check_constraint "batch_number > 0", name: "job_batches_batch_number_positive"
    t.check_constraint "input_rows >= 0 AND valid_rows >= 0 AND invalid_rows >= 0", name: "job_batches_counts_non_negative"
  end

  create_table "jobs", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "error_category"
    t.string "error_code"
    t.integer "quarantined_records_count", default: 0, null: false
    t.string "request_id"
    t.string "requested_by_id", null: false
    t.string "source_type", default: "upload", null: false
    t.string "status", default: "pending", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.string "upload_id", null: false
    t.index ["created_at"], name: "index_jobs_on_created_at"
    t.index ["requested_by_id", "created_at"], name: "index_jobs_on_requested_by_id_and_created_at"
    t.index ["requested_by_id"], name: "index_jobs_on_requested_by_id"
    t.index ["status", "created_at"], name: "index_jobs_on_status_and_created_at"
    t.index ["trace_id"], name: "index_jobs_on_trace_id"
    t.index ["upload_id", "status"], name: "index_jobs_on_upload_id_and_status"
    t.index ["upload_id"], name: "index_jobs_on_upload_id"
  end

  create_table "processing_attempts", id: :string, force: :cascade do |t|
    t.integer "attempt_number", null: false
    t.datetime "created_at", null: false
    t.string "error_code"
    t.datetime "finished_at"
    t.string "initiated_by_id"
    t.string "job_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "operation", null: false
    t.string "request_id"
    t.boolean "retryable", default: false, null: false
    t.string "source_attempt_id"
    t.datetime "started_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.string "status", default: "started", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["initiated_by_id"], name: "index_processing_attempts_on_initiated_by_id"
    t.index ["job_id", "attempt_number"], name: "index_processing_attempts_on_job_id_and_attempt_number", unique: true
    t.index ["job_id"], name: "index_processing_attempts_on_job_id"
    t.index ["source_attempt_id"], name: "index_processing_attempts_on_source_attempt_id"
    t.index ["trace_id"], name: "index_processing_attempts_on_trace_id"
    t.check_constraint "attempt_number > 0", name: "processing_attempts_attempt_number_positive"
  end

  create_table "quarantine_records", id: :string, force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "job_batch_id"
    t.string "job_id", null: false
    t.text "message", null: false
    t.jsonb "payload", default: {}, null: false
    t.integer "row_number"
    t.string "severity", default: "error", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_quarantine_records_on_created_at"
    t.index ["job_batch_id"], name: "index_quarantine_records_on_job_batch_id"
    t.index ["job_id", "severity"], name: "index_quarantine_records_on_job_id_and_severity"
    t.index ["job_id"], name: "index_quarantine_records_on_job_id"
    t.index ["severity", "created_at"], name: "index_quarantine_records_on_severity_and_created_at"
    t.index ["trace_id"], name: "index_quarantine_records_on_trace_id"
    t.check_constraint "row_number IS NULL OR row_number > 0", name: "quarantine_records_row_number_positive"
  end

  create_table "uploads", id: :string, force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum_sha256", null: false
    t.string "content_type", null: false
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "request_id"
    t.string "sensitivity_level", default: "internal", null: false
    t.string "status", default: "registered", null: false
    t.string "storage_key", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.string "user_id", null: false
    t.index ["storage_key"], name: "index_uploads_on_storage_key", unique: true
    t.index ["trace_id"], name: "index_uploads_on_trace_id"
    t.index ["user_id", "created_at"], name: "index_uploads_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_uploads_on_user_id"
    t.check_constraint "byte_size > 0", name: "uploads_byte_size_positive"
  end

  create_table "users", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "full_name", null: false
    t.string "organization_id", default: "org_default", null: false
    t.string "password_digest"
    t.datetime "password_reset_sent_at"
    t.string "password_reset_token_digest"
    t.string "role", default: "operator", null: false
    t.string "status", default: "invited", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["organization_id", "role"], name: "index_users_on_organization_id_and_role"
    t.index ["organization_id"], name: "index_users_on_organization_id"
    t.index ["password_reset_token_digest"], name: "index_users_on_password_reset_token_digest", unique: true
  end

  create_table "worker_consumed_events", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "event_id", null: false
    t.string "event_name", null: false
    t.string "job_id", null: false
    t.datetime "processed_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.string "request_id", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.string "upload_id", null: false
    t.index ["event_id"], name: "index_worker_consumed_events_on_event_id", unique: true
    t.index ["job_id", "processed_at"], name: "index_worker_consumed_events_on_job_id_and_processed_at"
    t.index ["job_id"], name: "index_worker_consumed_events_on_job_id"
    t.index ["trace_id"], name: "index_worker_consumed_events_on_trace_id"
    t.index ["upload_id"], name: "index_worker_consumed_events_on_upload_id"
  end

  create_table "worker_processing_metrics", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "error_class"
    t.string "error_code"
    t.string "event_id", null: false
    t.string "job_id", null: false
    t.boolean "moved_to_dlq", default: false, null: false
    t.datetime "processed_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.integer "processing_latency_ms", default: 0, null: false
    t.integer "retry_count", default: 0, null: false
    t.string "status", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_worker_processing_metrics_on_event_id"
    t.index ["job_id"], name: "index_worker_processing_metrics_on_job_id"
    t.index ["moved_to_dlq", "processed_at"], name: "idx_on_moved_to_dlq_processed_at_8ebd45980c"
    t.index ["processed_at"], name: "index_worker_processing_metrics_on_processed_at"
    t.index ["status", "processed_at"], name: "index_worker_processing_metrics_on_status_and_processed_at"
  end

  add_foreign_key "analytics_job_snapshots", "jobs"
  add_foreign_key "analytics_job_snapshots", "uploads"
  add_foreign_key "analytics_job_snapshots", "users", column: "actor_id"
  add_foreign_key "audit_events", "users", column: "actor_id"
  add_foreign_key "auth_sessions", "users"
  add_foreign_key "job_batches", "jobs"
  add_foreign_key "jobs", "uploads"
  add_foreign_key "jobs", "users", column: "requested_by_id"
  add_foreign_key "processing_attempts", "jobs"
  add_foreign_key "processing_attempts", "processing_attempts", column: "source_attempt_id"
  add_foreign_key "processing_attempts", "users", column: "initiated_by_id"
  add_foreign_key "quarantine_records", "job_batches"
  add_foreign_key "quarantine_records", "jobs"
  add_foreign_key "uploads", "users"
  add_foreign_key "worker_consumed_events", "jobs"
  add_foreign_key "worker_consumed_events", "uploads"
  add_foreign_key "worker_processing_metrics", "jobs"
end
