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

ActiveRecord::Schema[8.1].define(version: 2026_04_06_000100) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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
    t.index ["actor_id", "occurred_at"], name: "index_audit_events_on_actor_id_and_occurred_at"
    t.index ["actor_id"], name: "index_audit_events_on_actor_id"
    t.index ["auditable_type", "auditable_id"], name: "index_audit_events_on_auditable_type_and_auditable_id"
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
    t.index ["requested_by_id", "created_at"], name: "index_jobs_on_requested_by_id_and_created_at"
    t.index ["requested_by_id"], name: "index_jobs_on_requested_by_id"
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
    t.index ["job_batch_id"], name: "index_quarantine_records_on_job_batch_id"
    t.index ["job_id", "severity"], name: "index_quarantine_records_on_job_id_and_severity"
    t.index ["job_id"], name: "index_quarantine_records_on_job_id"
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
    t.string "password_digest"
    t.datetime "password_reset_sent_at"
    t.string "password_reset_token_digest"
    t.string "role", default: "operator", null: false
    t.string "status", default: "invited", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["password_reset_token_digest"], name: "index_users_on_password_reset_token_digest", unique: true
  end

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
end
