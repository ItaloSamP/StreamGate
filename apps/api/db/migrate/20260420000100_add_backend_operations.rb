class AddBackendOperations < ActiveRecord::Migration[8.1]
  def change
    create_table :job_artifacts, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.references :job, null: false, type: :string, foreign_key: true
      t.string :artifact_type, null: false
      t.string :status, null: false, default: "pending"
      t.string :storage_key, null: false
      t.string :filename, null: false
      t.string :content_type, null: false
      t.bigint :byte_size, null: false, default: 0
      t.string :checksum_sha256
      t.datetime :generated_at
      t.datetime :expires_at
      t.jsonb :metadata, null: false, default: {}
      t.string :trace_id, null: false
      t.string :request_id
      t.timestamps
    end

    add_index :job_artifacts, [ :job_id, :artifact_type ], if_not_exists: true
    add_index :job_artifacts, [ :status, :expires_at ], if_not_exists: true
    add_check_constraint :job_artifacts, "byte_size >= 0", name: "job_artifacts_byte_size_non_negative", if_not_exists: true

    create_table :notifications, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.references :recipient, null: false, type: :string, foreign_key: { to_table: :users }
      t.string :event_name, null: false
      t.string :title, null: false
      t.text :body, null: false
      t.string :status, null: false, default: "unread"
      t.datetime :read_at
      t.datetime :expires_at
      t.jsonb :metadata, null: false, default: {}
      t.string :trace_id, null: false
      t.string :request_id
      t.timestamps
    end

    add_index :notifications, [ :recipient_id, :created_at ], if_not_exists: true
    add_index :notifications, [ :status, :expires_at ], if_not_exists: true

    create_table :notification_settings, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.references :user, null: false, type: :string, foreign_key: true
      t.boolean :in_app_enabled, null: false, default: true
      t.boolean :email_enabled, null: false, default: false
      t.boolean :webhook_enabled, null: false, default: false
      t.string :webhook_url
      t.string :webhook_secret_digest
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :notification_settings, :user_id, unique: true, if_not_exists: true

    create_table :webhook_deliveries, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.references :notification, type: :string, foreign_key: true
      t.references :notification_setting, null: false, type: :string, foreign_key: true
      t.string :channel, null: false
      t.string :event_name, null: false
      t.string :status, null: false, default: "pending"
      t.integer :attempts_count, null: false, default: 0
      t.datetime :next_attempt_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.datetime :delivered_at
      t.integer :response_status
      t.text :last_error
      t.jsonb :payload, null: false, default: {}
      t.string :signature
      t.string :trace_id, null: false
      t.string :request_id
      t.timestamps
    end

    add_index :webhook_deliveries, [ :status, :next_attempt_at ], if_not_exists: true
    add_index :webhook_deliveries, [ :event_name, :created_at ], if_not_exists: true

    create_table :operational_action_idempotency_keys, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.references :actor, null: false, type: :string, foreign_key: { to_table: :users }
      t.string :key, null: false
      t.string :scope, null: false
      t.string :request_fingerprint, null: false
      t.integer :response_status, null: false
      t.jsonb :response_body, null: false, default: {}
      t.datetime :expires_at, null: false
      t.string :trace_id, null: false
      t.string :request_id
      t.timestamps
    end

    add_index :operational_action_idempotency_keys, [ :actor_id, :scope, :key ], unique: true, name: "idx_idempotency_actor_scope_key", if_not_exists: true
    add_index :operational_action_idempotency_keys, :expires_at, if_not_exists: true

    create_table :dlq_replay_requests, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.string :message_id, null: false
      t.string :status, null: false, default: "requested"
      t.references :requested_by, null: false, type: :string, foreign_key: { to_table: :users }
      t.references :approved_by, type: :string, foreign_key: { to_table: :users }
      t.references :executed_by, type: :string, foreign_key: { to_table: :users }
      t.text :reason, null: false
      t.text :approval_reason
      t.text :execution_reason
      t.datetime :approved_at
      t.datetime :executed_at
      t.datetime :expires_at
      t.string :outbox_event_id
      t.text :last_error
      t.jsonb :payload, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.string :trace_id, null: false
      t.string :request_id
      t.timestamps
    end

    add_index :dlq_replay_requests, [ :status, :created_at ], if_not_exists: true
    add_index :dlq_replay_requests, :message_id, if_not_exists: true

    add_column :quarantine_records, :resolution_status, :string, default: "open", null: false, if_not_exists: true
    add_column :quarantine_records, :resolution_reason, :text, if_not_exists: true
    add_reference :quarantine_records, :resolved_by, type: :string, foreign_key: { to_table: :users }, if_not_exists: true
    add_column :quarantine_records, :resolved_at, :datetime, if_not_exists: true
    add_index :quarantine_records, [ :resolution_status, :created_at ], if_not_exists: true
  end
end
