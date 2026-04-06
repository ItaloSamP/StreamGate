class CreateStreamgateDomainFoundations < ActiveRecord::Migration[8.1]
  def change
    create_table :users, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.string :email, null: false
      t.string :full_name, null: false
      t.string :role, null: false, default: "operator"
      t.string :status, null: false, default: "invited"
      t.timestamps
    end

    create_table :uploads, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.references :user, null: false, type: :string, foreign_key: true
      t.string :filename, null: false
      t.string :content_type, null: false
      t.bigint :byte_size, null: false
      t.string :checksum_sha256, null: false
      t.string :storage_key, null: false
      t.string :status, null: false, default: "registered"
      t.string :sensitivity_level, null: false, default: "internal"
      t.string :request_id
      t.string :trace_id, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :jobs, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.references :upload, null: false, type: :string, foreign_key: true
      t.references :requested_by, null: false, type: :string, foreign_key: { to_table: :users }
      t.string :source_type, null: false, default: "upload"
      t.string :status, null: false, default: "pending"
      t.string :error_code
      t.string :error_category
      t.integer :quarantined_records_count, null: false, default: 0
      t.string :request_id
      t.string :trace_id, null: false
      t.timestamps
    end

    create_table :job_batches, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.references :job, null: false, type: :string, foreign_key: true
      t.integer :batch_number, null: false
      t.string :status, null: false, default: "pending"
      t.integer :input_rows, null: false, default: 0
      t.integer :valid_rows, null: false, default: 0
      t.integer :invalid_rows, null: false, default: 0
      t.string :trace_id, null: false
      t.timestamps
    end

    create_table :quarantine_records, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.references :job, null: false, type: :string, foreign_key: true
      t.references :job_batch, type: :string, foreign_key: true
      t.integer :row_number
      t.string :code, null: false
      t.text :message, null: false
      t.string :severity, null: false, default: "error"
      t.string :trace_id, null: false
      t.jsonb :payload, null: false, default: {}
      t.timestamps
    end

    create_table :processing_attempts, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.references :job, null: false, type: :string, foreign_key: true
      t.references :initiated_by, type: :string, foreign_key: { to_table: :users }
      t.references :source_attempt, type: :string, foreign_key: { to_table: :processing_attempts }
      t.integer :attempt_number, null: false
      t.string :status, null: false, default: "started"
      t.string :operation, null: false
      t.string :error_code
      t.boolean :retryable, null: false, default: false
      t.string :request_id
      t.string :trace_id, null: false
      t.datetime :started_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.datetime :finished_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :audit_events, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.references :actor, type: :string, foreign_key: { to_table: :users }
      t.string :auditable_type, null: false
      t.string :auditable_id, null: false
      t.string :action, null: false
      t.string :request_id, null: false
      t.string :trace_id, null: false
      t.datetime :occurred_at, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :uploads, :storage_key, unique: true
    add_index :uploads, :trace_id
    add_index :uploads, [ :user_id, :created_at ]
    add_index :jobs, :trace_id
    add_index :jobs, [ :upload_id, :status ]
    add_index :jobs, [ :requested_by_id, :created_at ]
    add_index :job_batches, [ :job_id, :batch_number ], unique: true
    add_index :job_batches, :trace_id
    add_index :quarantine_records, [ :job_id, :severity ]
    add_index :quarantine_records, :trace_id
    add_index :processing_attempts, [ :job_id, :attempt_number ], unique: true
    add_index :processing_attempts, :trace_id
    add_index :audit_events, [ :auditable_type, :auditable_id ]
    add_index :audit_events, :trace_id
    add_index :audit_events, [ :actor_id, :occurred_at ]

    add_check_constraint :uploads, "byte_size > 0", name: "uploads_byte_size_positive"
    add_check_constraint :job_batches, "batch_number > 0", name: "job_batches_batch_number_positive"
    add_check_constraint :job_batches, "input_rows >= 0 AND valid_rows >= 0 AND invalid_rows >= 0", name: "job_batches_counts_non_negative"
    add_check_constraint :processing_attempts, "attempt_number > 0", name: "processing_attempts_attempt_number_positive"
    add_check_constraint :quarantine_records, "row_number IS NULL OR row_number > 0", name: "quarantine_records_row_number_positive"
  end
end
