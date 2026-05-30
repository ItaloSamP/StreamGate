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

ActiveRecord::Schema[8.1].define(version: 2026_05_06_000100) do
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
    t.index ["job_id"], name: "index_analytics_job_snapshots_on_job_id", unique: true
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

  create_table "connector_ingestions", id: :string, force: :cascade do |t|
    t.bigint "byte_size"
    t.string "connector_profile_id", null: false
    t.string "content_type", null: false
    t.datetime "created_at", null: false
    t.string "drive_file_id"
    t.string "drive_folder_id"
    t.string "filename", null: false
    t.string "job_id", null: false
    t.text "last_error"
    t.jsonb "metadata", default: {}, null: false
    t.string "object_key"
    t.string "parent_ingestion_id"
    t.string "request_id"
    t.string "requested_by_id", null: false
    t.text "source_path"
    t.string "status", default: "pending", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.string "upload_id", null: false
    t.index ["connector_profile_id", "created_at"], name: "idx_on_connector_profile_id_created_at_39c8181692"
    t.index ["job_id"], name: "index_connector_ingestions_on_job_id", unique: true
    t.index ["parent_ingestion_id"], name: "index_connector_ingestions_on_parent_ingestion_id"
    t.index ["status", "created_at"], name: "index_connector_ingestions_on_status_and_created_at"
    t.index ["upload_id"], name: "index_connector_ingestions_on_upload_id", unique: true
  end

  create_table "connector_leases", id: :string, force: :cascade do |t|
    t.datetime "claimed_at"
    t.string "claimed_by"
    t.string "connector_ingestion_id", null: false
    t.string "connector_profile_id", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "request_id"
    t.string "status", default: "pending", null: false
    t.string "token_digest", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["connector_ingestion_id"], name: "index_connector_leases_on_connector_ingestion_id"
    t.index ["status", "expires_at"], name: "index_connector_leases_on_status_and_expires_at"
    t.index ["token_digest"], name: "index_connector_leases_on_token_digest", unique: true
  end

  create_table "connector_profiles", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "created_by_id", null: false
    t.string "kind", null: false
    t.string "name", null: false
    t.string "organization_id", null: false
    t.string "request_id"
    t.text "secret_payload", default: "{}", null: false
    t.jsonb "settings", default: {}, null: false
    t.string "status", default: "active", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "kind", "name"], name: "index_connector_profiles_on_organization_id_and_kind_and_name", unique: true
    t.index ["organization_id", "status"], name: "index_connector_profiles_on_organization_id_and_status"
  end

  create_table "dashboard_exports", id: :string, force: :cascade do |t|
    t.string "actor_id", null: false
    t.bigint "byte_size", default: 0, null: false
    t.string "checksum_sha256", null: false
    t.string "content_type", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "filename", null: false
    t.string "format", null: false
    t.datetime "generated_at", null: false
    t.string "kind", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "organization_id", null: false
    t.string "request_id"
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["actor_id", "generated_at"], name: "index_dashboard_exports_on_actor_id_and_generated_at"
    t.index ["expires_at"], name: "index_dashboard_exports_on_expires_at"
    t.index ["organization_id", "generated_at"], name: "index_dashboard_exports_on_organization_id_and_generated_at"
  end

  create_table "dlq_replay_requests", id: :string, force: :cascade do |t|
    t.text "approval_reason"
    t.datetime "approved_at"
    t.string "approved_by_id"
    t.datetime "created_at", null: false
    t.datetime "executed_at"
    t.string "executed_by_id"
    t.text "execution_reason"
    t.datetime "expires_at"
    t.text "last_error"
    t.string "message_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "outbox_event_id"
    t.jsonb "payload", default: {}, null: false
    t.text "reason", null: false
    t.string "request_id"
    t.string "requested_by_id", null: false
    t.string "status", default: "requested", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["approved_by_id"], name: "index_dlq_replay_requests_on_approved_by_id"
    t.index ["executed_by_id"], name: "index_dlq_replay_requests_on_executed_by_id"
    t.index ["message_id"], name: "index_dlq_replay_requests_on_message_id"
    t.index ["requested_by_id"], name: "index_dlq_replay_requests_on_requested_by_id"
    t.index ["status", "created_at"], name: "index_dlq_replay_requests_on_status_and_created_at"
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

  create_table "job_artifacts", id: :string, force: :cascade do |t|
    t.string "artifact_type", null: false
    t.bigint "byte_size", default: 0, null: false
    t.string "checksum_sha256"
    t.string "content_type", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.string "filename", null: false
    t.datetime "generated_at"
    t.string "job_id", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "request_id"
    t.string "status", default: "pending", null: false
    t.string "storage_key", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["job_id", "artifact_type"], name: "index_job_artifacts_on_job_id_and_artifact_type"
    t.index ["job_id"], name: "index_job_artifacts_on_job_id"
    t.index ["status", "expires_at"], name: "index_job_artifacts_on_status_and_expires_at"
    t.check_constraint "byte_size >= 0", name: "job_artifacts_byte_size_non_negative"
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

  create_table "malware_scans", id: :string, force: :cascade do |t|
    t.string "connector_ingestion_id"
    t.datetime "created_at", null: false
    t.string "job_id", null: false
    t.string "request_id"
    t.datetime "scanned_at"
    t.string "scanner", default: "clamav", null: false
    t.string "signature"
    t.string "status", default: "pending", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.string "upload_id", null: false
    t.index ["job_id", "status"], name: "index_malware_scans_on_job_id_and_status"
    t.index ["upload_id", "status"], name: "index_malware_scans_on_upload_id_and_status"
  end

  create_table "mfa_challenges", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.string "user_id", null: false
    t.datetime "verified_at"
    t.index ["token_digest"], name: "index_mfa_challenges_on_token_digest", unique: true
    t.index ["user_id", "expires_at"], name: "index_mfa_challenges_on_user_id_and_expires_at"
  end

  create_table "mfa_factors", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "enabled_at"
    t.string "factor_type", default: "totp", null: false
    t.datetime "last_verified_at"
    t.jsonb "recovery_code_digests", default: [], null: false
    t.text "secret_ciphertext", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.string "user_id", null: false
    t.index ["user_id", "status"], name: "index_mfa_factors_on_user_id_and_status"
  end

  create_table "notification_settings", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "email_enabled", default: false, null: false
    t.boolean "in_app_enabled", default: true, null: false
    t.jsonb "metadata", default: {}, null: false
    t.datetime "updated_at", null: false
    t.string "user_id", null: false
    t.boolean "webhook_enabled", default: false, null: false
    t.string "webhook_secret_digest"
    t.string "webhook_url"
    t.index ["user_id"], name: "index_notification_settings_on_user_id", unique: true
  end

  create_table "notifications", id: :string, force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.string "event_name", null: false
    t.datetime "expires_at"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "read_at"
    t.string "recipient_id", null: false
    t.string "request_id"
    t.string "status", default: "unread", null: false
    t.string "title", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["recipient_id", "created_at"], name: "index_notifications_on_recipient_id_and_created_at"
    t.index ["recipient_id"], name: "index_notifications_on_recipient_id"
    t.index ["status", "expires_at"], name: "index_notifications_on_status_and_expires_at"
  end

  create_table "oauth_authorization_states", id: :string, force: :cascade do |t|
    t.datetime "consumed_at"
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "organization_id", null: false
    t.string "provider", null: false
    t.jsonb "scopes", default: [], null: false
    t.string "state_digest", null: false
    t.datetime "updated_at", null: false
    t.string "user_id", null: false
    t.index ["state_digest"], name: "index_oauth_authorization_states_on_state_digest", unique: true
  end

  create_table "oauth_connections", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "organization_id", null: false
    t.string "provider", null: false
    t.text "refresh_token_ciphertext"
    t.datetime "revoked_at"
    t.jsonb "scopes", default: [], null: false
    t.string "status", default: "active", null: false
    t.datetime "token_expires_at"
    t.datetime "updated_at", null: false
    t.string "user_id", null: false
    t.index ["organization_id", "provider", "status"], name: "idx_oauth_connections_org_provider_status"
    t.index ["organization_id", "user_id", "provider"], name: "idx_oauth_connections_org_user_provider", unique: true
  end

  create_table "oidc_login_states", id: :string, force: :cascade do |t|
    t.datetime "consumed_at"
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "nonce", null: false
    t.string "oidc_provider_id", null: false
    t.string "organization_id", null: false
    t.string "redirect_uri"
    t.string "state_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "expires_at"], name: "index_oidc_login_states_on_organization_id_and_expires_at"
    t.index ["state_digest"], name: "index_oidc_login_states_on_state_digest", unique: true
  end

  create_table "oidc_providers", id: :string, force: :cascade do |t|
    t.string "client_id", null: false
    t.text "client_secret_ciphertext", null: false
    t.datetime "created_at", null: false
    t.string "hosted_domain", null: false
    t.string "issuer", null: false
    t.string "organization_id", null: false
    t.string "provider", default: "google_workspace", null: false
    t.jsonb "scopes", default: [], null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "provider"], name: "index_oidc_providers_on_organization_id_and_provider", unique: true
  end

  create_table "operational_action_idempotency_keys", id: :string, force: :cascade do |t|
    t.string "actor_id", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "key", null: false
    t.string "request_fingerprint", null: false
    t.string "request_id"
    t.jsonb "response_body", default: {}, null: false
    t.integer "response_status", null: false
    t.string "scope", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["actor_id", "scope", "key"], name: "idx_idempotency_actor_scope_key", unique: true
    t.index ["actor_id"], name: "index_operational_action_idempotency_keys_on_actor_id"
    t.index ["expires_at"], name: "index_operational_action_idempotency_keys_on_expires_at"
  end

  create_table "operational_warnings", id: :string, force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.text "dismiss_reason"
    t.datetime "dismissed_at"
    t.string "dismissed_by_id"
    t.datetime "expires_at", null: false
    t.string "job_id"
    t.text "last_error"
    t.text "message", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "organization_id"
    t.string "request_id"
    t.datetime "resolved_at"
    t.integer "retry_count", default: 0, null: false
    t.text "review_reason"
    t.datetime "reviewed_at"
    t.string "reviewed_by_id"
    t.string "severity", default: "warning", null: false
    t.string "status", default: "open", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.string "upload_id"
    t.index ["dismissed_by_id"], name: "index_operational_warnings_on_dismissed_by_id"
    t.index ["expires_at"], name: "index_operational_warnings_on_expires_at"
    t.index ["job_id", "created_at"], name: "index_operational_warnings_on_job_id_and_created_at"
    t.index ["organization_id", "created_at"], name: "index_operational_warnings_on_organization_id_and_created_at"
    t.index ["reviewed_by_id"], name: "index_operational_warnings_on_reviewed_by_id"
    t.index ["status", "created_at"], name: "index_operational_warnings_on_status_and_created_at"
    t.index ["trace_id"], name: "index_operational_warnings_on_trace_id"
    t.index ["upload_id", "created_at"], name: "index_operational_warnings_on_upload_id_and_created_at"
    t.check_constraint "retry_count >= 0", name: "operational_warnings_retry_count_non_negative"
  end

  create_table "organization_invites", id: :string, force: :cascade do |t|
    t.datetime "accepted_at"
    t.string "accepted_by_id"
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", null: false
    t.string "invited_by_id", null: false
    t.string "organization_id", null: false
    t.string "role", null: false
    t.string "status", default: "pending", null: false
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "email", "status"], name: "idx_org_invites_org_email_status"
    t.index ["token_digest"], name: "index_organization_invites_on_token_digest", unique: true
  end

  create_table "organization_memberships", id: :string, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "invited_by_id"
    t.datetime "joined_at"
    t.string "organization_id", null: false
    t.string "role", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.string "user_id", null: false
    t.index ["organization_id", "role"], name: "index_organization_memberships_on_organization_id_and_role"
    t.index ["organization_id", "user_id"], name: "idx_org_memberships_org_user", unique: true
    t.index ["user_id", "status"], name: "index_organization_memberships_on_user_id_and_status"
  end

  create_table "organization_usage_counters", id: :string, force: :cascade do |t|
    t.integer "connector_runs", default: 0, null: false
    t.datetime "created_at", null: false
    t.string "organization_id", null: false
    t.date "period_start", null: false
    t.datetime "updated_at", null: false
    t.bigint "upload_bytes", default: 0, null: false
    t.index ["organization_id", "period_start"], name: "idx_org_usage_counters_org_period", unique: true
  end

  create_table "organizations", id: :string, force: :cascade do |t|
    t.jsonb "compliance_profile", default: {}, null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.jsonb "quotas", default: {}, null: false
    t.integer "retention_days", default: 90, null: false
    t.jsonb "settings", default: {}, null: false
    t.string "slug", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_organizations_on_slug", unique: true
    t.index ["status"], name: "index_organizations_on_status"
  end

  create_table "permission_rules", id: :string, force: :cascade do |t|
    t.string "capability", null: false
    t.datetime "created_at", null: false
    t.string "created_by_id"
    t.boolean "enabled", default: true, null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "organization_id"
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "role", "capability"], name: "idx_on_organization_id_role_capability_a543fd4ee0", unique: true
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
    t.text "resolution_reason"
    t.string "resolution_status", default: "open", null: false
    t.datetime "resolved_at"
    t.string "resolved_by_id"
    t.integer "row_number"
    t.string "severity", default: "error", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_quarantine_records_on_created_at"
    t.index ["job_batch_id"], name: "index_quarantine_records_on_job_batch_id"
    t.index ["job_id", "severity"], name: "index_quarantine_records_on_job_id_and_severity"
    t.index ["job_id"], name: "index_quarantine_records_on_job_id"
    t.index ["resolution_status", "created_at"], name: "index_quarantine_records_on_resolution_status_and_created_at"
    t.index ["resolved_by_id"], name: "index_quarantine_records_on_resolved_by_id"
    t.index ["severity", "created_at"], name: "index_quarantine_records_on_severity_and_created_at"
    t.index ["trace_id"], name: "index_quarantine_records_on_trace_id"
    t.check_constraint "row_number IS NULL OR row_number > 0", name: "quarantine_records_row_number_positive"
  end

  create_table "realtime_events", id: :string, force: :cascade do |t|
    t.string "actor_id"
    t.datetime "created_at", null: false
    t.string "event_type", null: false
    t.datetime "expires_at", null: false
    t.datetime "occurred_at", null: false
    t.string "organization_id", null: false
    t.jsonb "payload", default: {}, null: false
    t.string "request_id"
    t.string "resource_id"
    t.string "resource_type"
    t.string "severity", default: "info", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_realtime_events_on_expires_at"
    t.index ["organization_id", "occurred_at"], name: "index_realtime_events_on_organization_id_and_occurred_at"
    t.index ["resource_type", "resource_id"], name: "index_realtime_events_on_resource_type_and_resource_id"
    t.index ["trace_id"], name: "index_realtime_events_on_trace_id"
  end

  create_table "retention_policies", id: :string, force: :cascade do |t|
    t.integer "clickhouse_days", default: 30, null: false
    t.datetime "created_at", null: false
    t.string "created_by_id"
    t.integer "dashboard_exports_days", default: 7, null: false
    t.integer "job_artifacts_days", default: 30, null: false
    t.jsonb "metadata", default: {}, null: false
    t.integer "operational_data_days", default: 90, null: false
    t.integer "operational_warnings_days", default: 30, null: false
    t.string "organization_id", null: false
    t.integer "realtime_events_days", default: 7, null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_retention_policies_on_organization_id", unique: true
  end

  create_table "upload_acquisitions", id: :string, force: :cascade do |t|
    t.bigint "byte_size"
    t.datetime "completed_at"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "job_id", null: false
    t.text "last_error"
    t.string "link_mode", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "request_id"
    t.datetime "requested_at", null: false
    t.string "source_host", null: false
    t.string "source_type", null: false
    t.string "status", default: "pending", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.string "upload_id", null: false
    t.string "url_hash", null: false
    t.text "url_masked", null: false
    t.index ["job_id"], name: "index_upload_acquisitions_on_job_id", unique: true
    t.index ["status", "created_at"], name: "index_upload_acquisitions_on_status_and_created_at"
    t.index ["trace_id"], name: "index_upload_acquisitions_on_trace_id"
    t.index ["upload_id"], name: "index_upload_acquisitions_on_upload_id", unique: true
    t.index ["url_hash"], name: "index_upload_acquisitions_on_url_hash"
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
    t.string "source_type", default: "upload", null: false
    t.string "status", default: "registered", null: false
    t.string "storage_key", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.string "user_id", null: false
    t.index ["source_type", "created_at"], name: "index_uploads_on_source_type_and_created_at"
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

  create_table "webhook_deliveries", id: :string, force: :cascade do |t|
    t.integer "attempts_count", default: 0, null: false
    t.string "channel", null: false
    t.datetime "created_at", null: false
    t.datetime "delivered_at"
    t.string "event_name", null: false
    t.text "last_error"
    t.datetime "next_attempt_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.string "notification_id"
    t.string "notification_setting_id", null: false
    t.jsonb "payload", default: {}, null: false
    t.string "request_id"
    t.integer "response_status"
    t.string "signature"
    t.string "status", default: "pending", null: false
    t.string "trace_id", null: false
    t.datetime "updated_at", null: false
    t.index ["event_name", "created_at"], name: "index_webhook_deliveries_on_event_name_and_created_at"
    t.index ["notification_id"], name: "index_webhook_deliveries_on_notification_id"
    t.index ["notification_setting_id"], name: "index_webhook_deliveries_on_notification_setting_id"
    t.index ["status", "next_attempt_at"], name: "index_webhook_deliveries_on_status_and_next_attempt_at"
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
  add_foreign_key "dlq_replay_requests", "users", column: "approved_by_id"
  add_foreign_key "dlq_replay_requests", "users", column: "executed_by_id"
  add_foreign_key "dlq_replay_requests", "users", column: "requested_by_id"
  add_foreign_key "job_artifacts", "jobs"
  add_foreign_key "job_batches", "jobs"
  add_foreign_key "jobs", "uploads"
  add_foreign_key "jobs", "users", column: "requested_by_id"
  add_foreign_key "malware_scans", "connector_ingestions"
  add_foreign_key "malware_scans", "jobs"
  add_foreign_key "malware_scans", "uploads"
  add_foreign_key "mfa_challenges", "users"
  add_foreign_key "mfa_factors", "users"
  add_foreign_key "notification_settings", "users"
  add_foreign_key "notifications", "users", column: "recipient_id"
  add_foreign_key "oauth_authorization_states", "organizations"
  add_foreign_key "oauth_authorization_states", "users"
  add_foreign_key "oauth_connections", "organizations"
  add_foreign_key "oauth_connections", "users"
  add_foreign_key "oidc_login_states", "oidc_providers"
  add_foreign_key "oidc_login_states", "organizations"
  add_foreign_key "oidc_providers", "organizations"
  add_foreign_key "operational_action_idempotency_keys", "users", column: "actor_id"
  add_foreign_key "operational_warnings", "jobs"
  add_foreign_key "operational_warnings", "uploads"
  add_foreign_key "organization_invites", "organizations"
  add_foreign_key "organization_invites", "users", column: "accepted_by_id"
  add_foreign_key "organization_invites", "users", column: "invited_by_id"
  add_foreign_key "organization_memberships", "organizations"
  add_foreign_key "organization_memberships", "users"
  add_foreign_key "organization_usage_counters", "organizations"
  add_foreign_key "processing_attempts", "jobs"
  add_foreign_key "processing_attempts", "processing_attempts", column: "source_attempt_id"
  add_foreign_key "processing_attempts", "users", column: "initiated_by_id"
  add_foreign_key "quarantine_records", "job_batches"
  add_foreign_key "quarantine_records", "jobs"
  add_foreign_key "quarantine_records", "users", column: "resolved_by_id"
  add_foreign_key "upload_acquisitions", "jobs"
  add_foreign_key "upload_acquisitions", "uploads"
  add_foreign_key "uploads", "users"
  add_foreign_key "webhook_deliveries", "notification_settings"
  add_foreign_key "webhook_deliveries", "notifications"
  add_foreign_key "worker_consumed_events", "jobs"
  add_foreign_key "worker_consumed_events", "uploads"
  add_foreign_key "worker_processing_metrics", "jobs"
end
